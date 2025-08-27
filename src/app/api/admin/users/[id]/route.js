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
  return res.json().catch(() => null);
}

function ensureAdmin(session) {
  const roleId = session?.rawPayload?.role_id ?? session?.user?.role_id;
  return Number(roleId) === 4;
}

export async function GET(req, { params }) {
  try {
    const s = await getSessionFromTestAPI(req);
    if (!s?.authenticated) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (!ensureAdmin(s)) return NextResponse.json({ error: 'ممنوع' }, { status: 403 });

    const id = (params?.id || '').trim();
    if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });

    const rows = await prisma.$queryRaw`
      SELECT
        u.id::text AS id,
        u.serial_id::text AS serial_id,
        u.email,
        u.name,
        u.phone,
        u.city,
        u.role_id,
        u.created_at
      FROM users u
      WHERE u.id = ${id}::uuid
      LIMIT 1;
    `;
    const user = rows?.[0];
    if (!user) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    return NextResponse.json(user, { status: 200 });
  } catch (e) {
    console.error('GET /api/admin/users/[id] error:', e);
    return NextResponse.json({ error: 'فشل جلب المستخدم', details: String(e?.message || e) }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const s = await getSessionFromTestAPI(req);
    if (!s?.authenticated) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (!ensureAdmin(s)) return NextResponse.json({ error: 'ممنوع' }, { status: 403 });

    const id = (params?.id || '').trim();
    if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const name = body?.name !== undefined ? String(body.name).trim() || null : undefined;
    const email = body?.email !== undefined ? String(body.email).trim().toLowerCase() || null : undefined;
    const phone = body?.phone !== undefined ? String(body.phone).trim() || null : undefined;
    const city = body?.city !== undefined ? String(body.city).trim() || null : undefined;
    const roleId = body?.role_id !== undefined ? Number(body.role_id) : undefined;
    const password = body?.password !== undefined ? String(body.password) || null : undefined;

    // نبني SET ديناميكيًا حسب الحقول المرسلة
    const sets = [];
    if (name !== undefined) sets.push(prisma.$executeRaw`name = ${name}`);
    if (email !== undefined) sets.push(prisma.$executeRaw`email = ${email}`);
    if (phone !== undefined) sets.push(prisma.$executeRaw`phone = ${phone}`);
    if (city !== undefined) sets.push(prisma.$executeRaw`city = ${city}`);
    if (roleId !== undefined) sets.push(prisma.$executeRaw`role_id = ${roleId}`);
    if (password !== undefined) sets.push(prisma.$executeRaw`password = ${password}`);

    if (sets.length === 0) {
      return NextResponse.json({ error: 'لا توجد حقول لتحديثها' }, { status: 400 });
    }

    // ندمج جمل SET
    const sql = `
      UPDATE users
      SET ${sets.map((_, i) => `__set${i}`).join(', ')}
      WHERE id = $${sets.length + 1}::uuid
      RETURNING id::text, serial_id::text, email, name, phone, city, role_id, created_at;
    `;

    // نحتاج تحويل prisma.$executeRaw الموقّت إلى $queryRawUnsafe لنبني SETs بأمان:
    // سنعيد كتابة بطريقة أبسط بدون SQL ديناميكي مع CASE لكل حقل.
    const rows = await prisma.$queryRaw`
      UPDATE users AS u SET
        name = COALESCE(${name}::text, u.name),
        email = COALESCE(${email}::text, u.email),
        phone = COALESCE(${phone}::text, u.phone),
        city  = COALESCE(${city}::text,  u.city),
        role_id = COALESCE(${roleId}::int, u.role_id),
        password = COALESCE(${password}::text, u.password)
      WHERE u.id = ${id}::uuid
      RETURNING u.id::text AS id, u.serial_id::text AS serial_id, u.email, u.name, u.phone, u.city, u.role_id, u.created_at;
    `;

    const user = rows?.[0];
    if (!user) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    return NextResponse.json(user, { status: 200 });
  } catch (e) {
    if (String(e?.message || '').includes('duplicate key')) {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم من قبل' }, { status: 409 });
    }
    console.error('PUT /api/admin/users/[id] error:', e);
    return NextResponse.json({ error: 'فشل تحديث المستخدم', details: String(e?.message || e) }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const s = await getSessionFromTestAPI(req);
    if (!s?.authenticated) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (!ensureAdmin(s)) return NextResponse.json({ error: 'ممنوع' }, { status: 403 });

    const meId = s?.rawPayload?.userId || s?.user?.id;
    const id = (params?.id || '').trim();
    if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });

    // منع حذف نفسك لتجنّب قفل لوحة التحكم عن طريق الخطأ
    if (id === meId) {
      return NextResponse.json({ error: 'لا يمكنك حذف حسابك الإداري الحالي' }, { status: 400 });
    }

    const rows = await prisma.$queryRaw`
      DELETE FROM users
      WHERE id = ${id}::uuid
      RETURNING id::text AS id;
    `;
    const deleted = rows?.[0]?.id;
    if (!deleted) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });

    return NextResponse.json({ success: true, id: deleted }, { status: 200 });
  } catch (e) {
    console.error('DELETE /api/admin/users/[id] error:', e);
    return NextResponse.json({ error: 'فشل حذف المستخدم', details: String(e?.message || e) }, { status: 500 });
  }
}
