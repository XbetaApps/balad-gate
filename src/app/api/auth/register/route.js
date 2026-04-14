import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// 🔥 Supabase client
const supabase = createClient(
  process.env.Project_URL,
  process.env.anon_public
);

export async function POST(req) {
  try {
    console.log('Register API called');

    const { email, password, name, city } = await req.json();

    // Validation
    if (!email || !password || !name || !city) {
      return new Response(JSON.stringify({ error: 'جميع الحقول مطلوبة.' }), { status: 400 });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' }), { status: 400 });
    }

    // Check existing user (your DB)
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return new Response(JSON.stringify({ error: 'البريد الإلكتروني مستخدم بالفعل.' }), { status: 409 });
    }

    // 🔥 أهم إضافة: Supabase Auth + verification email
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'http://balad-gate.vercel.app/auth/callback',
      },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    // Hash password (نظامك الحالي)
    const hashed = await bcrypt.hash(password, 10);

    // Create user in your table (بدون تغيير)
    await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        city,
        role_id: 1,
        supabase_id: data.user?.id || null, // ربط اختياري
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'تم التسجيل! تفقد بريدك لتفعيل الحساب'
    }), { status: 201 });

  } catch (err) {
    console.error('Register error:', err);
    return new Response(JSON.stringify({
      error: 'حدث خطأ في الخادم'
    }), { status: 500 });
  }
}
