export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { cookies as nextCookies } from 'next/headers';
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

async function getAuthContext(req) {
  const store = await nextCookies();
  const cookieToken = store.get('token')?.value || null;
  const authHeader =
    req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  const token = cookieToken || bearerToken;
  if (!token) return { userId: null, roleId: null, isAdmin: false, error: 'no_token' };

  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) return { userId: null, roleId: null, isAdmin: false, error: 'server_secret_missing' };

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (e) {
    return { userId: null, roleId: null, isAdmin: false, error: 'invalid_token' };
  }
  const userId = decoded.userId || decoded.sub;
  if (!userId) return { userId: null, roleId: null, isAdmin: false, error: 'token_missing_user' };

  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT id, role_id FROM public.users WHERE id = $1 LIMIT 1',
    [userId]
  );
  const roleId = rows[0]?.role_id ?? null;
  const isAdmin = Number(roleId) === 4;

  return { userId, roleId, isAdmin, error: null };
}

export async function GET(req) {
  console.log('=== /api/ads/my-ads called ===');
  const { userId, roleId, isAdmin, error } = await getAuthContext(req);
  if (!userId) {
    return NextResponse.json(
      { error: 'غير مصرح - يرجى تسجيل الدخول' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 100);
  const offset = (page - 1) * limit;

  const pool = getPool();

  try {
    const queryAdmin = `
      SELECT a.*
      FROM public.ads a
      ORDER BY a.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const queryUser = `
      SELECT a.*
      FROM public.ads a
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = isAdmin
      ? await pool.query(queryAdmin, [limit, offset])
      : await pool.query(queryUser, [userId, limit, offset]);

    const ads = result.rows.map((ad) => ({
      id: ad.id,
      serial_id: ad.serial_id,
      user_id: ad.user_id,
      title: ad.title,
      description: ad.description,
      image_url: ad.image_url,
      start_date: ad.start_date,
      end_date: ad.end_date,
      is_active: ad.is_active,
      position: ad.position,
      sort_order: ad.sort_order,
      created_at: ad.created_at,
      updated_at: ad.updated_at,
      price: ad.price ? parseFloat(ad.price) : 0.0,
      category: null,
    }));

    const countAdmin = `SELECT COUNT(*)::int AS total FROM public.ads`;
    const countUser = `SELECT COUNT(*)::int AS total FROM public.ads WHERE user_id = $1`;

    const { rows: [countRow] } = isAdmin
      ? await pool.query(countAdmin)
      : await pool.query(countUser, [userId]);

    const total = countRow?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: ads,
        pagination: {
          total,
          total_pages: totalPages,
          current_page: page,
          per_page: limit,
          has_next_page: page < totalPages,
          has_previous_page: page > 1,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  } catch (err) {
    console.error('Database error in /api/ads/my-ads:', err);
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
