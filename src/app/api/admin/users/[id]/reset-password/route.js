export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

/** يتحقق أن الدور أدمن role_id = 4 */
function ensureAdmin(session) {
  const roleId = session?.rawPayload?.role_id ?? session?.user?.role_id;
  return Number(roleId) === 4;
}

export async function POST(req, { params }) {
  try {
    // 1) التحقق من الجلسة بنفس أسلوب بقية صفحات الأدمن
    const s = await getSessionFromTestAPI(req);
    if (!s?.authenticated) {
      return NextResponse.json(
        { error: 'غير مصرح بالدخول. يرجى تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }
    if (!ensureAdmin(s)) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول. تحتاج إلى صلاحيات المدير' },
        { status: 403 }
      );
    }

    const meId = s?.rawPayload?.userId || s?.user?.id;
    const id = (params?.id || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const newPassword = (body?.newPassword || '').toString();
    if (!newPassword) {
      return NextResponse.json({ error: 'كلمة المرور الجديدة مطلوبة' }, { status: 400 });
    }

    // 2) منع تعديل كلمة مرور مدير آخر (اختياري لكن موصى به)
    const target = await prisma.user.findUnique({
      where: { id },
      select: { role_id: true },
    });
    if (!target) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }
    if (Number(target.role_id) === 4 && id !== meId) {
      return NextResponse.json({ error: 'لا يمكن تعديل كلمة مرور مدير آخر' }, { status: 403 });
    }

    // 3) تهشير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4) تحديث كلمة المرور (بدون updated_at لأنه غير موجود في جدول users عندك)
    const updated = await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح',
      user: updated,
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث كلمة المرور' },
      { status: 500 }
    );
  }
}
