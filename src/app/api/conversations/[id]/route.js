export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-secret';

function getUserFromReq(req) {
  // نقرأ التوكن من Authorization: Bearer ... أو من الكوكي token=
  const h = req.headers.get('authorization') || '';
  const bearer = h.startsWith('Bearer ') ? h.slice(7) : null;

  const cookie = req.headers.get('cookie') || '';
  const tokenCookie = cookie.split(';').find(c => c.trim().startsWith('token='));
  const tok = bearer || (tokenCookie ? decodeURIComponent(tokenCookie.split('=')[1]) : null);

  if (!tok) return null;
  try { return jwt.verify(tok, JWT_SECRET); } catch { return null; }
}

/* GET /api/conversations/:id  -> جلب الرسائل */
export async function GET(_req, { params }) {
  try {
    const payload = getUserFromReq(_req);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const convId = Number(params?.id || params?.conversationId);
    if (!Number.isInteger(convId)) {
      return NextResponse.json({ error: 'معرّف محادثة غير صالح' }, { status: 400 });
    }

    // تحقّق أن المستخدم مشارك في هذه المحادثة
    const isParticipant = await prisma.$queryRaw`
      SELECT 1
      FROM conversation_participants
      WHERE conversation_id = ${convId}
        AND actor_id = ${payload.userId}::uuid
      LIMIT 1;
    `;
    if (isParticipant.length === 0) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // نجلب الرسائل + أسماء المرسل حسب نوعه (user/store)
    const rows = await prisma.$queryRaw`
      SELECT 
        m.id::int,
        m.conversation_id::int,
        m.sender_id::text,
        m.sender_type::text,
        m.content::text,
        COALESCE(m.is_read, false) AS is_read,
        m.created_at,
        CASE 
          WHEN m.sender_type::text = 'user'  THEN (SELECT u.name  FROM users  u WHERE u.id = m.sender_id)
          WHEN m.sender_type::text = 'store' THEN (SELECT s.name  FROM stores s WHERE s.id = m.sender_id)
          ELSE 'مستخدم'
        END AS sender_name,
        NULL::text AS sender_avatar
      FROM messages m
      WHERE m.conversation_id = ${convId}
      ORDER BY m.created_at ASC, m.id ASC;
    `;

    return NextResponse.json(rows ?? [], { status: 200 });
  } catch (e) {
    console.error('GET /api/conversations/[id] error:', e);
    return NextResponse.json({ error: 'فشل تحميل الرسائل' }, { status: 500 });
  }
}

/* POST /api/conversations/:id  -> إرسال رسالة جديدة */
export async function POST(req, { params }) {
  try {
    const payload = getUserFromReq(req);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const convId = Number(params?.id || params?.conversationId);
    if (!Number.isInteger(convId)) {
      return NextResponse.json({ error: 'معرّف محادثة غير صالح' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const content = (body?.content || '').trim();
    if (!content) {
      return NextResponse.json({ error: 'المحتوى مطلوب' }, { status: 400 });
    }

    // تأكيد أن المستخدم مشارك في المحادثة ومعرفة نوعه (user/store)
    const roleRows = await prisma.$queryRaw`
      SELECT actor_type::text AS actor_type
      FROM conversation_participants
      WHERE conversation_id = ${convId}
        AND actor_id = ${payload.userId}::uuid
      LIMIT 1;
    `;
    if (roleRows.length === 0) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    const senderType = roleRows[0].actor_type; // 'user' | 'store'

    // إدراج الرسالة
    const inserted = await prisma.$queryRaw`
      INSERT INTO messages (conversation_id, sender_id, sender_type, content, is_read)
      VALUES (${convId}, ${payload.userId}::uuid, ${senderType}::actor_type, ${content}, false)
      RETURNING id, conversation_id, sender_id, sender_type::text AS sender_type, content, is_read, created_at;
    `;

    const msg = inserted[0];

    // تحديث بيانات المحادثة
    await prisma.$executeRaw`
      UPDATE conversations c
      SET last_message_id = ${msg.id},
          last_message_at = ${msg.created_at},
          updated_at = NOW()
      WHERE c.id = ${convId};
    `;

    // نضيف الاسم للمُرجع
    const withName = await prisma.$queryRaw`
      SELECT 
        ${msg.id}::int                AS id,
        ${msg.conversation_id}::int   AS conversation_id,
        ${msg.sender_id}::text        AS sender_id,
        ${msg.sender_type}::text      AS sender_type,
        ${msg.content}::text          AS content,
        ${msg.is_read}                AS is_read,
        ${msg.created_at}             AS created_at,
        CASE 
          WHEN ${msg.sender_type}::text = 'user'  THEN (SELECT u.name FROM users u  WHERE u.id = ${msg.sender_id}::uuid)
          WHEN ${msg.sender_type}::text = 'store' THEN (SELECT s.name FROM stores s WHERE s.id = ${msg.sender_id}::uuid)
          ELSE 'مستخدم'
        END AS sender_name,
        NULL::text AS sender_avatar;
    `;

    return NextResponse.json(withName[0], { status: 201 });
  } catch (e) {
    console.error('POST /api/conversations/[id] error:', e);
    return NextResponse.json({ error: 'فشل إرسال الرسالة' }, { status: 500 });
  }
}
