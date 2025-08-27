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

const asUuid = (v) => (UUID_RE.test(String(v || '').trim()) ? String(v).trim() : null);

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
  if (!secret || !token) return null;
  try {
    const decoded = jwt.verify(token, secret);
    const candidates = [decoded.sub, decoded.userId, decoded.user_id, decoded.id, decoded.uid];
    for (const c of candidates) {
      const uid = asUuid(c);
      if (uid) return uid;
    }
    return null;
  } catch {
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

  // 2) token cookie (JWT)
  const tokenCookie =
    cookies().get('token')?.value ||
    cookies().get('auth_token')?.value ||
    cookies().get('next-auth.session-token')?.value ||
    '';
  const uidFromCookie = decodeUserIdFromToken(tokenCookie);
  if (uidFromCookie) return uidFromCookie;

  // 3) x-user-id (UUID) — لأغراض خاصة/داخلية
  const headerUid = asUuid(req.headers.get('x-user-id') || '');
  if (headerUid) return headerUid;

  // 4) dev only: testUserId
  if (process.env.NODE_ENV !== 'production') {
    const url = new URL(req.url);
    const testUserId = asUuid(url.searchParams.get('testUserId') || '');
    if (testUserId) return testUserId;
  }

  return null;
}

/** GET /api/my/posts?status=all|approved|pending|rejected&q=&page=&limit= */
export async function GET(req) {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return NextResponse.json({ message: 'غير مصرح: يرجى تسجيل الدخول.' }, { status: 401 });
  }

  const pool = getPool();
  const url = new URL(req.url);

  const status = (url.searchParams.get('status') || 'all').trim();
  const q = (url.searchParams.get('q') || url.searchParams.get('search') || '').trim();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(300, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
  const offset = (page - 1) * limit;

  const where = ['p.user_id = $1'];
  const params = [userId];
  let i = 2;

  if (status && status !== 'all') {
    where.push(`p.status = $${i++}`);
    params.push(status);
  }

  if (q) {
    where.push(`(
      p.title ILIKE $${i} OR
      p.description ILIKE $${i} OR
      p.governorate ILIKE $${i} OR
      c.name ILIKE $${i} OR
      EXISTS (
        SELECT 1 FROM post_tags pt
        JOIN tags t2 ON t2.id = pt.tag_id
        WHERE pt.post_id = p.id AND t2.name ILIKE $${i}
      )
    )`);
    params.push(`%${q}%`);
    i++;
  }

  const listSql = `
    SELECT
      p.id, p.title, p.description, p.governorate, p.price,
      p.status, p.is_visible, p.created_at, p.category_id,
      c.name AS category_name,
      COALESCE(array_agg(DISTINCT t.name) FILTER (WHERE t.id IS NOT NULL), '{}') AS tags
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN post_tags pt ON pt.post_id = p.id
    LEFT JOIN tags t ON t.id = pt.tag_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    GROUP BY p.id, c.name
    ORDER BY p.created_at DESC
    LIMIT $${i++} OFFSET $${i++}
  `;

  const countSql = `
    SELECT COUNT(*)::int AS cnt
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
  `;

  const client = await pool.connect();
  try {
    const listParams = [...params, limit, offset];
    const [{ rows: items }, { rows: cntRows }] = await Promise.all([
      client.query(listSql, listParams),
      client.query(countSql, params),
    ]);

    const total = cntRows?.[0]?.cnt ?? items.length;
    return NextResponse.json({
      posts: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error('GET /api/my/posts error:', e);
    return NextResponse.json({ message: 'تعذّر جلب المنشورات' }, { status: 500 });
  } finally {
    client.release();
  }
}
