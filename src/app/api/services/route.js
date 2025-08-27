export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { Pool } from 'pg';

/* اتصال قاعدة البيانات (مع إعادة الاستخدام) */
function getPool() {
  if (!globalThis.__PG_POOL__) {
    globalThis.__PG_POOL__ = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalThis.__PG_POOL__;
}

/* Helpers */
function numInRange(v, min, max, fallback) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
function pickSortBy(v) {
  const allowed = new Set(['created_at', 'price', 'title']);
  return allowed.has(v) ? v : 'created_at';
}
function pickOrder(v) {
  return v === 'asc' ? 'asc' : 'desc';
}

/**
 * GET /api/services
 * Query params:
 * - q: string (بحث في العنوان/الوصف)
 * - governorate: string
 * - categoryId: uuid
 * - categoryName: string
 * - tags: يمكن تكرارها tags=مطاعم&tags=عقارات أو comma-separated
 * - tagsMode: any | all (الافتراضي any)
 * - page: رقم الصفحة (افتراض 1)
 * - limit: النتائج في الصفحة (1..100, افتراض 20)
 * - sortBy: created_at | price | title (افتراض created_at)
 * - order: asc | desc (افتراض desc)
 *
 * Response:
 * { page, limit, total, items: [ ... ] }
 */
export async function GET(req) {
  const pool = getPool();
  const url = new URL(req.url);
  const sp = url.searchParams;

  const q            = (sp.get('q') || '').trim();
  const governorate  = (sp.get('governorate') || '').trim();
  const categoryId   = (sp.get('categoryId') || '').trim();
  const categoryName = (sp.get('categoryName') || '').trim();

  // تجميع التاغات من تكرار الوسيطة أو من قائمة مفصولة بفواصل
  const tagsRaw = sp.getAll('tags');
  const tags = Array.from(
    new Set(
      tagsRaw.flatMap(s => String(s).split(','))
             .map(s => s.trim())
             .filter(Boolean)
    )
  );
  const tagsMode = (sp.get('tagsMode') || 'any').toLowerCase() === 'all' ? 'all' : 'any';

  const page  = numInRange(sp.get('page'), 1, 1000000, 1);
  const limit = numInRange(sp.get('limit'), 1, 100, 20);
  const offset = (page - 1) * limit;

  const sortBy = pickSortBy((sp.get('sortBy') || '').trim());
  const order  = pickOrder((sp.get('order') || '').trim());

  const params = [];
  let i = 1;

  // شروط العرض العام: معتمد وظاهر
  const where = [`p.status = 'approved'`, 'p.is_visible = true'];

  if (q) {
    where.push(`(p.title ILIKE $${i} OR p.description ILIKE $${i})`);
    params.push(`%${q}%`); i++;
  }
  if (governorate) {
    where.push(`p.governorate = $${i}`);
    params.push(governorate); i++;
  }
  if (categoryId) {
    where.push(`p.category_id = $${i}`);
    params.push(categoryId); i++;
  } else if (categoryName) {
    where.push(`c.name = $${i}`);
    params.push(categoryName); i++;
  }

  // فلترة بالتاغات (ANY أو ALL)
  // نستخدم EXISTS/IN لتفادي تضخيم النتائج بسبب الـ JOIN
  if (tags.length > 0) {
    if (tagsMode === 'all') {
      // ALL: يجب أن يحتوي المنشور على كل التاغات المطلوبة
      where.push(`
        p.id IN (
          SELECT pt.post_id
          FROM public.post_tags pt
          JOIN public.tags t ON t.id = pt.tag_id
          WHERE t.name = ANY($${i})
          GROUP BY pt.post_id
          HAVING COUNT(DISTINCT t.name) >= $${i + 1}
        )
      `);
      params.push(tags, tags.length); i += 2;
    } else {
      // ANY: أي تاغ من القائمة يكفي
      where.push(`
        EXISTS (
          SELECT 1
          FROM public.post_tags pt
          JOIN public.tags t ON t.id = pt.tag_id
          WHERE pt.post_id = p.id
            AND t.name = ANY($${i})
        )
      `);
      params.push(tags); i++;
    }
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // الاستعلام الرئيسي مع تجميع التاغات
  const listSql = `
    SELECT
      p.id,
      p.title,
      p.description,
      p.governorate,
      p.price,
      p.status,
      p.is_visible,
      p.created_at,
      p.user_id,
      p.is_anonymous,
      p.category_id,
      c.name AS category_name,
      u.name AS user_name,
      COALESCE(
        array_agg(DISTINCT t.name) FILTER (WHERE t.id IS NOT NULL),
        '{}'
      ) AS tags
    FROM public.posts p
    LEFT JOIN public.categories c ON c.id = p.category_id
    LEFT JOIN public.users u ON u.id = p.user_id
    LEFT JOIN public.post_tags pt ON pt.post_id = p.id
    LEFT JOIN public.tags t ON t.id = pt.tag_id
    ${whereSql}
    GROUP BY p.id, c.name, u.name
    ORDER BY ${sortBy} ${order}
    LIMIT ${limit} OFFSET ${offset};
  `;

  // إجمالي السجلات (بدون LIMIT/OFFSET)
  const countSql = `
    SELECT COUNT(DISTINCT p.id) AS total
    FROM public.posts p
    LEFT JOIN public.categories c ON c.id = p.category_id
    ${whereSql};
  `;

  const client = await pool.connect();
  try {
    const [listRes, countRes] = await Promise.all([
      client.query(listSql, params),
      client.query(countSql, params),
    ]);

    const total = Number(countRes.rows?.[0]?.total || 0);

    return NextResponse.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items: listRes.rows,
    });
  } catch (e) {
    console.error('Error fetching services posts:', {
      message: e.message,
      code: e.code,
      detail: e.detail,
    });
    return NextResponse.json(
      { message: 'تعذّر جلب المنشورات.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
