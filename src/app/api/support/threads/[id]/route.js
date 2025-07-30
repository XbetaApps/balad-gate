// src/app/api/support/threads/[id]/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromReq, isAdmin } from '../../_auth';

const prisma = new PrismaClient();

async function canAccessThread(threadId, payload) {
  const t = await prisma.supportThread.findUnique({
    where: { id: Number(threadId) },
    select: { id: true, userId: true }
  });
  if (!t) return { ok: false, status: 404, error: 'التذكرة غير موجودة' };
  if (isAdmin(payload) || t.userId === String(payload.userId)) return { ok: true, thread: t };
  return { ok: false, status: 403, error: 'غير مصرح' };
}

export async function GET(req, { params }) {
  try {
    const p = getUserFromReq(req);
    if (!p?.userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = params;
    const access = await canAccessThread(id, p);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    // جلب الرسائل
    const msgs = await prisma.supportMessage.findMany({
      where: { threadId: Number(id) },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true, image: true, email: true } } }
    });

    // تعليم الرسائل كمقروءة للطرف القارئ
    if (isAdmin(p)) {
      await prisma.supportMessage.updateMany({
        where: { threadId: Number(id), senderId: { not: String(p.userId) }, isReadByAdmin: false },
        data: { isReadByAdmin: true }
      });
    } else {
      await prisma.supportMessage.updateMany({
        where: { threadId: Number(id), senderId: { not: String(p.userId) }, isReadByUser: false },
        data: { isReadByUser: true }
      });
    }

    const shaped = msgs.map(m => ({
      id: Number(m.id),
      thread_id: Number(m.threadId),
      sender_id: m.senderId,
      sender_type: m.senderType, // 'user' | 'admin'
      content: m.content,
      created_at: m.createdAt,
      sender_name: m.sender?.name || 'مستخدم',
      sender_avatar: m.sender?.image || null
    }));

    return NextResponse.json(shaped, { status: 200 });
  } catch (e) {
    console.error('GET /api/support/threads/[id] error:', e);
    return NextResponse.json({ error: 'فشل تحميل الرسائل' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const p = getUserFromReq(req);
    if (!p?.userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = params;
    const access = await canAccessThread(id, p);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const { content } = await req.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'المحتوى مطلوب' }, { status: 400 });
    }

    const isAdminSender = isAdmin(p);

    const msg = await prisma.supportMessage.create({
      data: {
        threadId: Number(id),
        senderId: String(p.userId),
        senderType: isAdminSender ? 'admin' : 'user',
        content: content.trim(),
        isReadByAdmin: isAdminSender ? true : false, // إذا أرسل الأدمن فهي مقروءة للأدمن
        isReadByUser:  isAdminSender ? false : true   // وإذا أرسل المستخدم فهي مقروءة له
      },
      include: { sender: { select: { id: true, name: true, image: true } } }
    });

    // إذا أول رد من أدمن ولم تكن التذكرة مسندة، نسندها للمرسل
    if (isAdminSender) {
      await prisma.supportThread.update({
        where: { id: Number(id) },
        data: { assignedAdminId: String(p.userId) }
      });
    }

    return NextResponse.json({
      id: Number(msg.id),
      thread_id: Number(msg.threadId),
      sender_id: msg.senderId,
      sender_type: msg.senderType,
      content: msg.content,
      created_at: msg.createdAt,
      sender_name: msg.sender?.name || (isAdminSender ? 'أدمن' : 'مستخدم'),
      sender_avatar: msg.sender?.image || null
    }, { status: 201 });
  } catch (e) {
    console.error('POST /api/support/threads/[id] error:', e);
    return NextResponse.json({ error: 'فشل إرسال الرسالة' }, { status: 500 });
  }
}

/**
 * تغييرات إضافية عبر query:
 * PATCH /api/support/threads/:id?action=assign   (للأدمن) body: { adminId? } (إن لم يوجد نُسنِد للمرسل)
 * PATCH /api/support/threads/:id?action=status   (للأدمن أو صاحب التذكرة) body: { status: 'open'|'pending'|'closed' }
 */
export async function PATCH(req, { params }) {
  try {
    const p = getUserFromReq(req);
    if (!p?.userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = params;
    const access = await canAccessThread(id, p);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'assign') {
      if (!isAdmin(p)) return NextResponse.json({ error: 'أدمن فقط' }, { status: 403 });
      const { adminId } = await req.json().catch(() => ({}));
      await prisma.supportThread.update({
        where: { id: Number(id) },
        data: { assignedAdminId: adminId || String(p.userId) }
      });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (action === 'status') {
      const { status } = await req.json();
      if (!['open', 'pending', 'closed'].includes(status)) {
        return NextResponse.json({ error: 'قيمة حالة غير صحيحة' }, { status: 400 });
      }
      // يُفضل السماح لصاحب التذكرة والأدمن
      await prisma.supportThread.update({
        where: { id: Number(id) },
        data: { status }
      });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (e) {
    console.error('PATCH /api/support/threads/[id] error:', e);
    return NextResponse.json({ error: 'فشل تنفيذ العملية' }, { status: 500 });
  }
}
