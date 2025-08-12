export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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

/** PATCH /api/notifications/:id  => تعليم/تغيير حالة المقروئية (الافتراضي true) */
export async function PATCH(req, { params }) {
  try {
    const s = await getSessionFromTestAPI(req);
    if (!s?.authenticated) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const uid = s?.rawPayload?.userId || s?.user?.id;
    if (!uid) {
      return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 });
    }

    const id = String(params?.id || '');
    if (!id) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const read = typeof body?.read === 'boolean' ? body.read : true;

    const r = await prisma.$executeRaw`
      UPDATE notifications
      SET read = ${read}
      WHERE id = ${id}::uuid AND user_id = ${uid}::uuid;
    `;

    if (!Number(r)) {
      return NextResponse.json({ error: 'لم يتم العثور على الإشعار' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error('PATCH /api/notifications/[id] error:', e);
    return NextResponse.json({ error: 'فشل تحديث الإشعار' }, { status: 500 });
  }
}

/** DELETE /api/notifications/:id  => حذف إشعار واحد */
export async function DELETE(req, { params }) {
  try {
    const s = await getSessionFromTestAPI(req);
    if (!s?.authenticated) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const uid = s?.rawPayload?.userId || s?.user?.id;
    if (!uid) {
      return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 });
    }

    const id = String(params?.id || '');
    if (!id) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
    }

    const r = await prisma.$executeRaw`
      DELETE FROM notifications
      WHERE id = ${id}::uuid AND user_id = ${uid}::uuid;
    `;

    if (!Number(r)) {
      return NextResponse.json({ error: 'لم يتم العثور على الإشعار' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error('DELETE /api/notifications/[id] error:', e);
    return NextResponse.json({ error: 'فشل حذف الإشعار' }, { status: 500 });
  }
}
