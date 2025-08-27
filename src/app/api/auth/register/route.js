import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    console.log('Register API called');
    const { email, password, name, city } = await req.json();
    console.log('Register request:', { email, name, city });
    
    // Validate required fields
    if (!email || !password || !name || !city) {
      return new Response(JSON.stringify({ error: 'جميع الحقول مطلوبة.' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'صيغة البريد الإلكتروني غير صالحة.' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check password strength
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return new Response(JSON.stringify({ error: 'البريد الإلكتروني مستخدم بالفعل.' }), { 
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    
    // Create user with role_id = 1 (regular user)
    // Note: Make sure you have a role with id 1 in your database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        city,
        role_id: 1 // Default role for regular users
      }
    });

    // Return success response without sensitive data
    return new Response(JSON.stringify({ 
      success: true,
      message: 'تم إنشاء الحساب بنجاح' 
    }), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    console.error('Register error:', err);
    return new Response(JSON.stringify({ 
      error: 'حدث خطأ في الخادم',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
