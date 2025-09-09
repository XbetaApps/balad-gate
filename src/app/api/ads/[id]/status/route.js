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
      const cookieStore = await cookies();
      // Try multiple possible cookie names
      token = cookieStore.get('token')?.value || 
              cookieStore.get('sb-access-token')?.value ||
              cookieStore.get('sb:token')?.value ||
              cookieStore.get('sb-rtk')?.value ||
              cookieStore.get('sb:auth-token')?.value ||
              cookieStore.get('auth-token')?.value ||
              cookieStore.get('jwt-token')?.value ||
              cookieStore.get('next-auth.session-token')?.value ||
              cookieStore.get('session-token')?.value;
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

    // تحقق من وجود الإعلان وجلب معلوماته
    const { rows: [ad] } = await client.query(
      'SELECT id, user_id, is_active FROM public.ads WHERE id = $1 LIMIT 1',
      [adId]
    );
    if (!ad) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'الإعلان غير موجود' }, { status: 404 });
    }

    // تحقق من صلاحيات المستخدم (مدير أو مالك الإعلان)
    // Get user role
    const { rows: users } = await client.query(
      'SELECT role_id FROM public.users WHERE id = $1',
      [auth.userId]
    );
    
    if (users.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 });
    }
    
    const user = users[0];
    const isAdmin = user?.role_id === 'admin';
    const isOwner = ad.user_id === auth.userId;
    
    if (!isAdmin && !isOwner) {
      await client.query('ROLLBACK');
      return NextResponse.json({ 
        success: false, 
        error: 'غير مصرح. يجب أن تكون مالك الإعلان أو مدير النظام' 
      }, { status: 403 });
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
