import { NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/auth';
import { pool } from '@/app/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    // التحقق من التوكن
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { message: 'غير مصرح' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { message: 'جلسة غير صالحة' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    // الحصول على كلمة المرور الحالية للمستخدم
    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'لم يتم العثور على المستخدم' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // التحقق من صحة كلمة المرور الحالية
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'كلمة المرور الحالية غير صحيحة' },
        { status: 400 }
      );
    }

    // تشفير كلمة المرور الجديدة
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // تحديث كلمة المرور في قاعدة البيانات
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, decoded.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح'
    });

  } catch (error) {
    console.error('Error updating password:', error);
    
    // Return more detailed error information in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'حدث خطأ أثناء تحديث كلمة المرور';
      
    return NextResponse.json(
      { 
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }) 
      },
      { status: 500 }
    );
  }
}
