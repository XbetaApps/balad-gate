import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// إنشاء نسخة جديدة من PrismaClient
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    console.log('Register API called');
    const { email, password, name, city } = await req.json();
    
    console.log('Register request:', { email, name, city });
    
    // التحقق من البيانات المطلوبة
    if (!email || !password || !name || !city) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'جميع الحقول مطلوبة.' 
        }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'الرجاء إدخال بريد إلكتروني صالح.' 
        }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // التحقق من قوة كلمة المرور
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.' 
        }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    try {
      // التحقق من وجود المستخدم
      const existing = await prisma.users.findUnique({ 
        where: { email },
        select: { id: true } // نختار الحقول المطلوبة فقط
      });
      
      if (existing) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'البريد الإلكتروني مستخدم بالفعل.' 
          }), 
          { 
            status: 409,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // تشفير كلمة المرور
      const hashed = await bcrypt.hash(password, 10);
      
      // إنشاء المستخدم الجديد
      const user = await prisma.users.create({
        data: {
          email,
          password: hashed,
          name,
          city,
          role_id: 1 // مستخدم عادي افتراضياً
        },
        select: {
          id: true,
          email: true,
          name: true,
          city: true,
          role_id: true,
          created_at: true
        }
      });

      return new Response(
        JSON.stringify({ 
          success: true,
          user: user
        }), 
        { 
          status: 201,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (dbError) {
      console.error('Database error details:', {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
        stack: dbError.stack
      });
      
      // إرجاع رسالة خطأ أكثر تفصيلاً
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'حدث خطأ في قاعدة البيانات',
          details: process.env.NODE_ENV === 'development' ? {
            message: dbError.message,
            code: dbError.code,
            meta: dbError.meta
          } : undefined
        }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  } catch (err) {
    console.error('Register error:', err);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: err.message || 'حدث خطأ في الخادم' 
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
