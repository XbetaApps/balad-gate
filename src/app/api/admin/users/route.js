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

export async function GET(req) {
  try {
    const s = await getSessionFromTestAPI(req);
    if (!s?.authenticated) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (!ensureAdmin(s)) return NextResponse.json({ error: 'ممنوع' }, { status: 403 });

    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10)));
    const offset = (page - 1) * pageSize;

    // بحث اختياري بالاسم/الإيميل
    const where = q
      ? prisma.$queryRaw`
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
          WHERE (LOWER(u.name) LIKE LOWER(${`%${q}%`}) OR LOWER(u.email) LIKE LOWER(${`%${q}%`}))
          ORDER BY u.created_at DESC
          LIMIT ${pageSize} OFFSET ${offset};
        `
      : prisma.$queryRaw`
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
          ORDER BY u.created_at DESC
          LIMIT ${pageSize} OFFSET ${offset};
        `;

    const rows = await where;

    // إجمالي للسماح بالترقيم في الواجهة (اختياري)
    const totalRows = q
      ? await prisma.$queryRaw`
          SELECT COUNT(*)::int AS total
          FROM users u
          WHERE (LOWER(u.name) LIKE LOWER(${`%${q}%`}) OR LOWER(u.email) LIKE LOWER(${`%${q}%`}));
        `
      : await prisma.$queryRaw`SELECT COUNT(*)::int AS total FROM users;`;

    const total = totalRows?.[0]?.total ?? 0;

    return NextResponse.json({ data: rows ?? [], page, pageSize, total }, { status: 200 });
  } catch (e) {
    console.error('GET /api/admin/users error:', e);
    return NextResponse.json({ error: 'فشل جلب المستخدمين', details: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const s = await getSessionFromTestAPI(req);
    if (!s?.authenticated) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (!ensureAdmin(s)) return NextResponse.json({ error: 'ممنوع' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const email = (body?.email || '').trim().toLowerCase();
    const password = (body?.password || '').toString();
    const name = (body?.name || '').toString().trim() || null;
    const phone = (body?.phone || '').toString().trim() || null;
    const city = (body?.city || '').toString().trim() || null;
    const roleId = Number(body?.role_id || 1);

    if (!email) return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
    // ملاحظة: لم نطبّق هاش هنا حتى لا نكسر منطق تسجيل الدخول الحالي لديك
    // إن أردت التهشير لاحقًا يمكن إضافة bcryptjs بسهولة.

    try {
      const rows = await prisma.$queryRaw`
        INSERT INTO users (email, password, name, phone, city, role_id)
        VALUES (${email}, ${password || null}, ${name}, ${phone}, ${city}, ${roleId})
        RETURNING
          id::text AS id,
          serial_id::text AS serial_id,
          email,
          name,
          phone,
          city,
          role_id,
          created_at;
      `;
      const user = rows?.[0];
      return NextResponse.json(user, { status: 201 });
    } catch (err) {
      // تعارض بريد مكرر
      if (String(err?.message || '').includes('duplicate key')) {
        return NextResponse.json({ error: 'البريد الإلكتروني مستخدم من قبل' }, { status: 409 });
      }
      throw err;
    }
  } catch (e) {
    console.error('POST /api/admin/users error:', e);
    return NextResponse.json({ error: 'فشل إنشاء المستخدم', details: String(e?.message || e) }, { status: 500 });
  }
}
