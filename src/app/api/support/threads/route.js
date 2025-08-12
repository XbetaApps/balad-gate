/* ============================================================
   GET  /api/support/threads
   POST /api/support/threads
   ============================================================ */

   export const runtime = 'nodejs';
   export const dynamic = 'force-dynamic';
   
   import { NextResponse } from 'next/server';
   import { PrismaClient } from '@prisma/client';
   
   /* ---------- Prisma ---------- */
   let prisma;
   if (process.env.NODE_ENV === 'production') {
     prisma = new PrismaClient();
   } else {
     if (!global.prisma)
       global.prisma = new PrismaClient({ log: ['error', 'warn'] });
     prisma = global.prisma;
   }
   process.on('beforeExit', () => prisma?.$disconnect());
   
   /* ---------- الجلسة ---------- */
   async function getSession(req) {
     try {
       const base = new URL(req.url).origin;
       const res  = await fetch(`${base}/api/test-session`, {
         headers: {
           cookie: req.headers.get('cookie') ?? '',
           authorization: req.headers.get('authorization') ?? '',
           accept: 'application/json',
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
      GET: لائحة المحادثات
      ============================================================ */
   export async function GET(req) {
     try {
       const session = await getSession(req);
       if (!session?.authenticated)
         return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
   
       const userId   = session.rawPayload?.userId ?? session.user?.id;
       const userRole = Number(session.rawPayload?.role_id ?? session.user?.role_id);
   
       /* ـــ الإدمن يرى كل المحادثات ـــ */
       if (userRole === 4) {
         const rows = await prisma.$queryRaw`
           SELECT
             t.id::text,
             t.last_message_at,
             COALESCE(m.content, '')           AS last_message,
             'user'                            AS participant_type,
             u.name                            AS participant_name
           FROM support_threads      t
           JOIN users                u ON u.id = t.user_id
           LEFT JOIN support_messages m ON m.id = t.last_message_id
           ORDER BY t.last_message_at DESC NULLS LAST
         `;
         return NextResponse.json(rows, { status: 200 });
       }
   
       /* ـــ المستخدم يرى ثريده الوحيد ـــ */
       let [thread] = await prisma.$queryRaw`
         SELECT *
         FROM support_threads
         WHERE user_id::text = ${userId}::text          -- التحويل إلى نص
         LIMIT 1
       `;
   
       if (!thread) {
         [thread] = await prisma.$queryRaw`
           INSERT INTO support_threads (user_id, status, created_at, updated_at)
           VALUES (${userId}::bigint, 'open', NOW(), NOW())  -- النوع الصحيح
           RETURNING *
         `;
       }
   
       const [lastMsg] = await prisma.$queryRaw`
         SELECT content
         FROM support_messages
         WHERE thread_id = ${thread.id}::bigint
         ORDER BY created_at DESC
         LIMIT 1
       `;
   
       return NextResponse.json(
         [
           {
             id:               String(thread.id),
             last_message_at:  thread.last_message_at,
             last_message:     lastMsg?.content ?? '',
             participant_type: 'admin',
             participant_name: 'الدعم',
           },
         ],
         { status: 200 },
       );
     } catch (err) {
       console.error('GET /threads error:', err);
       return NextResponse.json({ error: 'خطأ أثناء الجلب' }, { status: 500 });
     }
   }
   
   /* ============================================================
      POST: الحصول على Thread أو إنشاؤه
      ============================================================ */
   export async function POST(req) {
     const session = await getSession(req);
     if (!session?.authenticated)
       return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
   
     const callerId   = session.rawPayload?.userId ?? session.user?.id;
     const callerRole = Number(session.rawPayload?.role_id ?? session.user?.role_id);
   
     let targetUserId = callerId;   // مبدئيًا
   
     /* Handle request body */
     const body = (await req.json().catch(() => ({}))) || {};
     
     /* For admin, require targetUserId */
     if (callerRole === 4) {
       if (!body.targetUserId) {
         return NextResponse.json(
           { error: 'يجب تحديد targetUserId' },
           { status: 400 },
         );
       }
       targetUserId = String(body.targetUserId);
     }
   
     try {
       let [thread] = await prisma.$queryRaw`
         SELECT id
         FROM support_threads
         WHERE user_id::text = ${targetUserId}::text
         LIMIT 1
       `;
   
       let statusCode = 200;
       if (!thread) {
         // Start a transaction to create thread and first message atomically
         await prisma.$transaction(async (tx) => {
           // Create the thread
           [thread] = await tx.$queryRaw`
             INSERT INTO support_threads (user_id, status, created_at, updated_at)
             VALUES (${targetUserId}::bigint, 'open', NOW(), NOW())
             RETURNING id
           `;
           
           // If there's a first message, create it
           if (body.firstMessage) {
             const [message] = await tx.$queryRaw`
               INSERT INTO support_messages (
                 thread_id,
                 sender_id,
                 sender_type,
                 content,
                 is_read_by_user,
                 is_read_by_admin,
                 created_at
               ) VALUES (
                 ${thread.id}::bigint,
                 ${callerId}::bigint,
                 'user',
                 ${body.firstMessage},
                 true,
                 false,
                 NOW()
               )
               RETURNING id
             `;
             
             // Update thread with last message info
             await tx.$queryRaw`
               UPDATE support_threads
               SET last_message_id = ${message.id}::bigint,
                   last_message_at = NOW(),
                   updated_at = NOW()
               WHERE id = ${thread.id}::bigint
             `;
           }
         });
         statusCode = 201;
       }
   
       return NextResponse.json({ id: String(thread.id) }, { status: statusCode });
     } catch (err) {
       console.error('POST /threads error:', err);
       return NextResponse.json({ error: 'خطأ أثناء المعالجة' }, { status: 500 });
     }
   }
   