export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { cookies } from 'next/headers';
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

/*======================== JWT ========================*/
function getJwtSecret() {
  return (
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    ''
  );
}

/*======================== Auth (User) ========================*/
async function checkUser(req) {
  try {
    const headerAuth = req.headers.get('authorization') || '';
    let token = null;

    if (headerAuth.startsWith('Bearer ')) {
      token = headerAuth.slice(7).trim();
    } else {
      const store = await cookies(); // مهم: await لتفادي تحذير Next
      token = store.get('token')?.value || null;
    }

    if (!token) return { ok: false, error: 'يرجى تسجيل الدخول' };

    const secret = getJwtSecret();
    if (!secret) return { ok: false, error: 'إعدادات الخادم ناقصة' };

    const decoded = jwt.verify(token, secret);
    const userId =
      decoded.sub || decoded.userId || decoded.user_id || decoded.id || decoded.uid;

    if (!userId) return { ok: false, error: 'رمز مصادقة غير صالح' };

    return { ok: true, userId };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { ok: false, error: 'انتهت صلاحية الجلسة' };
    }
    return { ok: false, error: 'فشل التحقق' };
  }
}

/*======================== POST /api/ads ========================*/
// إنشاء إعلان جديد + ربط التاغات
export async function POST(req) {
  const auth = await checkUser(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON غير صالح' }, { status: 400 });
  }

  const {
    title,
    description = '',
    image_url = '',
    start_date,
    end_date,
    is_active = true,
    position = 'top',
    sort_order = 0,
    price = 0,
    tags = [] // توقع: [{id?, name?}]
  } = body || {};

  if (!title || !start_date || !end_date) {
    return NextResponse.json({ success: false, error: 'حقول ناقصة' }, { status: 400 });
  }

  const start = new Date(start_date);
  const end = new Date(end_date);
  if (isNaN(start) || isNaN(end) || end <= start) {
    return NextResponse.json({ success: false, error: 'تواريخ غير صحيحة' }, { status: 400 });
  }

  const positions = ['top', 'sidebar', 'middle', 'bottom'];
  if (!positions.includes(position)) {
    return NextResponse.json({ success: false, error: 'قيمة الموقع غير صحيحة' }, { status: 400 });
  }

  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice) || numericPrice < 0) {
    return NextResponse.json({ success: false, error: 'السعر غير صالح' }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const insertAd = `
      INSERT INTO public.ads
        (user_id, title, description, image_url, start_date, end_date, is_active, position, sort_order, price)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7,  $8,       $9,        $10)
      RETURNING *;
    `;
    const { rows: [ad] } = await client.query(insertAd, [
      auth.userId,
      title,
      description,
      image_url,
      start.toISOString(),
      end.toISOString(),
      !!is_active,
      position,
      Number(sort_order) || 0,
      numericPrice
    ]);

    // ربط التاغات
    if (Array.isArray(tags) && tags.length > 0) {
      for (const t of tags) {
        let tagId = t?.id || null;

        if (!tagId && t?.name) {
          const findTag = `SELECT id FROM public.tags WHERE LOWER(name) = LOWER($1) LIMIT 1`;
          const { rows: found } = await client.query(findTag, [t.name]);
          if (found.length > 0) {
            tagId = found[0].id;
          } else {
            const createTag = `INSERT INTO public.tags (name) VALUES ($1) RETURNING id`;
            const { rows: created } = await client.query(createTag, [t.name]);
            tagId = created[0].id;
          }
        }

        if (tagId) {
          await client.query(
            `INSERT INTO public.ad_tags (ad_id, tag_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING;`,
            [ad.id, tagId]
          );
        }
      }
    }

    await client.query('COMMIT');

    // رجّع السعر كرقم
    ad.price = ad.price != null ? Number(ad.price) : 0;

    return NextResponse.json(
      { success: true, ad },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/ads error:', err);
    return NextResponse.json(
      { success: false, error: 'فشل إنشاء الإعلان' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  } finally {
    client.release();
  }
}
