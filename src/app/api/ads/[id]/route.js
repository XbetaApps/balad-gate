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
      const store = await cookies(); // مهم: await
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

/*======================== PUT /api/ads/[id] ========================*/
export async function PUT(req, { params }) {
  const auth = await checkUser(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  const adId = params?.id;
  if (!adId) return NextResponse.json({ success: false, error: 'Ad ID مطلوب' }, { status: 400 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON غير صالح' }, { status: 400 });
  }

  const fields = {};
  const allowed = ['title', 'description', 'image_url', 'start_date', 'end_date', 'is_active', 'position', 'sort_order', 'price'];
  for (const k of allowed) {
    if (body[k] !== undefined) fields[k] = body[k];
  }
  const tags = Array.isArray(body.tags) ? body.tags : undefined;

  // تحقق من القيم الأساسية إن وُجدت
  if (fields.start_date && fields.end_date) {
    const s = new Date(fields.start_date);
    const e = new Date(fields.end_date);
    if (isNaN(s) || isNaN(e) || e <= s) {
      return NextResponse.json({ success: false, error: 'تواريخ غير صحيحة' }, { status: 400 });
    }
    fields.start_date = s.toISOString();
    fields.end_date = e.toISOString();
  }

  if (fields.position) {
    const positions = ['top', 'sidebar', 'middle', 'bottom'];
    if (!positions.includes(fields.position)) {
      return NextResponse.json({ success: false, error: 'قيمة الموقع غير صحيحة' }, { status: 400 });
    }
  }

  if (fields.price !== undefined) {
    const n = Number(fields.price);
    if (Number.isNaN(n) || n < 0) {
      return NextResponse.json({ success: false, error: 'السعر غير صالح' }, { status: 400 });
    }
    fields.price = n;
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // تحقّق ملكية الإعلان
    const { rows: [own] } = await client.query(
      'SELECT user_id FROM public.ads WHERE id = $1 LIMIT 1',
      [adId]
    );
    if (!own) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'الإعلان غير موجود' }, { status: 404 });
    }
    if (own.user_id !== auth.userId) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    // بناء جملة التحديث
    if (Object.keys(fields).length > 0) {
      const sets = [];
      const vals = [];
      let i = 1;
      for (const [k, v] of Object.entries(fields)) {
        sets.push(`${k} = $${i++}`);
        vals.push(v);
      }
      sets.push(`updated_at = NOW()`);
      vals.push(adId);

      const sql = `
        UPDATE public.ads
        SET ${sets.join(', ')}
        WHERE id = $${i}
        RETURNING *;
      `;
      await client.query(sql, vals);
    }

    // تحديث التاغات — استبدال كامل إن تم تمرير tags
    if (tags) {
      await client.query('DELETE FROM public.ad_tags WHERE ad_id = $1', [adId]);

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
            `INSERT INTO public.ad_tags (ad_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
            [adId, tagId]
          );
        }
      }
    }

    // رجّع الإعلان مع التاغات
    const { rows: [ad] } = await client.query(
      `
        SELECT
          a.*,
          COALESCE(
            JSON_AGG(
              DISTINCT JSONB_BUILD_OBJECT('id', t.id, 'name', t.name)
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'
          ) AS tags
        FROM public.ads a
        LEFT JOIN public.ad_tags at ON at.ad_id = a.id
        LEFT JOIN public.tags t ON t.id = at.tag_id
        WHERE a.id = $1
        GROUP BY a.id
        LIMIT 1;
      `,
      [adId]
    );

    await client.query('COMMIT');

    ad.price = ad.price != null ? Number(ad.price) : 0;

    return NextResponse.json({ success: true, ad }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PUT /api/ads/[id] error:', err);
    return NextResponse.json({ success: false, error: 'فشل تحديث الإعلان' }, { status: 500 });
  } finally {
    client.release();
  }
}

/*======================== DELETE /api/ads/[id] ========================*/
export async function DELETE(req, { params }) {
  const auth = await checkUser(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  const adId = params?.id;
  if (!adId) return NextResponse.json({ success: false, error: 'Ad ID مطلوب' }, { status: 400 });

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // تحقّق الملكية
    const { rows: [own] } = await client.query(
      'SELECT user_id FROM public.ads WHERE id = $1 LIMIT 1',
      [adId]
    );
    if (!own) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'الإعلان غير موجود' }, { status: 404 });
    }
    if (own.user_id !== auth.userId) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    await client.query('DELETE FROM public.ad_tags WHERE ad_id = $1', [adId]);
    const { rowCount } = await client.query('DELETE FROM public.ads WHERE id = $1', [adId]);

    await client.query('COMMIT');

    if (rowCount === 0) {
      return NextResponse.json({ success: false, error: 'الإعلان غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'تم حذف الإعلان بنجاح' }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DELETE /api/ads/[id] error:', err);
    return NextResponse.json({ success: false, error: 'فشل حذف الإعلان' }, { status: 500 });
  } finally {
    client.release();
  }
}
