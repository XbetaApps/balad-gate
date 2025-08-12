export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** يجلب الجلسة من /api/test-session مع تمرير الكوكي/الأوث الواردة */
async function getSessionFromTestAPI(req) {
  const origin = new URL(req.url).origin;
  const url = new URL('/api/test-session', origin);
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      cookie: req.headers.get('cookie') || '',
      authorization: req.headers.get('authorization') || '',
      accept: 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

function isAdmin(session) {
  const roleId = session?.rawPayload?.role_id ?? session?.user?.role_id;
  return Number(roleId) === 4;
}

/** يحوّل range إلى {start,end} */
function computeWindow(range) {
  const now = new Date();
  let start = null;

  switch ((range || '').toLowerCase()) {
    case 'day':
    case 'd':
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
    case 'w':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
    case 'm':
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      break;
    case 'year':
    case 'y':
      start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      break;
    case 'all':
    case 'since_beginning':
    case '':
    default:
      start = null; // بدون فلترة زمنية
  }

  return {
    range: start ? (range || 'custom').toLowerCase() : 'all',
    start: start ? start.toISOString() : null,
    end: now.toISOString(),
  };
}

export async function GET(req) {
  try {
    // تحقّق الجلسة والصلاحيات
    const s = await getSessionFromTestAPI(req);
    if (!s?.authenticated) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (!isAdmin(s)) {
      return NextResponse.json({ error: 'ممنوع' }, { status: 403 });
    }

    // قراءة المدى الزمني من الاستعلام: range = day|week|month|year|all
    const url = new URL(req.url);
    const range = (url.searchParams.get('range') || 'all').toLowerCase();
    const win = computeWindow(range);
    const hasWindow = Boolean(win.start);

    // ---------- الاستعلامات (الإجمالي) ----------
    const [
      totalUsersRows,
      totalCommentsRows,
      totalStoresRows,
      totalAdsRows,
      totalOffersRows,

      // أعلى الأقسام ترتيبًا حسب عدد الإعلانات (Ads) - إجمالي
      categoriesByPostsRows,

      // التاغات الأكثر استخدامًا إجماليًا (ad_tags/store_tags/offer_tags)
      tagsByUsageRows,

      // التقييمات (كل الأهداف) - إجمالي
      ratingsAllRows,
      ratingsDistRows,

      // التقييمات (الإعلانات فقط) - إجمالي
      ratingsAdsRows,

      // الإعجابات (favorites) - إجمالي
      favoritesTotalRows,
      favoritesByTypeRows,
    ] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*)::int AS total FROM users;`,
      prisma.$queryRaw`SELECT COUNT(*)::int AS total FROM comments;`,
      prisma.$queryRaw`SELECT COUNT(*)::int AS total FROM stores;`,
      prisma.$queryRaw`SELECT COUNT(*)::int AS total FROM ads;`,
      prisma.$queryRaw`SELECT COUNT(*)::int AS total FROM offers;`,

      prisma.$queryRaw`
        SELECT
          c.id::text AS id,
          c.name     AS name,
          COUNT(a.id)::int AS posts_count
        FROM categories c
        LEFT JOIN ads a ON a.category_id = c.id
        GROUP BY c.id, c.name
        ORDER BY posts_count DESC, c.name ASC
        LIMIT 50;
      `,

      prisma.$queryRaw`
        WITH usage_union AS (
          SELECT tag_id FROM ad_tags
          UNION ALL
          SELECT tag_id FROM store_tags
          UNION ALL
          SELECT tag_id FROM offer_tags
        ),
        usage_totals AS (
          SELECT tag_id, COUNT(*)::int AS usage_count
          FROM usage_union
          GROUP BY tag_id
        )
        SELECT
          t.id::text AS id,
          t.name     AS name,
          COALESCE(u.usage_count, 0)::int AS usage_count
        FROM tags t
        LEFT JOIN usage_totals u ON u.tag_id = t.id
        ORDER BY usage_count DESC, t.name ASC
        LIMIT 50;
      `,

      prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS total_ratings,
          COALESCE(AVG(rating), 0)::float AS avg_rating
        FROM comments
        WHERE rating IS NOT NULL;
      `,
      prisma.$queryRaw`
        SELECT rating::int AS star, COUNT(*)::int AS count
        FROM comments
        WHERE rating IS NOT NULL
        GROUP BY rating
        ORDER BY rating;
      `,
      prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS total_ratings_ads,
          COALESCE(AVG(rating), 0)::float AS avg_rating_ads
        FROM comments
        WHERE rating IS NOT NULL
          AND LOWER(target_type) = 'ad';
      `,

      prisma.$queryRaw`SELECT COUNT(*)::int AS total FROM favorites;`,
      prisma.$queryRaw`
        SELECT item_type, COUNT(*)::int AS count
        FROM favorites
        GROUP BY item_type
        ORDER BY item_type;
      `,
    ]);

    // ---------- الاستعلامات (ضمن النافذة الزمنية) ----------
    let windowResults = null;
    if (hasWindow) {
      const startTs = win.start; // ISO string

      windowResults = await Promise.all([
        // مستخدمون جدد داخل النافذة
        prisma.$queryRaw`
          SELECT COUNT(*)::int AS total
          FROM users
          WHERE created_at >= ${startTs}::timestamptz;
        `,

        // تعليقات داخل النافذة
        prisma.$queryRaw`
          SELECT COUNT(*)::int AS total
          FROM comments
          WHERE created_at >= ${startTs}::timestamptz;
        `,

        // متاجر داخل النافذة
        prisma.$queryRaw`
          SELECT COUNT(*)::int AS total
          FROM stores
          WHERE created_at >= ${startTs}::timestamptz;
        `,

        // إعلانات داخل النافذة
        prisma.$queryRaw`
          SELECT COUNT(*)::int AS total
          FROM ads
          WHERE created_at >= ${startTs}::timestamptz;
        `,

        // عروض داخل النافذة
        prisma.$queryRaw`
          SELECT COUNT(*)::int AS total
          FROM offers
          WHERE created_at >= ${startTs}::timestamptz;
        `,

        // أعلى الأقسام وفق إعلانات أُنشئت داخل النافذة
        prisma.$queryRaw`
          SELECT
            c.id::text AS id,
            c.name     AS name,
            COUNT(a.id)::int AS posts_count
          FROM categories c
          LEFT JOIN ads a
            ON a.category_id = c.id
           AND a.created_at >= ${startTs}::timestamptz
          GROUP BY c.id, c.name
          ORDER BY posts_count DESC, c.name ASC
          LIMIT 50;
        `,

        // التاغات الأكثر استخدامًا داخل النافذة (حسب وقت إنشاء الكيان)
        prisma.$queryRaw`
          WITH
          ad_usage AS (
            SELECT at.tag_id
            FROM ad_tags at
            JOIN ads a ON a.id = at.ad_id
            WHERE a.created_at >= ${startTs}::timestamptz
          ),
          store_usage AS (
            SELECT st.tag_id
            FROM store_tags st
            JOIN stores s ON s.id = st.store_id
            WHERE s.created_at >= ${startTs}::timestamptz
          ),
          offer_usage AS (
            SELECT ot.tag_id
            FROM offer_tags ot
            JOIN offers o ON o.id = ot.offer_id
            WHERE o.created_at >= ${startTs}::timestamptz
          ),
          usage_union AS (
            SELECT tag_id FROM ad_usage
            UNION ALL
            SELECT tag_id FROM store_usage
            UNION ALL
            SELECT tag_id FROM offer_usage
          ),
          usage_totals AS (
            SELECT tag_id, COUNT(*)::int AS usage_count
            FROM usage_union
            GROUP BY tag_id
          )
          SELECT
            t.id::text AS id,
            t.name     AS name,
            COALESCE(u.usage_count, 0)::int AS usage_count
          FROM tags t
          LEFT JOIN usage_totals u ON u.tag_id = t.id
          ORDER BY usage_count DESC, t.name ASC
          LIMIT 50;
        `,

        // التقييمات داخل النافذة (كل الأهداف)
        prisma.$queryRaw`
          SELECT
            COUNT(*)::int AS total_ratings,
            COALESCE(AVG(rating), 0)::float AS avg_rating
          FROM comments
          WHERE rating IS NOT NULL
            AND created_at >= ${startTs}::timestamptz;
        `,
        prisma.$queryRaw`
          SELECT rating::int AS star, COUNT(*)::int AS count
          FROM comments
          WHERE rating IS NOT NULL
            AND created_at >= ${startTs}::timestamptz
          GROUP BY rating
          ORDER BY rating;
        `,

        // الإعجابات داخل النافذة
        prisma.$queryRaw`
          SELECT COUNT(*)::int AS total
          FROM favorites
          WHERE created_at >= ${startTs}::timestamptz;
        `,
        prisma.$queryRaw`
          SELECT item_type, COUNT(*)::int AS count
          FROM favorites
          WHERE created_at >= ${startTs}::timestamptz
          GROUP BY item_type
          ORDER BY item_type;
        `,
      ]);
    }

    // ---------- تجميع النتائج ----------
    const totalUsers = totalUsersRows?.[0]?.total ?? 0;
    const totalComments = totalCommentsRows?.[0]?.total ?? 0;
    const totalStores = totalStoresRows?.[0]?.total ?? 0;
    const totalAds = totalAdsRows?.[0]?.total ?? 0;
    const totalOffers = totalOffersRows?.[0]?.total ?? 0;

    const ratingsAll = ratingsAllRows?.[0] || { total_ratings: 0, avg_rating: 0 };
    const ratingsAds = ratingsAdsRows?.[0] || { total_ratings_ads: 0, avg_rating_ads: 0 };
    const ratingsDistribution = {};
    for (const r of ratingsDistRows || []) ratingsDistribution[r.star] = r.count;

    const favoritesTotal = favoritesTotalRows?.[0]?.total ?? 0;
    const favoritesByTypeMap = { ad: 0, store: 0, offer: 0 };
    for (const row of favoritesByTypeRows || []) {
      const t = (row.item_type || '').toLowerCase();
      if (t === 'ad' || t === 'store' || t === 'offer') favoritesByTypeMap[t] = row.count ?? 0;
    }

    // داخل النافذة (أو مساوي للإجمالي إن كانت all)
    let inWin = {
      users_new: totalUsers,
      comments_new: totalComments,
      stores_new: totalStores,
      ads_new: totalAds,
      offers_new: totalOffers,
      categoriesByPostsWindow: categoriesByPostsRows ?? [],
      tagsByUsageWindow: tagsByUsageRows ?? [],
      ratings_window_total: ratingsAll.total_ratings ?? 0,
      ratings_window_avg: ratingsAll.avg_rating ?? 0,
      ratings_window_distribution: ratingsDistribution,
      favorites_window_total: favoritesTotal,
      favorites_window_by_type: favoritesByTypeMap,
    };

    if (windowResults) {
      const [
        usersNewRows,
        commentsNewRows,
        storesNewRows,
        adsNewRows,
        offersNewRows,
        categoriesByPostsWinRows,
        tagsByUsageWinRows,
        ratingsWinRows,
        ratingsWinDistRows,
        favoritesWinTotalRows,
        favoritesWinByTypeRows,
      ] = windowResults;

      const ratingsWin = ratingsWinRows?.[0] || { total_ratings: 0, avg_rating: 0 };
      const ratingsWinDist = {};
      for (const r of ratingsWinDistRows || []) ratingsWinDist[r.star] = r.count;

      const favWinTotal = favoritesWinTotalRows?.[0]?.total ?? 0;
      const favWinByType = { ad: 0, store: 0, offer: 0 };
      for (const row of favoritesWinByTypeRows || []) {
        const t = (row.item_type || '').toLowerCase();
        if (t === 'ad' || t === 'store' || t === 'offer') favWinByType[t] = row.count ?? 0;
      }

      inWin = {
        users_new: usersNewRows?.[0]?.total ?? 0,
        comments_new: commentsNewRows?.[0]?.total ?? 0,
        stores_new: storesNewRows?.[0]?.total ?? 0,
        ads_new: adsNewRows?.[0]?.total ?? 0,
        offers_new: offersNewRows?.[0]?.total ?? 0,
        categoriesByPostsWindow: categoriesByPostsWinRows ?? [],
        tagsByUsageWindow: tagsByUsageWinRows ?? [],
        ratings_window_total: ratingsWin.total_ratings ?? 0,
        ratings_window_avg: ratingsWin.avg_rating ?? 0,
        ratings_window_distribution: ratingsWinDist,
        favorites_window_total: favWinTotal,
        favorites_window_by_type: favWinByType,
      };
    }

    // ---------- الاستجابة ----------
    return NextResponse.json(
      {
        window: win, // { range, start, end }
        users: {
          total: totalUsers,
          new_in_window: inWin.users_new,
        },
        comments: {
          total: totalComments,
          new_in_window: inWin.comments_new,
        },
        stores: {
          total: totalStores,
          new_in_window: inWin.stores_new,
        },
        content: {
          ads_total: totalAds,
          ads_new_in_window: inWin.ads_new,
          offers_total: totalOffers,
          offers_new_in_window: inWin.offers_new,
        },
        categoriesByPosts: categoriesByPostsRows ?? [],
        categoriesByPostsWindow: inWin.categoriesByPostsWindow,
        tagsByUsage: tagsByUsageRows ?? [],
        tagsByUsageWindow: inWin.tagsByUsageWindow,
        ratings: {
          total_all_targets: ratingsAll.total_ratings ?? 0,
          avg_all_targets: ratingsAll.avg_rating ?? 0,
          total_ads_only: ratingsAds.total_ratings_ads ?? 0,
          avg_ads_only: ratingsAds.avg_rating_ads ?? 0,
          distribution_all_targets: ratingsDistribution,
          window: {
            total: inWin.ratings_window_total,
            avg: inWin.ratings_window_avg,
            distribution: inWin.ratings_window_distribution,
          },
        },
        favorites: {
          total: favoritesTotal,
          by_type: favoritesByTypeMap,           // { ad, store, offer }
          window_total: inWin.favorites_window_total,
          window_by_type: inWin.favorites_window_by_type,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error('GET /api/admin/stats error:', e);
    return NextResponse.json(
      { error: 'فشل جلب إحصاءات الأدمن', details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
