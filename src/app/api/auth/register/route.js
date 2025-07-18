import prisma from '../../../../../prisma/client';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    console.log('Register API called');
    const { email, password, name, city } = await req.json();
    console.log('Register request:', { email, name, city });
    if (!email || !password || !name || !city) {
      return new Response(JSON.stringify({ error: 'جميع الحقول مطلوبة.' }), { status: 400 });
    }

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return new Response(JSON.stringify({ error: 'البريد الإلكتروني مستخدم بالفعل.' }), { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: {
        email,
        password: hashed,
        name,
        city,
        role_id: 1 // مستخدم عادي افتراضياً
      }
    });
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (err) {
    console.error('Register error:', err);
    return new Response(JSON.stringify({ error: 'حدث خطأ في الخادم.', details: err.message }), { status: 500 });
  }
}
