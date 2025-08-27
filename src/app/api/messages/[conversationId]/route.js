export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-secret';

/** استخراج المستخدم من الـ Authorization Bearer أو من الكوكي token= */
function getUserFromReq(req) {
  const h = req.headers.get('authorization') || '';
  const bearer = h.startsWith('Bearer ') ? h.slice(7) : null;

  const cookie = req.headers.get('cookie') || '';
  const tokenCookie = cookie.split(';').find((c) => c.trim().startsWith('token='));
  const cookieToken = tokenCookie ? decodeURIComponent(tokenCookie.split('=')[1]) : null;

  const tok = bearer || cookieToken;
  if (!tok) return null;

  try {
    return jwt.verify(tok, JWT_SECRET); // { userId, email, name, role_id, ... }
  } catch {
    return null;
  }
}

/**
 * GET /api/conversations/[id]
 * يرجع رسائل المحادثة (بعد التحقق أن المستخدم مشارك فيها)
 * ويحدّث last_read_message_id للطرف الحالي
 */
export async function GET(req, { params }) {
  try {
    const p = getUserFromReq(req);
    if (!p?.userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const me = String(p.userId);

    const convIdStr = String(params?.id ?? '').trim();
    const convIdNum = Number.parseInt(convIdStr, 10);
    if (!Number.isFinite(convIdNum)) {
      return NextResponse.json({ error: 'conversationId غير صالح' }, { status: 400 });
    }

    // تأكد أن المستخدم عضو في هذه المحادثة
    const access = await prisma.$queryRaw`
      SELECT 1
      FROM conversation_participants
      WHERE conversation_id = ${convIdNum} AND actor_id = ${me}
      LIMIT 1;
    `;
    if (!access?.length) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // جلب الرسائل (نستخدم subselects بـ id::text لضمان التوافق سواء كانت الأعمدة uuid أو text)
    const messages = await prisma.$queryRaw`
      SELECT
        m.id::text               AS id,
        m.conversation_id::text  AS conversation_id,
        m.sender_id::text        AS sender_id,
        (m.sender_type)::text    AS sender_type,
        m.content                AS content,
        COALESCE(m.is_read, false) AS is_read,
        m.created_at             AS created_at,
        m.updated_at             AS updated_at,
        CASE
          WHEN (m.sender_type)::text = 'user'
            THEN (SELECT u.name FROM users u WHERE u.id::text = m.sender_id::text LIMIT 1)
          WHEN (m.sender_type)::text = 'store'
            THEN (SELECT s.name FROM stores s WHERE s.id::text = m.sender_id::text LIMIT 1)
          ELSE 'مستخدم'
        END AS sender_name,
        CASE
          WHEN (m.sender_type)::text = 'user'
            THEN (SELECT u.image FROM users u WHERE u.id::text = m.sender_id::text LIMIT 1)
          WHEN (m.sender_type)::text = 'store'
            THEN (SELECT s.logo_url FROM stores s WHERE s.id::text = m.sender_id::text LIMIT 1)
          ELSE NULL
        END AS sender_avatar
      FROM messages m
      WHERE m.conversation_id = ${convIdNum}
      ORDER BY m.created_at ASC;
    `;

    // تحديث آخر رسالة مقروءة للمستخدم الحالي (إن وُجدت رسائل)
    if (messages?.length) {
      const lastIdStr = messages[messages.length - 1].id;
      const lastIdNum = Number.parseInt(lastIdStr, 10);
      if (Number.isFinite(lastIdNum)) {
        await prisma.$executeRaw`
          UPDATE conversation_participants
          SET last_read_message_id = ${lastIdNum}
          WHERE conversation_id = ${convIdNum} AND actor_id = ${me};
        `;
      }
    }

    return NextResponse.json(messages ?? [], { status: 200 });
  } catch (e) {
    console.error('GET /api/conversations/[id] error:', e);
    return NextResponse.json({ error: 'فشل تحميل الرسائل' }, { status: 500 });
  }
}

/**
 * POST /api/conversations/[id]
 * إرسال رسالة جديدة داخل محادثة (بعد التحقق أن المستخدم عضو فيها)
 * يُحدث last_message_at/last_message_id ويُرجع الرسالة المضافة
 */
export async function POST(req, { params }) {
  try {
    const p = getUserFromReq(req);
    if (!p?.userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const me = String(p.userId);

    const convIdStr = String(params?.id ?? '').trim();
    const convIdNum = Number.parseInt(convIdStr, 10);
    if (!Number.isFinite(convIdNum)) {
      return NextResponse.json({ error: 'conversationId غير صالح' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const content = body?.content ? String(body.content).trim() : '';
    if (!content) {
      return NextResponse.json({ error: 'لا يوجد محتوى للرسالة' }, { status: 400 });
    }

    // تأكد أن المستخدم عضو واحصل نوعه (user/store) من participants
    const roleRows = await prisma.$queryRaw`
      SELECT actor_type::text AS actor_type
      FROM conversation_participants
      WHERE conversation_id = ${convIdNum} AND actor_id = ${me}
      LIMIT 1;
    `;
    if (!roleRows?.length) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    const senderType = roleRows[0].actor_type; // 'user' أو 'store'

    // معاملة: إدراج الرسالة + تحديث بيانات المحادثة + تحديث آخر رسالة مقروءة للمرسل
    const newMessage = await prisma.$transaction(async (tx) => {
      // 1) إدراج الرسالة واسترجاع id
      const inserted = await tx.$queryRaw`
        INSERT INTO messages (conversation_id, sender_id, sender_type, content)
        VALUES (${convIdNum}, ${me}, ${senderType}::sender_type, ${content})
        RETURNING id;
      `;
      const newId = inserted?.[0]?.id;
      if (!newId) throw new Error('Failed to insert message');

      // 2) تحديث بيانات المحادثة
      await tx.$executeRaw`
        UPDATE conversations
        SET last_message_id = ${newId}, last_message_at = NOW(), updated_at = NOW()
        WHERE id = ${convIdNum};
      `;

      // 3) تحديث آخر رسالة مقروءة للمرسل
      await tx.$executeRaw`
        UPDATE conversation_participants
        SET last_read_message_id = ${newId}
        WHERE conversation_id = ${convIdNum} AND actor_id = ${me};
      `;

      // 4) إعادة الرسالة بشكل جاهز للـ UI (casts إلى نص لتجنب BigInt في JSON)
      const rows = await tx.$queryRaw`
        SELECT
          m.id::text               AS id,
          m.conversation_id::text  AS conversation_id,
          m.sender_id::text        AS sender_id,
          (m.sender_type)::text    AS sender_type,
          m.content                AS content,
          COALESCE(m.is_read, false) AS is_read,
          m.created_at             AS created_at,
          m.updated_at             AS updated_at,
          CASE
            WHEN (m.sender_type)::text = 'user'
              THEN (SELECT u.name FROM users u WHERE u.id::text = m.sender_id::text LIMIT 1)
            WHEN (m.sender_type)::text = 'store'
              THEN (SELECT s.name FROM stores s WHERE s.id::text = m.sender_id::text LIMIT 1)
            ELSE 'مستخدم'
          END AS sender_name,
          CASE
            WHEN (m.sender_type)::text = 'user'
              THEN (SELECT u.image FROM users u WHERE u.id::text = m.sender_id::text LIMIT 1)
            WHEN (m.sender_type)::text = 'store'
              THEN (SELECT s.logo_url FROM stores s WHERE s.id::text = m.sender_id::text LIMIT 1)
            ELSE NULL
          END AS sender_avatar
        FROM messages m
        WHERE m.id = ${newId}
        LIMIT 1;
      `;
      return rows?.[0] ?? null;
    });

    if (!newMessage) {
      return NextResponse.json({ error: 'تعذّر إنشاء الرسالة' }, { status: 500 });
    }

    return NextResponse.json(newMessage, { status: 201 });
  } catch (e) {
    console.error('POST /api/conversations/[id] error:', e);
    return NextResponse.json({ error: 'فشل إرسال الرسالة' }, { status: 500 });
  }
}
