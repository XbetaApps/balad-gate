export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

function getPool() {
  if (!globalThis.__PG_POOL__) {
    globalThis.__PG_POOL__ = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalThis.__PG_POOL__;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asUuid(val) {
  const s = String(val || '').trim();
  return UUID_RE.test(s) ? s : null;
}

// خريطة slug -> مجموعة الأسماء العربية المحتملة في قاعدة البيانات للتصنيف
// هذا يسمح بدعم مرادفات متعددة (مطابقةً لما في sections.js)
const SLUG_TO_NAMES = {
  'commercial-stores': ['المتاجر', 'متاجر', 'محلات'],
  'pharmacies': ['صيدليات', 'صيدلية'],
  'jewelry': ['مجوهرات وذهب', 'مجوهرات', 'ذهب'],
  'malls': ['مراكز تجارية', 'مجمعات تجارية', 'مولات', 'مول'],
  'restaurants': ['مطاعم', 'مطعم'],
  'hotels': ['فنادق', 'فندق'],
  'cars': ['سيارات', 'سيارة'],
  'real-estate': ['عقارات', 'عقار'],
  'lands': ['أراضي', 'أرض'],
  'jobs': ['فرص عمل', 'وظائف', 'وظيفة', 'عمل'],
  'clothing': ['ملابس وأزياء', 'ملابس', 'أزياء'],
  'education': ['دورات دراسية', 'دورات', 'كورس', 'كورسات'],
  'hospitals': ['مستشفيات', 'مستشفى'],
  'clinics': ['عيادات طبية', 'عيادات', 'عيادة'],
  'entertainment': ['أماكن ترفيهية', 'ترفيه', 'أماكن ترفيه'],
  'wedding-halls': ['صالات أفراح', 'صالات افراح', 'قاعة أفراح', 'قاعات أفراح'],
  'transport': ['خدمات توصيل', 'توصيل'],
  'fuel': ['محطات وقود', 'محطة وقود', 'بنزينات', 'محطات بنزين'],
  'sports': ['صالات رياضية', 'نوادي رياضية', 'نادي رياضي', 'جيم'],
  'books': ['مكتبات وكتب', 'مكتبات', 'كتب', 'الكتب', 'كتب ومكتبات'],
  'gifts': ['هدايا وتحف', 'هدايا'],
  'beauty': ['مراكز تجميل', 'صالونات تجميل', 'تجميل'],
  'health': ['صحة']
};

function getJwtSecret() {
  return (
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    ''
  );
}

function decodeUserIdFromToken(token) {
  const secret = getJwtSecret();
  if (!secret) return null;
  try {
    const decoded = jwt.verify(token, secret);
    const candidates = [decoded.sub, decoded.userId, decoded.user_id, decoded.id, decoded.uid];
    for (const c of candidates) {
      const uid = asUuid(c);
      if (uid) return uid;
    }
    return null;
  } catch (e) {
    console.error('JWT verify failed:', e?.message);
    return null;
  }
}

function getCurrentUserId(req) {
  // 1) Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const uid = decodeUserIdFromToken(token);
    if (uid) return uid;
  }

  // 2) Cookie: token (JWT)
  const tokenCookie = cookies().get('token')?.value || '';
  if (tokenCookie) {
    const uid = decodeUserIdFromToken(tokenCookie);
    if (uid) return uid;
  }

  // 3) X-User-Id header (UUID صريح)
  const userIdHeader = asUuid(req.headers.get('x-user-id') || '');
  if (userIdHeader) return userIdHeader;

  // 4) Cookie: uid (UUID صريح)
  const cookieUid = asUuid(cookies().get('uid')?.value || '');
  if (cookieUid) return cookieUid;

  // 5) dev-only: ?testUserId=<uuid>
  if (process.env.NODE_ENV !== 'production') {
    const url = new URL(req.url);
    const testUserId = asUuid(url.searchParams.get('testUserId') || '');
    if (testUserId) {
      console.warn('⚠️ Using testUserId (dev only).');
      return testUserId;
    }
  }

  return null;
}

/* ============== GET /api/posts ============== */
export async function GET(req) {
  const pool = getPool();
  const url = new URL(req.url);

  const q = (url.searchParams.get('q') || '').trim();
  // Support multiple governorates via repeated params or comma-separated list
  const governorateParams = url.searchParams.getAll('governorate');
  const governorates = Array.from(
    new Set(
      governorateParams
        .flatMap((s) => String(s || '').split(','))
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
  // Allow multiple category names via repeated params or comma-separated values
  const categoryNameParams = url.searchParams.getAll('categoryName');
  const categoryNames = Array.from(
    new Set(
      categoryNameParams
        .flatMap((s) => String(s || '').split(','))
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
  // Also support category slugs via 'category' param(s) and map them to Arabic names (multiple variants)
  const categorySlugParams = url.searchParams.getAll('category');
  const categorySlugs = Array.from(
    new Set(
      categorySlugParams
        .flatMap((s) => String(s || '').split(','))
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
  const categoryNamesFromSlugs = categorySlugs
    .flatMap((slug) => SLUG_TO_NAMES[slug] || [])
    .filter(Boolean);
  const allCategoryNames = Array.from(new Set([...categoryNames, ...categoryNamesFromSlugs]));

  const tagsRaw = url.searchParams.getAll('tags');
  const tags = Array.from(
    new Set(
      tagsRaw.flatMap((s) => s.split(',')).map((s) => s.trim()).filter(Boolean)
    )
  );

  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  const where = ["p.status = 'approved'", 'p.is_visible = true'];
  const params = [];
  let i = 1;

  if (q) { where.push(`(p.title ILIKE $${i} OR p.description ILIKE $${i})`); params.push(`%${q}%`); i++; }
  if (governorates.length > 0) {
    // استخدم ILIKE ANY مع أنماط % لإلتقاط الصيغ المختلفة (مثال: محافظة/منطقة الوسطى)
    const govPatterns = Array.from(new Set([
      ...governorates,
      ...governorates.map((g) => `%${g}%`),
      ...governorates.map((g) => `%محافظة ${g}%`),
      ...governorates.map((g) => `%المنطقة ${g}%`),
    ]));
    where.push(`p.governorate ILIKE ANY($${i})`);
    params.push(govPatterns);
    i++;
  }
  if (allCategoryNames.length > 0) { where.push(`c.name = ANY($${i})`); params.push(allCategoryNames); i++; }
  if (tags.length > 0) { where.push(`t.name = ANY($${i})`); params.push(tags); i++; }

  const sql = `
    SELECT
      p.id, p.title, p.description, p.governorate, p.price,
      p.status, p.is_visible, p.created_at, p.user_id, p.category_id,
      c.name AS category_name,
      COALESCE(array_agg(DISTINCT t.name) FILTER (WHERE t.id IS NOT NULL), '{}') AS tags
    FROM public.posts p
    LEFT JOIN public.categories c ON c.id = p.category_id
    LEFT JOIN public.post_tags pt ON pt.post_id = p.id
    LEFT JOIN public.tags t ON t.id = pt.tag_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    GROUP BY p.id, c.name
    ORDER BY p.created_at DESC
    LIMIT ${limit} OFFSET ${offset};
  `;

  const client = await pool.connect();
  try {
    const { rows } = await client.query(sql, params);
    return NextResponse.json({ page, limit, count: rows.length, items: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'تعذّر جلب المنشورات' }, { status: 500 });
  } finally {
    client.release();
  }
}

/* ============== POST /api/posts ============== */
export async function POST(req) {
  const pool = getPool();

  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ message: 'صيغة الطلب غير صحيحة', error: error.message }, { status: 400 });
  }

  const userId = getCurrentUserId(req);
  if (!userId) {
    return NextResponse.json({ message: 'يلزم تسجيل الدخول لإضافة خدمة.' }, { status: 401 });
  }

  const title = (body.title || '').trim();
  const description = (body.description || '').trim();
  const governorate = (body.governorate || '').trim();
  const categoryIdInput = (body.categoryId || '').trim();
  const categoryNameInput = (body.categoryName || '').trim();

  // أسماء التاغات فقط (موجودة مسبقًا)
  const tagNames = Array.isArray(body.tags)
    ? [...new Set(body.tags.map((t) => (t || '').trim()).filter(Boolean))]
    : [];

  if (!title || !description || !governorate || (!categoryIdInput && !categoryNameInput)) {
    return NextResponse.json({ message: 'يرجى تعبئة العنوان والوصف والمحافظة واختيار التصنيف.' }, { status: 422 });
  }

  let price = null;
  if (body.price !== null && body.price !== undefined && `${body.price}`.trim() !== '') {
    const n = Number(body.price);
    if (Number.isNaN(n) || n < 0) {
      return NextResponse.json({ message: 'قيمة السعر غير صالحة.' }, { status: 422 });
    }
    price = Math.round(n * 100) / 100;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // حلّ التصنيف من الاسم إن لزم
    let categoryId = categoryIdInput || null;
    if (!categoryId && categoryNameInput) {
      const cat = await client.query(`SELECT id FROM public.categories WHERE name = $1 LIMIT 1`, [categoryNameInput]);
      if (cat.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'التصنيف غير موجود.', category: categoryNameInput }, { status: 422 });
      }
      categoryId = cat.rows[0].id;
    }

    // إنشاء المنشور
    const postRes = await client.query(
      `INSERT INTO public.posts (user_id, category_id, title, description, governorate, price, status, is_visible)
       VALUES ($1,$2,$3,$4,$5,$6,'pending', true)
       RETURNING id`,
      [userId, categoryId, title, description, governorate, price]
    );
    const postId = postRes.rows[0].id;

    // ربط التاغات الموجودة فقط — بلا إنشاء تاغات جديدة
    if (tagNames.length > 0) {
      const { rows: found } = await client.query(
        `SELECT id, name FROM public.tags WHERE name = ANY($1::text[])`,
        [tagNames]
      );
      const foundNames = new Set(found.map((r) => r.name));
      const unknown = tagNames.filter((n) => !foundNames.has(n));

      if (unknown.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { message: 'بعض التاغات غير معروفة. اختر من التاغات المتوفرة فقط.', unknownTags: unknown },
          { status: 422 }
        );
      }

      await client.query(
        `INSERT INTO public.post_tags (post_id, tag_id)
         SELECT $1, t.id
         FROM public.tags t
         WHERE t.name = ANY($2::text[])
         ON CONFLICT DO NOTHING`,
        [postId, tagNames]
      );
    }

    // إنشاء إشعار للمشرفين بوجود منشور جديد بحاجة لموافقة
    try {
      const content = `منشور جديد بانتظار الموافقة: ${title}`;
      await client.query(
        `INSERT INTO public.notifications (user_id, content, read)
         SELECT u.id, $1, false
         FROM public.users u
         WHERE u.role_id = 4`,
        [content]
      );
    } catch (notifErr) {
      console.error('Failed to create admin notifications for new post', notifErr);
      // نكمل المعاملة حتى لا نمنع إنشاء المنشور في حال فشل الإشعارات
    }

    await client.query('COMMIT');
    return NextResponse.json(
      { id: postId, status: 'pending', message: 'تم إنشاء المنشور وبانتظار الموافقة.' },
      { status: 201 }
    );
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('Error creating post:', { message: error.message, code: error.code, detail: error.detail });
    return NextResponse.json(
      { message: 'تعذر إنشاء المنشور.', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
