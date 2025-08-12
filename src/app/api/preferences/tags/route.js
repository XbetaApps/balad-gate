// src/app/api/tags/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// جلب جلسة المستخدم من /api/test-session
async function getSession(req) {
  try {
    const origin = new URL(req.url).origin;
    const res = await fetch(new URL('/api/test-session', origin), {
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
    const s = await getSession(req);
    if (!s?.authenticated) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const uid = s?.rawPayload?.userId || s?.user?.id;

    const { searchParams } = new URL(req.url);
    const q      = (searchParams.get('q') || '').trim();
    const sort   = (searchParams.get('sort') || 'name').toLowerCase(); // 'name' | 'popular'
    const limit  = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10), 1), 500);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    // نفرّع الاستعلام حسب الفرز لتفادي ORDER BY ديناميكي
    let rows = [];
    if (sort === 'popular') {
      rows = await prisma.$queryRaw`
        SELECT
          t.id::text AS id,
          t.name     AS name,
          COALESCE(fc.followers, 0)::int AS follower_count,
          uf.status  AS user_status
        FROM tags t
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS followers
          FROM user_tag_follows utf
          WHERE utf.tag_id = t.id AND utf.status = 'followed'
        ) fc ON TRUE
        LEFT JOIN user_tag_follows uf
          ON uf.tag_id = t.id AND uf.user_id = ${uid}::uuid
        WHERE (${q} = '' OR t.name ILIKE '%' || ${q} || '%')
        ORDER BY COALESCE(fc.followers, 0) DESC, t.name ASC
        LIMIT ${limit} OFFSET ${offset};
      `;
    } else {
      rows = await prisma.$queryRaw`
        SELECT
          t.id::text AS id,
          t.name     AS name,
          COALESCE(fc.followers, 0)::int AS follower_count,
          uf.status  AS user_status
        FROM tags t
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS followers
          FROM user_tag_follows utf
          WHERE utf.tag_id = t.id AND utf.status = 'followed'
        ) fc ON TRUE
        LEFT JOIN user_tag_follows uf
          ON uf.tag_id = t.id AND uf.user_id = ${uid}::uuid
        WHERE (${q} = '' OR t.name ILIKE '%' || ${q} || '%')
        ORDER BY t.name ASC
        LIMIT ${limit} OFFSET ${offset};
      `;
    }

    // is_following للراحة في الواجهة
    const items = (rows || []).map(r => ({
      id: r.id,
      name: r.name,
      follower_count: r.follower_count ?? 0,
      user_status: r.user_status ?? null,
      is_following: r.user_status === 'followed',
    }));

    return NextResponse.json({ items, count: items.length }, { status: 200 });
  } catch (e) {
    console.error('GET /api/tags error:', e);
    return NextResponse.json({ error: 'فشل جلب التاغات' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const s = await getSession(req);
    const role = s?.rawPayload?.role_id ?? s?.user?.role_id;
    if (!s?.authenticated || Number(role) !== 4) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name = (body?.name || '').trim();
    if (!name) {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    // إنشاء تاغ جديد
    const created = await prisma.$queryRaw`
      INSERT INTO tags (name)
      VALUES (${name})
      ON CONFLICT (name) DO NOTHING
      RETURNING id::text AS id, name;
    `;

    if (!created?.[0]) {
      return NextResponse.json({ error: 'هذا التاغ موجود مسبقاً' }, { status: 409 });
    }

    return NextResponse.json({ id: created[0].id, name: created[0].name }, { status: 201 });
  } catch (e) {
    console.error('POST /api/tags error:', e);
    return NextResponse.json({ error: 'فشل إنشاء التاغ' }, { status: 500 });
  }
}
