export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-secret';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبة.' }, { status: 400 });
    }

    // اختر الاسم المطابق في السكيما: prisma.user أو prisma.users
    const repo = prisma.user ?? prisma.users;
    const user = await repo.findUnique({ where: { email } });
    if (!user || !user.password) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة.' }, { status: 401 });
    }

    const ok = await bcrypt.compare(String(password), String(user.password));
    if (!ok) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة.' }, { status: 401 });
    }

    const token = jwt.sign(
      { sub: String(user.id), userId: String(user.id), email: user.email, name: user.name ?? null, role_id: user.role_id ?? null },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const res = NextResponse.json({ success: true, token, user: { id: String(user.id), email: user.email, name: user.name ?? null } });

    // كوكيز الجلسة
    res.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'حدث خطأ في الخادم.' }, { status: 500 });
  }
}
