export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// نجلب الجلسة من /api/test-session
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
  return res.json().catch(() => null);
}

// PATCH /api/preferences/tags/:id  { status: 'following' | 'suggested' | 'archived' }
export async function PATCH(req, { params }) {
  try {
    const s = await getSessionFromTestAPI(req);
    if (!s?.authenticated) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const userId = s?.rawPayload?.userId || s?.user?.id;
    const tagId = params?.id?.toString();
    if (!userId || !tagId) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const status = (body?.status || '').toString().trim();

    // تحقق من القيم المسموحة
    const allowed = new Set(['following', 'suggested', 'archived']);
    if (!allowed.has(status)) {
      return NextResponse.json({ error: 'قيمة status غير صالحة' }, { status: 400 });
    }

    // upsert مع CAST صريح إلى enum
    const row = await prisma.$queryRaw`
      INSERT INTO user_tag_preferences (user_id, tag_id, status)
      VALUES (${userId}::uuid, ${tagId}::uuid, ${status}::tag_preference_status)
      ON CONFLICT (user_id, tag_id)
      DO UPDATE SET status = EXCLUDED.status, updated_at = now()
      RETURNING user_id::text AS user_id, tag_id::text AS tag_id, status::text AS status;
    `;

    return NextResponse.json({ ok: true, item: row?.[0] ?? null }, { status: 200 });
  } catch (e) {
    console.error('PATCH /api/preferences/tags/:id error:', e);
    return NextResponse.json(
      { error: 'فشل تعديل الحالة', details: String(e?.message || e) },
      { status: 500 }
    );
  }
}

// DELETE /api/preferences/tags/:id  (إلغاء الارتباط فقط للمستخدم الحالي)
export async function DELETE(req, { params }) {
  try {
    const s = await getSessionFromTestAPI(req);
    if (!s?.authenticated) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const userId = s?.rawPayload?.userId || s?.user?.id;
    const tagId = params?.id?.toString();
    if (!userId || !tagId) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
    }

    await prisma.$executeRaw`
      DELETE FROM user_tag_preferences
      WHERE user_id = ${userId}::uuid AND tag_id = ${tagId}::uuid;
    `;

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error('DELETE /api/preferences/tags/:id error:', e);
    return NextResponse.json(
      { error: 'فشل إلغاء المتابعة', details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
