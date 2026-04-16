import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

const supabase = createClient(
  process.env.Project_URL,
  process.env.anon_public
);

const supabaseAdmin = createClient(
  process.env.Project_URL,
  process.env.service_role
);

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'المعلومات غير صحيحة.' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password || '');

    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ error: 'المعلومات غير صحيحة.' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // فحص هل المستخدم موجود في Supabase Auth
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      return new Response(
        JSON.stringify({ error: 'حدث خطأ أثناء التحقق من حالة الحساب.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const authUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    // إذا كان موجودًا في Supabase Auth، امنع الدخول قبل تأكيد الإيميل
    if (authUser) {
      if (!authUser.email_confirmed_at) {
        return new Response(
          JSON.stringify({ error: 'يجب تأكيد البريد الإلكتروني أولاً.' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        return new Response(
          JSON.stringify({ error: 'المعلومات غير صحيحة.' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        userId: user.id,
        email: user.email,
        role_id: user.role_id,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return new Response(
      JSON.stringify({
        success: true,
        token,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
        },
      }
    );
  } catch (err) {
    console.error('Login error:', err);

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
