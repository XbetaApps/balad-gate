export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getSessionFromTestAPI(req) {
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
  const data = await res.json().catch(() => null);
  return data;
}

export async function GET(req, { params }) {
  try {
    const s = await getSessionFromTestAPI(req);
    if (!s?.authenticated) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const meId = s?.rawPayload?.userId || s?.user?.id;
    const roleId = s?.rawPayload?.role_id ?? s?.user?.role_id;
    if (!meId) return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 });

    const threadId = (params?.threadId || '').toString().trim();
    if (!threadId) return NextResponse.json({ error: 'threadId مفقود' }, { status: 400 });

    // تحقق الوصول: صاحب الثريد
    const ownerRow = await prisma.$queryRaw`
      SELECT user_id::text AS user_id
      FROM support_threads
      WHERE id = ${threadId}::bigint
      LIMIT 1;
    `;
    const ownerId = ownerRow?.[0]?.user_id;
    if (!ownerId) return NextResponse.json({ error: 'الثريد غير موجود' }, { status: 404 });
    if (Number(roleId) !== 4 && ownerId !== meId) {
      return NextResponse.json({ error: 'غير مصرح لك للوصول إلى هذا الثريد' }, { status: 403 });
    }

    const isAdmin = Number(roleId) === 4;

    const msgs = await prisma.$queryRaw`
      SELECT
        sm.id::text AS id,
        sm.thread_id::text AS thread_id,
        sm.sender_id::text AS sender_id,
        (sm.sender_type::text = 'admin') AS sender_is_admin,
        sm.sender_type::text AS sender_type,
        sm.content AS content,
        CASE WHEN ${isAdmin} THEN sm.is_read_by_admin ELSE sm.is_read_by_user END AS is_read,
        sm.is_read_by_user,
        sm.is_read_by_admin,
        sm.created_at AS created_at,
        COALESCE(u.name, 'مستخدم') AS sender_name
      FROM support_messages sm
      LEFT JOIN users u ON u.id = sm.sender_id
      WHERE sm.thread_id = ${threadId}::bigint
      ORDER BY sm.created_at ASC, sm.id ASC;
    `;

    return NextResponse.json(msgs ?? [], { status: 200 });
  } catch (e) {
    console.error('GET /api/support/messages/[threadId] error:', e);
    return NextResponse.json(
      { error: 'فشل تحميل رسائل الدعم', details: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  try {
    const s = await getSessionFromTestAPI(req);
    if (!s?.authenticated) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const meId = s?.rawPayload?.userId || s?.user?.id;
    const roleId = s?.rawPayload?.role_id ?? s?.user?.role_id;
    if (!meId) return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 });

    const threadId = (params?.threadId || '').toString().trim();
    if (!threadId) return NextResponse.json({ error: 'threadId مفقود' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const content = (body?.content || '').toString().trim();
    if (!content) return NextResponse.json({ error: 'المحتوى مطلوب' }, { status: 400 });

    // تحقق الوصول: صاحب الثريد
    const ownerRow = await prisma.$queryRaw`
      SELECT user_id::text AS user_id
      FROM support_threads
      WHERE id = ${threadId}::bigint
      LIMIT 1;
    `;
    const ownerId = ownerRow?.[0]?.user_id;
    if (!ownerId) return NextResponse.json({ error: 'الثريد غير موجود' }, { status: 404 });
    if (Number(roleId) !== 4 && ownerId !== meId) {
      return NextResponse.json({ error: 'غير مصرح لك للكتابة في هذا الثريد' }, { status: 403 });
    }

    const isAdmin = Number(roleId) === 4;
    const senderType = isAdmin ? 'admin' : 'user';

    // أدخل الرسالة
    const ins = await prisma.$queryRaw`
      INSERT INTO support_messages (thread_id, sender_id, sender_type, content)
      VALUES (${threadId}::bigint, ${meId}::uuid, ${senderType}, ${content})
      RETURNING id::text AS id, created_at;
    `;
    const mid = ins?.[0]?.id;
    const mtime = ins?.[0]?.created_at;

    if (mid) {
      await prisma.$executeRaw`
        UPDATE support_threads
        SET last_message_id = ${mid}::bigint,
            last_message_at = ${mtime},
            updated_at = NOW()
        WHERE id = ${threadId}::bigint;
      `;
    }

    return NextResponse.json({ id: mid, created_at: mtime }, { status: 200 });
  } catch (e) {
    console.error('POST /api/support/messages/[threadId] error:', e);
    return NextResponse.json(
      { error: 'فشل إرسال رسالة الدعم', details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
