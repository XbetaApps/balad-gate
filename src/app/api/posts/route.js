// /app/api/posts/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

/* =========================
   إعداد اتصال قاعدة البيانات
========================= */
function getPool() {
  if (!globalThis.__PG_POOL__) {
    globalThis.__PG_POOL__ = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalThis.__PG_POOL__;
}

/* =========================
   أدوات مساعدة
========================= */
// التحقق من القيم الفارغة
function validateNoNulls(data, fields) {
  const errors = [];
  for (const field of fields) {
    if (data[field] === null || data[field] === undefined) {
      errors.push(`حقل ${field} مطلوب ولا يمكن أن يكون فارغًا`);
    }
  }
  return errors.length ? errors : null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asUuid(val) {
  const s = String(val || '').trim();
  return UUID_RE.test(s) ? s : null;
}

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
  const governorate = (url.searchParams.get('governorate') || '').trim();
  
  // الحصول على أسماء الفئات كقائمة
  const categoryNames = (url.searchParams.get('categoryName') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

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
  if (governorate) { where.push(`p.governorate = $${i}`); params.push(governorate); i++; }
  
  // دعم البحث بعدة أسماء فئات
  if (categoryNames.length > 0) { 
    // إنشاء مصفوفة من العناصر النائبة للفئات
    const categoryPlaceholders = categoryNames.map((_, idx) => `$${i + idx}`).join(',');
    where.push(`c.name IN (${categoryPlaceholders})`);
    params.push(...categoryNames);
    i += categoryNames.length;
  }
  
  if (tags.length > 0) { where.push(`t.name = ANY($${i})`); params.push(tags); i++; }

  const sql = `
    WITH filtered AS (
      SELECT
        p.id, p.title, p.description, p.governorate, p.price,
        p.status, p.is_visible, p.created_at, p.category_id,
        COALESCE(p.is_anonymous, FALSE) AS is_anonymous,
        c.name AS category_name,
        u.name AS author_name,  -- Always get the user's name
        p.user_id
      FROM public.posts p
      LEFT JOIN public.categories c ON c.id = p.category_id
      LEFT JOIN public.users u ON u.id = p.user_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    )
    SELECT
      f.id, f.title, f.description, f.governorate, f.price,
      f.status, f.is_visible, f.created_at, f.category_id,
      f.is_anonymous, f.category_name, f.user_id, f.author_name,
      COALESCE(array_agg(DISTINCT t.name) FILTER (WHERE t.id IS NOT NULL), '{}') AS tags
    FROM filtered f
    LEFT JOIN public.post_tags pt ON pt.post_id = f.id
    LEFT JOIN public.tags t ON t.id = pt.tag_id
    GROUP BY
      f.id, f.title, f.description, f.governorate, f.price, f.status,
      f.is_visible, f.created_at, f.user_id, f.category_id, f.is_anonymous, 
      f.category_name, f.author_name
    ORDER BY f.created_at DESC;
  `;

  const client = await pool.connect();
  try {
    const { rows } = await client.query(sql, params);
    console.log('Posts API Response:', JSON.stringify(rows, null, 2)); // Debug log
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

  // التحقق من الحقول المطلوبة
  if (!title || !description || !governorate) {
    return NextResponse.json({ message: 'يرجى تعبئة جميع الحقول المطلوبة' }, { status: 422 });
  }
  
  // التحقق من وجود التصنيف
  if (!categoryIdInput && !categoryNameInput) {
    return NextResponse.json({ message: 'يجب اختيار التصنيف.' }, { status: 422 });
  }
  
  // إذا كان isAnonymous يساوي null، يتم اعتباره false
  const isAnonymous = body.isAnonymous === null ? false : Boolean(body.isAnonymous);

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
      const cat = await client.query(
        `SELECT id FROM public.categories WHERE name = $1 LIMIT 1`,
        [categoryNameInput]
      );
      if (cat.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'التصنيف غير موجود.', category: categoryNameInput }, { status: 422 });
      }
      categoryId = cat.rows[0].id;
    }

    // ✅ إنشاء المنشور مع is_anonymous
    const postRes = await client.query(
      `INSERT INTO public.posts (user_id, category_id, title, description, governorate, price, status, is_visible, is_anonymous)
       VALUES ($1,$2,$3,$4,$5,$6,'pending', TRUE, $7)
       RETURNING id`,
      [userId, categoryId, title, description, governorate, price, isAnonymous]
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

    await client.query('COMMIT');
    return NextResponse.json(
      { id: postId, status: 'pending', is_anonymous: isAnonymous, message: 'تم إنشاء المنشور وبانتظار الموافقة.' },
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