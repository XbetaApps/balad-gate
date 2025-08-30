import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = 'your-secret-key'; // يجب تغيير هذا في الإنتاج

// دالة لإنشاء حساب جديد
export async function signUp(userData) {
  try {
    // التحقق من وجود البريد الإلكتروني مسبقاً
    const existingUser = await prisma.users.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new Error('البريد الإلكتروني مستخدم مسبقاً');
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // إنشاء المستخدم الجديد
    const newUser = await prisma.users.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name || null,
        city: userData.city || 'Amman', // افتراضياً عمان
        role_id: userData.role_id || 2, // افتراضياً دور مستخدم عادي
      },
      select: {
        id: true,
        email: true,
        name: true,
        city: true,
        role_id: true
      }
    });

    // إنشاء توكن
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '24h' });

    return {
      user: newUser,
      token
    };
  } catch (error) {
    throw error;
  }
}

// دالة تسجيل الدخول
export async function login(email, password) {
  try {
    // البحث عن المستخدم بالبريد الإلكتروني
    const user = await prisma.users.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    // إنشاء توكن
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    // إرجاع بيانات المستخدم بدون كلمة المرور
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    throw error;
  }
}

// دالة للتحقق من التوكن
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('توكن غير صالح أو منتهي الصلاحية');
  }
}
