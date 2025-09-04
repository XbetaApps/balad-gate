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

/*======================== PUT /api/ads/[id]/status ========================*/
export async function PUT(req, { params }) {
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

    // تأكيد ملكية الإعلان
    const { rows: [own] } = await client.query(
      'SELECT id, user_id, is_active FROM public.ads WHERE id = $1 LIMIT 1',
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

    const { rows: [updated] } = await client.query(
      `
        UPDATE public.ads
        SET is_active = NOT is_active, updated_at = NOW()
        WHERE id = $1
        RETURNING id, is_active;
      `,
      [adId]
    );

    await client.query('COMMIT');

    return NextResponse.json(
      { success: true, id: updated.id, is_active: updated.is_active },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PUT /api/ads/[id]/status error:', err);
    return NextResponse.json({ success: false, error: 'فشل تغيير الحالة' }, { status: 500 });
  } finally {
    client.release();
  }
}
