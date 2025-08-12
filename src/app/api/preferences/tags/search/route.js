export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** يجلب جلسة المستخدم من /api/test-session (عامة – لا يشترط دخول) */
async function getSessionFromTestAPI(req) {
  try {
    const origin = new URL(req.url).origin;
    const url = new URL('/api/test-session', origin);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        cookie: req.headers.get('cookie') || '',
        authorization: req.headers.get('authorization') || '',
        accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    // وجود جلسة ليس مطلوباً لهذا المسار، لكنه لا يضر
    await getSessionFromTestAPI(req);

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    let limit = parseInt(searchParams.get('limit') || '20', 10);
    let offset = parseInt(searchParams.get('offset') || '0', 10);
    if (!Number.isFinite(limit) || limit < 1 || limit > 100) limit = 20;
    if (!Number.isFinite(offset) || offset < 0) offset = 0;

    const like = q ? `%${q}%` : '%';

    const rows = await prisma.$queryRaw`
      SELECT
        t.id::text  AS id,
        t.name      AS name,
        COALESCE(f.cnt, 0)::int AS followers
      FROM tags t
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS cnt
        FROM user_tag_follows uf
        WHERE uf.tag_id = t.id
      ) f ON TRUE
      WHERE t.name ILIKE ${like}
      ORDER BY followers DESC, t.name ASC
      LIMIT ${limit} OFFSET ${offset};
    `;

    return NextResponse.json(Array.isArray(rows) ? rows : [], { status: 200 });
  } catch (e) {
    console.error('GET /api/tags/search error:', e);
    return NextResponse.json({ error: 'فشل البحث في التاغات' }, { status: 500 });
  }
}
