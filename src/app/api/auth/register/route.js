import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

const supabase = createClient(
  process.env.Project_URL,
  process.env.anon_public
);

export async function POST(req) {
  try {
    const { email, password, name, city } = await req.json();

    if (!email || !password || !name || !city) {
      return new Response(
        JSON.stringify({ error: 'جميع الحقول مطلوبة.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'صيغة البريد الإلكتروني غير صالحة.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'البريد الإلكتروني مستخدم بالفعل.' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://balad-gate.vercel.app/auth',
      },
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        city,
        role_id: 2,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم إرسال رابط تأكيد إلى بريدك الإلكتروني. الرجاء فتح الإيميل وتأكيد الحساب ثم تسجيل الدخول.',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Register error:', err);

    return new Response(
      JSON.stringify({
        error: err.message || 'حدث خطأ في الخادم',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
