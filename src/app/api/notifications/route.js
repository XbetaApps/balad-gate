export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/** يجلب جلسة المستخدم من /api/test-session مع تمرير الكوكي/الأوث */
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
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** GET /api/notifications  => يعيد جميع الإشعارات الخاصة بالمستخدم */
export async function GET(req) {
  try {
    const s = await getSessionFromTestAPI(req);
    if (!s?.authenticated) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const uid = s?.rawPayload?.userId || s?.user?.id;
    if (!uid) {
      return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 });
    }

    const rows = await prisma.$queryRaw`
      SELECT
        n.id::text,
        n.content,
        COALESCE(n.read, false) AS is_read,
        n.created_at
      FROM notifications n
      WHERE n.user_id = ${uid}::uuid
      ORDER BY n.created_at DESC;
    `;

    return NextResponse.json(rows ?? [], { status: 200 });
  } catch (e) {
    console.error('GET /api/notifications error:', e);
    return NextResponse.json({ error: 'فشل جلب الإشعارات' }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications (عمليات جماعية)
 * body:
 *   { action: "read_all" }                      => تعليم جميع إشعارات المستخدم كمقروءة
 *   { action: "read", ids: [<uuid>, ...] }      => تعليم محددة كمقروءة
 */
export async function PATCH(req) {
  try {
    const s = await getSessionFromTestAPI(req);
    if (!s?.authenticated) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const uid = s?.rawPayload?.userId || s?.user?.id;
    if (!uid) {
      return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || '');
    const ids = Array.isArray(body?.ids) ? body.ids.map(x => String(x)) : [];

    if (action === 'read_all') {
      const r = await prisma.$executeRaw`
        UPDATE notifications
        SET read = true
        WHERE user_id = ${uid}::uuid AND COALESCE(read, false) = false;
      `;
      return NextResponse.json({ success: true, updated: Number(r) }, { status: 200 });
    }

    if (action === 'read' && ids.length) {
      // لتجنب تعقيدات مصفوفات uuid[]، ننفذ تحديثًا بسيطًا على كل معرّف
      let updated = 0;
      for (const id of ids) {
        const r = await prisma.$executeRaw`
          UPDATE notifications
          SET read = true
          WHERE id = ${id}::uuid AND user_id = ${uid}::uuid;
        `;
        updated += Number(r);
      }
      return NextResponse.json({ success: true, updated }, { status: 200 });
    }

    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  } catch (e) {
    console.error('PATCH /api/notifications error:', e);
    return NextResponse.json({ error: 'فشل تنفيذ العملية' }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications (عمليات جماعية)
 * body:
 *   { action: "delete_all" }                    => حذف جميع إشعارات المستخدم
 *   { action: "delete", ids: [<uuid>, ...] }    => حذف محددة
 */
export async function DELETE(req) {
  try {
    const s = await getSessionFromTestAPI(req);
    if (!s?.authenticated) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const uid = s?.rawPayload?.userId || s?.user?.id;
    if (!uid) {
      return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || '');
    const ids = Array.isArray(body?.ids) ? body.ids.map(x => String(x)) : [];

    if (action === 'delete_all') {
      const r = await prisma.$executeRaw`
        DELETE FROM notifications
        WHERE user_id = ${uid}::uuid;
      `;
      return NextResponse.json({ success: true, deleted: Number(r) }, { status: 200 });
    }

    if (action === 'delete' && ids.length) {
      let deleted = 0;
      for (const id of ids) {
        const r = await prisma.$executeRaw`
          DELETE FROM notifications
          WHERE id = ${id}::uuid AND user_id = ${uid}::uuid;
        `;
        deleted += Number(r);
      }
      return NextResponse.json({ success: true, deleted }, { status: 200 });
    }

    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  } catch (e) {
    console.error('DELETE /api/notifications error:', e);
    return NextResponse.json({ error: 'فشل تنفيذ عملية الحذف' }, { status: 500 });
  }
}
