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

export async function GET(req) {
  try {
    const p = getUserFromReq(req);
    if (!p?.userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const me = String(p.userId);

    const rows = await prisma.$queryRaw`
      WITH me AS (SELECT ${me}::uuid AS id),
      rows AS (
        SELECT
          c.id,
          c.updated_at,
          c.last_message_id,
          c.last_message_at,
          other.actor_id   AS participant_id,
          other.actor_type AS participant_type_udt,
          (
            SELECT COUNT(*)::int 
            FROM messages m 
            WHERE m.conversation_id = c.id 
              AND m.sender_id <> (SELECT id FROM me) 
              AND COALESCE(m.is_read, false) = false
          ) AS unread_per_conv
        FROM conversation_participants cp
        JOIN conversations c ON c.id = cp.conversation_id
        JOIN conversation_participants other
          ON other.conversation_id = c.id AND other.actor_id <> cp.actor_id
        WHERE cp.actor_id = (SELECT id FROM me)
      )
      SELECT DISTINCT ON (r.participant_id)
        r.id::text AS id,
        r.last_message_at,
        lm.content AS last_message,
        (
          SELECT SUM(unread_per_conv)::int 
          FROM rows r2 
          WHERE r2.participant_id = r.participant_id
        ) AS unread_count,
        r.participant_type_udt::text AS participant_type,
        COALESCE(u.name, s.name, 'مستخدم') AS participant_name,
        NULL::text AS participant_avatar
      FROM rows r
      LEFT JOIN users  u ON r.participant_type_udt::text='user'  AND u.id = r.participant_id
      LEFT JOIN stores s ON r.participant_type_udt::text='store' AND s.id = r.participant_id
      LEFT JOIN messages lm ON lm.id = r.last_message_id
      ORDER BY r.participant_id, r.updated_at DESC NULLS LAST, r.id DESC;
    `;

    return NextResponse.json(rows ?? [], { status: 200 });
  } catch (e) {
    console.error('GET /api/chats error:', e);
    return NextResponse.json({ error: 'فشل تحميل المحادثات' }, { status: 500 });
  }
}
