// src/app/api/support/threads/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromReq, isAdmin } from '../../_auth';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const p = getUserFromReq(req);
    if (!p?.userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(req.url);
    const mineOnly  = url.searchParams.get('mine') === '1';       // للأدمن: تذاكري فقط
    const unassigned = url.searchParams.get('unassigned') === '1';// للأدمن: غير مسندة

    let where = {};
    if (isAdmin(p)) {
      if (mineOnly) where.assignedAdminId = String(p.userId);
      if (unassigned) where.assignedAdminId = null;
      // يمكن الجمع بين فلاتر أخرى حسب الحاجة
    } else {
      where.userId = String(p.userId);
    }

    const threads = await prisma.supportThread.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      include: {
        assignedAdmin: { select: { id: true, name: true, email: true } },
      }
    });

    // احسب العداد غير المقروء لكل تذكرة للطرف الطالب
    const result = await Promise.all(threads.map(async (t) => {
      const unreadCount = isAdmin(p)
        ? await prisma.supportMessage.count({
            where: { threadId: t.id, isReadByAdmin: false, senderId: { not: String(p.userId) } }
          })
        : await prisma.supportMessage.count({
            where: { threadId: t.id, isReadByUser: false, senderId: { not: String(p.userId) } }
          });

      const lastMsg = t.lastMessageId
        ? await prisma.supportMessage.findUnique({ where: { id: t.lastMessageId }, select: { content: true } })
        : null;

      return {
        id: String(t.id),
        subject: t.subject,
        status: t.status,
        last_message_at: t.lastMessageAt,
        last_message: lastMsg?.content || null,
        unread_count: unreadCount,
        assigned_admin: t.assignedAdmin ? { id: t.assignedAdmin.id, name: t.assignedAdmin.name } : null,
      };
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    console.error('GET /api/support/threads error:', e);
    return NextResponse.json({ error: 'فشل تحميل تذاكر الدعم' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const p = getUserFromReq(req);
    if (!p?.userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (isAdmin(p)) return NextResponse.json({ error: 'المستخدم فقط من ينشئ التذكرة' }, { status: 403 });

    const { subject, content } = await req.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'المحتوى مطلوب' }, { status: 400 });
    }

    const thread = await prisma.supportThread.create({
      data: {
        userId: String(p.userId),
        subject: subject?.trim() || null,
        status: 'open',
      }
    });

    await prisma.supportMessage.create({
      data: {
        threadId: thread.id,
        senderId: String(p.userId),
        senderType: 'user',
        content: content.trim(),
        isReadByAdmin: false, // غير مقروء للأدمن
        isReadByUser: true,   // مرسل من المستخدم نفسه
      }
    });

    return NextResponse.json({ id: String(thread.id) }, { status: 201 });
  } catch (e) {
    console.error('POST /api/support/threads error:', e);
    return NextResponse.json({ error: 'فشل إنشاء التذكرة' }, { status: 500 });
  }
}
