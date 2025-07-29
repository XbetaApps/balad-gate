export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-secret';

function getUserFromReq(req) {
  const h = req.headers.get('authorization') || '';
  const bearer = h.startsWith('Bearer ') ? h.slice(7) : null;
  const cookie = req.headers.get('cookie') || '';
  const tokenCookie = cookie.split(';').find(c => c.trim().startsWith('token='));
  const tok = bearer || (tokenCookie ? decodeURIComponent(tokenCookie.split('=')[1]) : null);
  if (!tok) return null;
  try { return jwt.verify(tok, JWT_SECRET); } catch { return null; }
}

export async function GET(req, { params }) {
  try {
    // Debug مفيد: يظهر لك أن الراوت تم الوصول له فعلاً
    console.log('HIT /api/conversations/[id] with params:', params);

    const p = getUserFromReq(req);
    if (!p?.userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const me = String(p.userId);
    const convId = String(params.id || '').trim();
    if (!convId || !/^\d+$/.test(convId)) {
      return NextResponse.json({ error: 'conversationId غير صالح' }, { status: 400 });
    }

    // تأكيد الوصول للمحادثة
    const access = await prisma.$queryRaw`
      SELECT 1
      FROM conversation_participants
      WHERE conversation_id = ${convId}::bigint AND actor_id = ${me}::uuid
      LIMIT 1;
    `;
    if (!access?.length) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // جلب الرسائل + أسماء المرسلين
    const msgs = await prisma.$queryRaw`
      SELECT
        m.id::text                AS id,
        m.conversation_id::text   AS conversation_id,
        m.sender_id::text         AS sender_id,
        (m.sender_type)::text     AS sender_type,
        m.content                 AS content,
        COALESCE(m.is_read, false) AS is_read,
        m.created_at              AS created_at,
        m.updated_at              AS updated_at,
        COALESCE(u.name, s.name, 'مستخدم') AS sender_name,
        NULL::text                AS sender_avatar
      FROM messages m
      LEFT JOIN users  u ON (m.sender_type)::text='user'  AND u.id = m.sender_id
      LEFT JOIN stores s ON (m.sender_type)::text='store' AND s.id = m.sender_id
      WHERE m.conversation_id = ${convId}::bigint
      ORDER BY m.created_at ASC;
    `;

    // تحديث آخر رسالة مقروءة
    await prisma.$executeRaw`
      WITH lastm AS (
        SELECT id FROM messages
        WHERE conversation_id = ${convId}::bigint
        ORDER BY id DESC
        LIMIT 1
      )
      UPDATE conversation_participants
      SET last_read_message_id = (SELECT id FROM lastm)
      WHERE conversation_id = ${convId}::bigint AND actor_id = ${me}::uuid;
    `;

    return NextResponse.json(msgs ?? [], { status: 200 });
  } catch (e) {
    console.error('GET /api/conversations/[id] error:', e);
    return NextResponse.json({ error: 'فشل تحميل الرسائل' }, { status: 500 });
  }
}
