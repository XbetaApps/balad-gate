export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** يجلب جلسة المستخدم من /api/test-session مع تمرير الكوكيز/الأوث */
async function getSessionFromTestAPI(req) {
  const origin = new URL(req.url).origin;
  const url = new URL('/api/test-session', origin);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      cookie: req.headers.get('cookie') || '',
      authorization: req.headers.get('authorization') || '',
      accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data;
}

export async function GET(req) {
  try {
    const s = await getSessionFromTestAPI(req);
    if (!s?.authenticated) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const uid = s?.rawPayload?.userId || s?.user?.id;
    const roleId = s?.rawPayload?.role_id ?? s?.user?.role_id;
    if (!uid) return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 });

    if (Number(roleId) === 4) {
      // الأدمن: جميع الثريدات + عدد غير المقروء المرسَل من المستخدمين
      const rows = await prisma.$queryRaw`
        WITH t AS (
          SELECT
            st.id,
            st.updated_at,
            st.last_message_id,
            st.last_message_at,
            st.user_id,
            (
              SELECT COUNT(*)::int
              FROM support_messages sm
              WHERE sm.thread_id = st.id
                AND sm.sender_type::text = 'user'
                AND COALESCE(sm.is_read_by_admin, false) = false
            ) AS unread_for_admin
          FROM support_threads st
        )
        SELECT
          t.id::text AS id,
          t.last_message_at,
          lm.content AS last_message,
          t.unread_for_admin AS unread_count,
          'user'::text AS participant_type,
          COALESCE(u.name, 'مستخدم') AS participant_name,
          NULL::text AS participant_avatar
        FROM t
        LEFT JOIN users u ON u.id = t.user_id
        LEFT JOIN support_messages lm ON lm.id = t.last_message_id
        ORDER BY t.updated_at DESC NULLS LAST, t.id DESC;
      `;
      return NextResponse.json(rows ?? [], { status: 200 });
    }

    // المستخدم العادي: ثريداته فقط + غير المقروء المرسَل من الأدمن
    const rows = await prisma.$queryRaw`
      WITH t AS (
        SELECT
          st.id,
          st.updated_at,
          st.last_message_id,
          st.last_message_at,
          (
            SELECT COUNT(*)::int
            FROM support_messages sm
            WHERE sm.thread_id = st.id
              AND sm.sender_type::text = 'admin'
              AND COALESCE(sm.is_read_by_user, false) = false
          ) AS unread_for_user
        FROM support_threads st
        WHERE st.user_id = ${uid}::uuid
      )
      SELECT
        t.id::text AS id,
        t.last_message_at,
        lm.content AS last_message,
        t.unread_for_user AS unread_count,
        'admin'::text AS participant_type,
        'الدعم الفني'::text AS participant_name,
        NULL::text AS participant_avatar
      FROM t
      LEFT JOIN support_messages lm ON lm.id = t.last_message_id
      ORDER BY t.updated_at DESC NULLS LAST, t.id DESC;
    `;
    return NextResponse.json(rows ?? [], { status: 200 });
  } catch (e) {
    console.error('GET /api/support/threads error:', e);
    return NextResponse.json(
      { error: 'فشل تحميل محادثات الدعم', details: String(e?.message || e) },
      { status: 500 }
    );
  }
}

/**
 * POST لإنشاء ثريد دعم:
 * - المستخدم العادي: ينشئ (أو يعيد) ثريد له. يمكن تمرير firstMessage اختياريًا.
 * - الأدمن: يمرّر userId لإنشاء/فتح ثريد لهذا المستخدم (يمكن رسالة أولى).
 * body: { userId? (للأدمن), firstMessage? }
 */
export async function POST(req) {
  try {
    const s = await getSessionFromTestAPI(req);
    if (!s?.authenticated) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const meId = s?.rawPayload?.userId || s?.user?.id;
    const roleId = s?.rawPayload?.role_id ?? s?.user?.role_id;
    if (!meId) return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const firstMessage = (body?.firstMessage || '').toString().trim();

    if (Number(roleId) === 4) {
      // أدمن: يلزم userId
      const targetUserId = (body?.userId || '').toString().trim();
      if (!targetUserId) {
        return NextResponse.json({ error: 'يجب تمرير userId عند الإنشاء بواسطة الأدمن' }, { status: 400 });
      }

      // ابحث/أنشئ الثريد
      const existing = await prisma.$queryRaw`
        SELECT id::text AS id
        FROM support_threads
        WHERE user_id = ${targetUserId}::uuid
        LIMIT 1;
      `;
      let threadId = existing?.[0]?.id;
      if (!threadId) {
        const created = await prisma.$queryRaw`
          INSERT INTO support_threads (user_id)
          VALUES (${targetUserId}::uuid)
          RETURNING id::text AS id;
        `;
        threadId = created?.[0]?.id;
      }

      // رسالة أولى اختيارية
      if (firstMessage) {
        const m = await prisma.$queryRaw`
          INSERT INTO support_messages (thread_id, sender_id, sender_type, content)
          VALUES (${threadId}::bigint, ${meId}::uuid, 'admin', ${firstMessage})
          RETURNING id::text AS id, created_at;
        `;
        const mid = m?.[0]?.id;
        const mtime = m?.[0]?.created_at;
        if (mid) {
          await prisma.$executeRaw`
            UPDATE support_threads
            SET last_message_id = ${mid}::bigint,
                last_message_at = ${mtime},
                updated_at = NOW()
            WHERE id = ${threadId}::bigint;
          `;
        }
      }

      return NextResponse.json({ id: threadId }, { status: 200 });
    }

    // مستخدم: ثريد واحد له
    const existing = await prisma.$queryRaw`
      SELECT id::text AS id
      FROM support_threads
      WHERE user_id = ${meId}::uuid
      LIMIT 1;
    `;
    let threadId = existing?.[0]?.id;
    if (!threadId) {
      const created = await prisma.$queryRaw`
        INSERT INTO support_threads (user_id)
        VALUES (${meId}::uuid)
        RETURNING id::text AS id;
      `;
      threadId = created?.[0]?.id;
    }

    if (firstMessage) {
      const m = await prisma.$queryRaw`
        INSERT INTO support_messages (thread_id, sender_id, sender_type, content)
        VALUES (${threadId}::bigint, ${meId}::uuid, 'user', ${firstMessage})
        RETURNING id::text AS id, created_at;
      `;
      const mid = m?.[0]?.id;
      const mtime = m?.[0]?.created_at;
      if (mid) {
        await prisma.$executeRaw`
          UPDATE support_threads
          SET last_message_id = ${mid}::bigint,
              last_message_at = ${mtime},
              updated_at = NOW()
          WHERE id = ${threadId}::bigint;
        `;
      }
    }

    return NextResponse.json({ id: threadId }, { status: 200 });
  } catch (e) {
    console.error('POST /api/support/threads error:', e);
    return NextResponse.json(
      { error: 'فشل إنشاء محادثة الدعم', details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
