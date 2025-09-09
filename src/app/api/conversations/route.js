// app/api/conversations/[id]/route.js
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
    const p = getUserFromReq(req);
    if (!p?.userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const me = String(p.userId);
    const convId = Number(params.id);
    if (!Number.isInteger(convId)) {
      return NextResponse.json({ error: 'معرّف محادثة غير صالح' }, { status: 400 });
    }

    const access = await prisma.conversation_participants.findFirst({
      where: { conversation_id: convId, actor_id: me },
      select: { id: true },
    });
    if (!access) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const messages = await prisma.$queryRaw`
      SELECT 
        m.id::text                      AS id,
        m.conversation_id::text         AS conversation_id,
        m.sender_id::text               AS sender_id,
        m.sender_type::text             AS sender_type,
        m.content,
        COALESCE(m.is_read, false)      AS is_read,
        m.created_at,
        CASE WHEN m.sender_type::text='user'  THEN u.name
             WHEN m.sender_type::text='store' THEN s.name
        END                              AS sender_name,
        NULL::text                       AS sender_avatar
      FROM messages m
      LEFT JOIN users  u ON m.sender_type::text='user'  AND m.sender_id = u.id
      LEFT JOIN stores s ON m.sender_type::text='store' AND m.sender_id = s.id
      WHERE m.conversation_id = ${convId}
      ORDER BY m.created_at ASC;
    `;

    await prisma.messages.updateMany({
      where: { conversation_id: convId, sender_id: { not: me }, is_read: false },
      data: { is_read: true, updated_at: new Date() },
    });

    return NextResponse.json(messages ?? [], { status: 200 });
  } catch (e) {
    console.error('GET /api/conversations/[id] error:', e);
    return NextResponse.json({ error: 'فشل تحميل الرسائل' }, { status: 500 });
  }
}