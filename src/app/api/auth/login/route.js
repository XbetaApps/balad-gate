import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-secret';

export async function POST(req) {
  try {
    console.log('Login API called');
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'البريد الإلكتروني وكلمة المرور مطلوبة.' }), { status: 400 });
    }

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return new Response(JSON.stringify({ error: 'بيانات الدخول غير صحيحة.' }), { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'بيانات الدخول غير صحيحة.' }), { status: 401 });
    }

    // إصدار توكن JWT
    const token = jwt.sign(
      { userId: user.id, role_id: user.role_id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // إرجاع التوكن في الكوكي
    return new Response(JSON.stringify({ success: true, token }), {
      status: 200,
      headers: {
        'Set-Cookie': `token=${token}; HttpOnly; Path=/; Max-Age=604800`,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'حدث خطأ في الخادم.' }), { status: 500 });
  }
}
