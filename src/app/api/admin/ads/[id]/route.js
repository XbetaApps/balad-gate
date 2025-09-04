export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

/* ---------------- DB ---------------- */
function getPool() {
  if (!globalThis.__PG_POOL__) {
    globalThis.__PG_POOL__ = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalThis.__PG_POOL__;
}

/* --------------- JWT Secret ---------- */
function getJwtSecret() {
  return (
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    ''
  );
}

/* -------------- Auth (User) ---------- */
async function checkUser(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    let token = null;

    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else {
      const store = await cookies(); // مهم
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

/* ---------------- PUT /api/ads/[id] (update) ---------------- */
export async function PUT(req, { params }) {
  const auth = await checkUser(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  const adId = params?.id;
  if (!adId) {
    return NextResponse.json({ success: false, error: 'Ad ID مطلوب' }, { status: 400 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON غير صالح' }, { status: 400 });
  }

  const {
    title,
    description,
    image_url,
    start_date,
    end_date,
    is_active,
    position,
    sort_order,
    price,
    tags, // [{id?, name?}]
  } = body || {};

  // تحقق من ملكية الإعلان
  const pool = getPool();
  const client = await pool.connect();

  try {
    const { rows: owned } = await client.query(
      `SELECT user_id FROM public.ads WHERE id = $1 LIMIT 1`,
      [adId]
    );
    if (owned.length === 0) {
      client.release();
      return NextResponse.json({ success: false, error: 'الإعلان غير موجود' }, { status: 404 });
    }
    if (owned[0].user_id !== auth.userId) {
      client.release();
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    // بناء التحديث ديناميكياً
    const fields = [];
    const paramsArr = [];
    let i = 1;

    if (title !== undefined) { fields.push(`title = $${i++}`); paramsArr.push(title); }
    if (description !== undefined) { fields.push(`description = $${i++}`); paramsArr.push(description); }
    if (image_url !== undefined) { fields.push(`image_url = $${i++}`); paramsArr.push(image_url); }
    if (start_date !== undefined) { fields.push(`start_date = $${i++}`); paramsArr.push(new Date(start_date).toISOString()); }
    if (end_date !== undefined) { fields.push(`end_date = $${i++}`); paramsArr.push(new Date(end_date).toISOString()); }
    if (is_active !== undefined) { fields.push(`is_active = $${i++}`); paramsArr.push(!!is_active); }
    if (position !== undefined) { fields.push(`position = $${i++}`); paramsArr.push(position); }
    if (sort_order !== undefined) { fields.push(`sort_order = $${i++}`); paramsArr.push(Number(sort_order) || 0); }
    if (price !== undefined) {
      const numericPrice = Number(price);
      if (Number.isNaN(numericPrice) || numericPrice < 0) {
        client.release();
        return NextResponse.json({ success: false, error: 'السعر غير صالح' }, { status: 400 });
      }
      fields.push(`price = $${i++}`); paramsArr.push(numericPrice);
    }

    if (fields.length === 0 && !Array.isArray(tags)) {
      client.release();
      return NextResponse.json({ success: false, error: 'لا يوجد تحديثات' }, { status: 400 });
    }

    await client.query('BEGIN');

    if (fields.length > 0) {
      fields.push(`updated_at = NOW()`);
      const sql = `
        UPDATE public.ads
        SET ${fields.join(', ')}
        WHERE id = $${i}
        RETURNING *
      `;
      paramsArr.push(adId);
      await client.query(sql, paramsArr);
    }

    if (Array.isArray(tags)) {
      // أعد ربط التاغات بالكامل
      await client.query(`DELETE FROM public.ad_tags WHERE ad_id = $1`, [adId]);

      for (const t of tags) {
        let tagId = t?.id || null;

        if (!tagId && t?.name) {
          // ابحث بالاسم أو أنشئ
          const findSql = `SELECT id FROM public.tags WHERE LOWER(name) = LOWER($1) LIMIT 1`;
          const { rows: fRows } = await client.query(findSql, [t.name]);
          if (fRows.length > 0) {
            tagId = fRows[0].id;
          } else {
            const insTag = `INSERT INTO public.tags (name) VALUES ($1) RETURNING id`;
            const { rows: iRows } = await client.query(insTag, [t.name]);
            tagId = iRows[0].id;
          }
        }

        if (tagId) {
          await client.query(
            `INSERT INTO public.ad_tags (ad_id, tag_id) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [adId, tagId]
          );
        }
      }
    }

    await client.query('COMMIT');

    // أعِد الإعلان بعد التحديث
    const { rows: [ad] } = await client.query(
      `
      SELECT
        a.*,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t.id, 'name', t.name) ORDER BY t.name)
            FROM public.ad_tags atg
            JOIN public.tags t ON t.id = atg.tag_id
            WHERE atg.ad_id = a.id
          ),
          '[]'::json
        ) AS tags
      FROM public.ads a
      WHERE a.id = $1
      `,
      [adId]
    );

    if (!ad) {
      return NextResponse.json({ success: false, error: 'الإعلان غير موجود' }, { status: 404 });
    }

    ad.price = ad.price != null ? Number(ad.price) : 0;

    return NextResponse.json({ success: true, ad });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PUT /api/ads/[id] error:', err);
    return NextResponse.json({ success: false, error: 'فشل التحديث' }, { status: 500 });
  } finally {
    client.release();
  }
}

/* ---------------- DELETE /api/ads/[id] ---------------- */
export async function DELETE(req, { params }) {
  const auth = await checkUser(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  const adId = params?.id;
  if (!adId) {
    return NextResponse.json({ success: false, error: 'Ad ID مطلوب' }, { status: 400 });
  }

  const pool = getPool();

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM public.ads WHERE id = $1 AND user_id = $2`,
      [adId, auth.userId]
    );
    if (rowCount === 0) {
      return NextResponse.json({ success: false, error: 'غير موجود أو غير مصرح' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'تم حذف الإعلان' });
  } catch (err) {
    console.error('DELETE /api/ads/[id] error:', err);
    return NextResponse.json({ success: false, error: 'فشل الحذف' }, { status: 500 });
  }
}
