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

export async function POST(req) {
  try {
    const p = getUserFromReq(req);
    if (!p?.userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const me = String(p.userId);
    const { conversationId, content } = await req.json();
    if (!conversationId || !/^\d+$/.test(String(conversationId)) || !content?.trim()) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }
    const convId = String(conversationId);

    const access = await prisma.$queryRaw`
      SELECT actor_type
      FROM conversation_participants
      WHERE conversation_id = ${convId}::bigint AND actor_id = ${me}::uuid
      LIMIT 1;
    `;
    if (!access?.length) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const inserted = await prisma.$queryRaw`
      WITH ins AS (
        INSERT INTO messages (conversation_id, sender_id, sender_type, content)
        SELECT ${convId}::bigint, ${me}::uuid, cp.actor_type, ${content}
        FROM conversation_participants cp
        WHERE cp.conversation_id = ${convId}::bigint AND cp.actor_id = ${me}::uuid
        RETURNING id, conversation_id, sender_id, sender_type, content, is_read, created_at, updated_at
      ),
      upd_conv AS (
        UPDATE conversations c
        SET last_message_id = (SELECT id FROM ins),
            last_message_at = now()
        WHERE c.id = ${convId}::bigint
        RETURNING 1
      ),
      upd_read AS (
        UPDATE conversation_participants
        SET last_read_message_id = (SELECT id FROM ins)
        WHERE conversation_id = ${convId}::bigint AND actor_id = ${me}::uuid
        RETURNING 1
      )
      SELECT
        i.id::text AS id,
        i.conversation_id::text AS conversation_id,
        i.sender_id::text AS sender_id,
        (i.sender_type)::text AS sender_type,
        i.content,
        COALESCE(i.is_read,false) AS is_read,
        i.created_at,
        i.updated_at
      FROM ins i;
    `;

    return NextResponse.json(inserted?.[0] ?? null, { status: 201 });
  } catch (e) {
    console.error('POST /api/messages error:', e);
    return NextResponse.json({ error: 'فشل إرسال الرسالة' }, { status: 500 });
  }
}
