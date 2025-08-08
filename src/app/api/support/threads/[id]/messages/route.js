/* ============================================================
   GET  /api/support/threads/[id]/messages
   POST /api/support/threads/[id]/messages
   ============================================================ */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

/* ---------- تهيئة Prisma ---------- */
let prisma;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma)
    global.prisma = new PrismaClient({ log: ['error', 'warn'] });
  prisma = global.prisma;
}
process.on('beforeExit', () => prisma?.$disconnect());

/* ---------- دالة الجلسة ---------- */
async function getSession(req) {
  try {
    const base = new URL(req.url).origin;
    const res  = await fetch(`${base}/api/test-session`, {
      headers: {
        cookie:        req.headers.get('cookie')        ?? '',
        authorization: req.headers.get('authorization') ?? '',
        accept:        'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json().catch(() => null);
  } catch (err) {
    console.error('getSession error:', err);
    return null;
  }
}

/* ============================================================
   GET: جلب الرسائل
   ============================================================ */
export async function GET(req, { params }) {
  console.log(`[GET] /threads/${params.id}/messages`);
  try {
    /* الجلسة */
    const session = await getSession(req);
    if (!session?.authenticated) {
      console.warn('غير مصرح – لا جلسة');
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const userId   = session.rawPayload?.userId ?? session.user?.id;
    const userRole = Number(session.rawPayload?.role_id ?? session.user?.role_id);
    const threadId = BigInt(params.id);

    /* التحقق من وجود الثريد وصلاحياته */
    const [thread] = await prisma.$queryRaw`
      SELECT id, user_id::text
      FROM support_threads
      WHERE id = ${threadId}::bigint
      LIMIT 1
    `;
    if (!thread) {
      console.warn('ثريد غير موجود');
      return NextResponse.json({ error: 'المحادثة غير موجودة' }, { status: 404 });
    }
    if (!(userRole === 4 || thread.user_id === userId)) {
      console.warn('غير مصرح – المستخدم لا يملك الثريد');
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    /* جلب الرسائل */
    const messages = await prisma.$queryRaw`
      SELECT
        m.id::text,
        m.thread_id::text,
        m.sender_id::text,
        m.sender_type,
        u.name AS sender_name,
        m.content,
        m.created_at,
        m.is_read_by_user,
        m.is_read_by_admin
      FROM support_messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.thread_id = ${threadId}::bigint
      ORDER BY m.created_at ASC
    `;
    console.log(`عدد الرسائل: ${messages.length}`);

    /* تحديث حالة القراءة */
    try {
      await prisma.support_messages.updateMany({
        where: {
          thread_id: threadId,
          ...(userRole === 4
            ? { is_read_by_admin: false }
            : { is_read_by_user: false }),
        },
        data: userRole === 4
          ? { is_read_by_admin: true }
          : { is_read_by_user: true },
      });
    } catch (markErr) {
      console.error('mark-read error:', markErr);
    }

    return NextResponse.json(messages, { status: 200 });
  } catch (err) {
    console.error('GET /messages UNHANDLED:', err);
    return NextResponse.json({ error: 'خطأ أثناء الجلب' }, { status: 500 });
  }
}



/* ============================================================
   POST /api/support/threads/[id]/messages
   ============================================================ */
   export async function POST(req, { params }) {
    /* تحقق من رقم الثريد */
    const threadId = BigInt(params.id || '0');
    if (threadId <= 0n)
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
  
    /* الجلسة */
    const session = await getSession(req);
    if (!session?.authenticated)
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  
    /* المعرّفات */
    const userIdTxt = String(session.rawPayload?.userId ?? session.user?.id); // UUID
    const userRole  = Number(session.rawPayload?.role_id ?? session.user?.role_id);
    const isAdmin   = userRole === 4;
  
    /* محتوى الرسالة */
    let content = '';
    try {
      const body = await req.json();
      content = (
        typeof body === 'object' && body !== null
          ? body.content || body.message
          : body
      )?.toString().trim() ?? '';
      if (!content)
        return NextResponse.json({ error: 'محتوى مطلوب' }, { status: 400 });
    } catch {
      return NextResponse.json({ error: 'تنسيق JSON غير صالح' }, { status: 400 });
    }
  
    /* معاملة SQL خام */
    try {
      const result = await prisma.$transaction(async (tx) => {
        /* 1) التحقق من الثريد والملكيّة */
        const [thread] = await tx.$queryRaw`
          SELECT id, user_id::text
          FROM support_threads
          WHERE id = ${threadId}::bigint
          FOR UPDATE
          LIMIT 1
        `;
        if (!thread)          throw new Error('THREAD_NOT_FOUND');
        if (!isAdmin && thread.user_id !== userIdTxt) throw new Error('FORBIDDEN');
  
        /* 2) إدراج الرسالة */
        const [msg] = await tx.$queryRaw`
          INSERT INTO support_messages
            (thread_id, sender_id, sender_type, content,
             is_read_by_user, is_read_by_admin, created_at)
          VALUES
            (${threadId}::bigint,
             ${userIdTxt}::uuid,
             ${isAdmin ? 'admin' : 'user'}::support_sender_type,
             ${content},
             ${isAdmin},
             ${!isAdmin},
             NOW())
          RETURNING
            id, thread_id, sender_id::text, sender_type,
            content, created_at, is_read_by_user, is_read_by_admin
        `;
  
        /* 3) تحديث جدول الثريد */
        await tx.$executeRaw`
          UPDATE support_threads
          SET last_message_id = ${msg.id},
              last_message_at = NOW(),
              status          = 'open',
              updated_at      = NOW()
          WHERE id = ${threadId}::bigint
        `;
  
        /* 4) جلب اسم المرسل */
        const [sender] = await tx.$queryRaw`
          SELECT name, email
          FROM users
          WHERE id = ${userIdTxt}::uuid
          LIMIT 1
        `;
  
        return {
          id:               String(msg.id),
          thread_id:        String(msg.thread_id),
          sender_id:        msg.sender_id,
          sender_type:      msg.sender_type,
          content:          msg.content,
          created_at:       msg.created_at,
          sender_name:      sender?.name || sender?.email || 'مستخدم',
          is_read_by_user:  msg.is_read_by_user,
          is_read_by_admin: msg.is_read_by_admin,
        };
      });
  
      return NextResponse.json(result, { status: 201 });
    } catch (err) {
      if (err.message === 'THREAD_NOT_FOUND')
        return NextResponse.json({ error: 'المحادثة غير موجودة' }, { status: 404 });
      if (err.message === 'FORBIDDEN')
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  
      console.error('POST /messages error:', err);
      return NextResponse.json({ error: 'خطأ أثناء الإرسال' }, { status: 500 });
    }
  }
  