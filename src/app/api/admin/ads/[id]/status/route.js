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

/* --------------- PUT /api/ads/[id]/status --------------- */
export async function PUT(req, { params }) {
  const auth = await checkUser(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  const adId = params?.id;
  if (!adId) {
    return NextResponse.json({ success: false, error: 'Ad ID مطلوب' }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    // تحقق من الملكية وجلب الحالة الحالية
    const { rows: [ad] } = await client.query(
      `SELECT id, user_id, is_active, end_date FROM public.ads WHERE id = $1 LIMIT 1`,
      [adId]
    );
    if (!ad) {
      client.release();
      return NextResponse.json({ success: false, error: 'الإعلان غير موجود' }, { status: 404 });
    }
    if (ad.user_id !== auth.userId) {
      client.release();
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    // لا نسمح بتفعيل إعلان منتهي
    const now = Date.now();
    if (new Date(ad.end_date).getTime() <= now && !ad.is_active) {
      client.release();
      return NextResponse.json({ success: false, error: 'لا يمكن تفعيل إعلان منتهي' }, { status: 400 });
    }

    const { rows: [updated] } = await client.query(
      `UPDATE public.ads
       SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1
       RETURNING id, is_active`,
      [adId]
    );

    return NextResponse.json({ success: true, id: updated.id, is_active: updated.is_active });
  } catch (err) {
    console.error('PUT /api/ads/[id]/status error:', err);
    return NextResponse.json({ success: false, error: 'فشل تغيير الحالة' }, { status: 500 });
  } finally {
    client.release();
  }
}
