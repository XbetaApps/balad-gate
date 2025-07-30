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
  // إذا كنت تستخدم توكن JWT مخصص باسمه "token"
  const tokenCookie = cookie.split(';').find(c => c.trim().startsWith('token='));
  const tok = bearer || (tokenCookie ? decodeURIComponent(tokenCookie.split('=')[1]) : null);
  if (!tok) return null;
  try { return jwt.verify(tok, JWT_SECRET); } catch { return null; }
}

// التحقق أن المستخدم طرف في الـ thread أو أدمن role_id=4
async function canAccessThread(threadId, userId) {
  const th = await prisma.support_threads.findUnique({
    where: { id: threadId },
    select: { user_id: true, admin_id: true },
  });
  if (!th) return false;
  if (th.user_id === userId) return true;
  if (th.admin_id === userId) return true;

  // بديل: أي مستخدم role_id=4 يعتبر له صلاحية الوصول
  const u = await prisma.users.findUnique({
    where: { id: userId },
    select: { role_id: true },
  });
  return u?.role_id === 4;
}

// GET: جلب رسائل التيكت + تعليم الرسائل الواردة كمقروءة
export async function GET(req, { params }) {
  try {
    const p = getUserFromReq(req);
    if (!p?.userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const me = String(p.userId);
    const threadId = String(params?.threadId);

    const allowed = await canAccessThread(threadId, me);
    if (!allowed) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    // علّم رسائل الطرف الآخر كمقروءة
    await prisma.support_messages.updateMany({
      where: { thread_id: threadId, sender_id: { not: me }, is_read: false },
      data: { is_read: true },
    });

    const messages = await prisma.support_messages.findMany({
      where: { thread_id: threadId },
      orderBy: { created_at: 'asc' },
      select: {
        id: true,
        thread_id: true,
        sender_id: true,
        sender_role: true, // 'user' | 'admin'
        content: true,
        is_read: true,
        created_at: true,
      },
    });

    const formatted = messages.map(m => ({
      id: String(m.id),
      threadId: String(m.thread_id),
      senderId: String(m.sender_id),
      senderRole: m.sender_role,
      content: m.content,
      isRead: m.is_read,
      timestamp: m.created_at,
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (e) {
    console.error('GET /api/support/threads/[threadId]/messages error:', e);
    return NextResponse.json({ error: 'فشل تحميل الرسائل' }, { status: 500 });
  }
}

// POST: إرسال رسالة داخل تيكت دعم
// body: { content: string }
export async function POST(req, { params }) {
  try {
    const p = getUserFromReq(req);
    if (!p?.userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const me = String(p.userId);
    const threadId = String(params?.threadId);
    const { content } = await req.json();

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'نص الرسالة مطلوب' }, { status: 400 });
    }

    const allowed = await canAccessThread(threadId, me);
    if (!allowed) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    // حدد الدور للرسالة (user/admin) من خلال role_id
    const u = await prisma.users.findUnique({
      where: { id: me },
      select: { role_id: true, name: true },
    });
    const senderRole = u?.role_id === 4 ? 'admin' : 'user';

    const saved = await prisma.$transaction(async (tx) => {
      const msg = await tx.support_messages.create({
        data: {
          thread_id: threadId,
          sender_id: me,
          sender_role: senderRole, // enum('user','admin')
          content: content.trim(),
          is_read: true, // المرسل قرأ رسالته
        },
        select: { id: true, created_at: true },
      });

      await tx.support_threads.update({
        where: { id: threadId },
        data: {
          last_message_id: msg.id,
          last_message_at: msg.created_at,
          updated_at: msg.created_at,
        },
      });

      return msg;
    });

    return NextResponse.json({
      id: String(saved.id),
      threadId,
      senderId: me,
      senderRole,
      content: content.trim(),
      isRead: true,
      timestamp: saved.created_at,
    }, { status: 201 });
  } catch (e) {
    console.error('POST /api/support/threads/[threadId]/messages error:', e);
    return NextResponse.json({ error: 'فشل إرسال الرسالة' }, { status: 500 });
  }
}
