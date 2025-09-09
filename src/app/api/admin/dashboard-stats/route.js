// /api/admin/dashboard-stats/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { cookies as nextCookies } from 'next/headers';
import jwt from 'jsonwebtoken';

/*======================== DB ========================*/
function getPool() {
  if (!globalThis.__PG_POOL__) {
    globalThis.__PG_POOL__ = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalThis.__PG_POOL__;
}

// Helper: runs a query safely and returns fallback on error
async function safeQuery(sql, params = [], fallback = []) {
  const pool = getPool();
  try {
    const res = await pool.query(sql, params);
    return res.rows;
  } catch (e) {
    console.warn('[dashboard-stats] Query failed:', e?.message || e);
    return fallback;
  }
}

// Helper: runs a COUNT(*) query safely and returns Number
async function safeCount(sql, params = []) {
  const rows = await safeQuery(sql, params, [{ count: '0' }]);
  return Number(rows?.[0]?.count ?? 0);
}

/*======================== Auth ========================*/
async function checkAdminAccess(req) {
  try {
    const cookieStore = await nextCookies();
    const cookieToken = cookieStore.get('token')?.value || null;
    const authHeader = req.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    const token = cookieToken || bearerToken;
    if (!token) {
      return { isAdmin: false, error: 'لم يتم العثور على جلسة نشطة. يرجى تسجيل الدخول.' };
    }

    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('JWT_SECRET/NEXTAUTH_SECRET غير مضبوط');
      return { isAdmin: false, error: 'خطأ في إعدادات الخادم' };
    }

    const decoded = jwt.verify(token, secret);
    const userId = decoded.userId || decoded.sub;
    if (!userId) {
      return { isAdmin: false, error: 'رمز مصادقة غير صالح' };
    }

    const pool = getPool();
    const { rows } = await pool.query(
      'SELECT id, role_id FROM public.users WHERE id = $1 LIMIT 1',
      [userId]
    );
    if (rows.length === 0) {
      return { isAdmin: false, error: 'المستخدم غير موجود' };
    }

    const user = rows[0];
    const isAdmin = Number(user.role_id) === 4; // عدّلها إن لزم
    if (!isAdmin) {
      return { isAdmin: false, error: 'غير مصرح بالوصول. تحتاج إلى صلاحيات المشرف.' };
    }
    return { isAdmin: true, userId: user.id, roleId: user.role_id };
  } catch (err) {
    console.error('خطأ في التحقق من الصلاحيات:', err);
    if (err.name === 'TokenExpiredError') {
      return { isAdmin: false, error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى' };
    }
    return { isAdmin: false, error: 'خطأ في المصادقة: ' + (err.message || 'رمز غير صالح') };
  }
}

export async function GET(req) {
  try {
    const { isAdmin, error } = await checkAdminAccess(req);
    if (!isAdmin) {
      return NextResponse.json({ message: error || 'غير مصرح بالوصول' }, { status: 401 });
    }

    // بداية هذا اليوم (لإحصائية "جدد اليوم")
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    /* ===== Users ===== */
    const totalUsers = await safeCount(`SELECT COUNT(*) FROM public.users`);

    // ✅ أتمّوا الإعداد "بشكل صحيح": يجب أن يكون كلا الحقلين مضبوطين
    const onboardedUsers = await safeCount(
      `SELECT COUNT(*) FROM public.users
       WHERE onboarding_done = TRUE
         AND onboarding_done_at IS NOT NULL`
    );

    const newUsersToday = await safeCount(
      `SELECT COUNT(*) FROM public.users WHERE created_at >= $1`,
      [todayIso]
    );

    /* ===== Posts ===== */
    const totalPosts = await safeCount(`SELECT COUNT(*) FROM public.posts`);

    const topPosters = await safeQuery(
      `
      SELECT u.id, u.name, u.email, COUNT(p.id) AS post_count
      FROM public.users u
      LEFT JOIN public.posts p ON p.user_id = u.id
      GROUP BY u.id, u.name, u.email
      ORDER BY post_count DESC NULLS LAST
      LIMIT 5
      `
    );

    const topCategories = await safeQuery(
      `
      SELECT c.id, c.name, COUNT(p.id) AS post_count
      FROM public.categories c
      LEFT JOIN public.posts p
        ON p.category_id = c.id
       AND p.status = 'approved'
       AND p.is_visible = TRUE
      GROUP BY c.id, c.name
      ORDER BY post_count DESC NULLS LAST
      LIMIT 5
      `
    );

    // أكثر المنشورات تفضيلاً (favorites خاص بالمنشورات)
    const topFavoritedPosts = await safeQuery(
      `
      SELECT p.id, p.title, COUNT(f.id) AS favorite_count
      FROM public.posts p
      LEFT JOIN public.favorites f
        ON f.item_id = p.id
       AND f.archived_at IS NULL
      WHERE p.status = 'approved' AND p.is_visible = TRUE
      GROUP BY p.id, p.title
      ORDER BY favorite_count DESC NULLS LAST, p.id
      LIMIT 5
      `
    );

    /* ===== Tags (اختياري) ===== */
    const mostFollowedTags = await safeQuery(
      `
      SELECT t.id, t.name, COUNT(utf.tag_id) AS follower_count
      FROM public.tags t
      LEFT JOIN public.user_tag_follows utf
        ON utf.tag_id = t.id
       AND utf.status = 'following'
      GROUP BY t.id, t.name
      ORDER BY follower_count DESC NULLS LAST
      LIMIT 5
      `,
      [],
      []
    );

    const mostUsedTags = await safeQuery(
      `
      SELECT t.id, t.name, COUNT(DISTINCT pt.post_id) AS usage_count
      FROM public.tags t
      LEFT JOIN public.post_tags pt ON pt.tag_id = t.id
      LEFT JOIN public.posts p
        ON p.id = pt.post_id
       AND p.status = 'approved'
       AND p.is_visible = TRUE
      GROUP BY t.id, t.name
      ORDER BY usage_count DESC NULLS LAST
      LIMIT 5
      `,
      [],
      []
    );

    /* ===== Ads ===== */
    const totalAds = await safeCount(`SELECT COUNT(*) FROM public.ads`);
    const activeAds = await safeCount(
      `
      SELECT COUNT(*)
      FROM public.ads
      WHERE is_active = TRUE
        AND start_date <= NOW()
        AND end_date >= NOW()
      `
    );
    const expiredAds = await safeCount(
      `SELECT COUNT(*) FROM public.ads WHERE end_date < NOW()`
    );
    const adPeakPeriods = await safeQuery(
      `
      SELECT EXTRACT(HOUR FROM created_at) AS hour, COUNT(*) AS ad_count
      FROM public.ads
      GROUP BY 1
      ORDER BY ad_count DESC
      LIMIT 5
      `
    );

    /* ===== Build JSON ===== */
    const stats = {
      users: {
        total: totalUsers,
        onboarded: onboardedUsers, // ✅ الآن يعتمد على onboarding_done + onboarding_done_at
        newToday: newUsersToday,
        onboardingRate: totalUsers > 0 ? Number(((onboardedUsers / totalUsers) * 100).toFixed(2)) : 0
      },
      posts: {
        total: totalPosts,
        topPosters: (topPosters || []).map(p => ({
          id: p.id,
          name: p.name || 'مستخدم مجهول',
          email: p.email || null,
          postCount: Number(p.post_count) || 0,
        })),
        topCategories: (topCategories || []).map(c => ({
          id: c.id,
          name: c.name,
          postCount: Number(c.post_count) || 0,
        })),
        topFavorited: (topFavoritedPosts || []).map(row => ({
          id: row.id,
          title: row.title,
          favoriteCount: Number(row.favorite_count) || 0,
        })),
      },
      tags: {
        mostFollowed: (mostFollowedTags || []).map(t => ({
          id: t.id,
          name: t.name,
          followerCount: Number(t.follower_count) || 0,
        })),
        mostUsed: (mostUsedTags || []).map(t => ({
          id: t.id,
          name: t.name,
          usageCount: Number(t.usage_count) || 0,
        })),
      },
      ads: {
        total: totalAds,
        active: activeAds,
        expired: expiredAds,
        inactive: Math.max(0, totalAds - activeAds - expiredAds),
        peakPeriods: (adPeakPeriods || []).map(row => ({
          hour: Number(row.hour),
          adCount: Number(row.ad_count),
        })),
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(stats, { status: 200 });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard statistics',
        details: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined
      },
      { status: 500 }
    );
  }
}
