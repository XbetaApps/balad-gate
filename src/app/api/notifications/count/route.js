import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // الحصول على رمز المصادقة من الرأس
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'مصادقة مطلوبة' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // التحقق من صحة الرمز (هذا مثال بسيط، يجب استبداله بتحقق حقيقي)
    // في التطبيق الحقيقي، يجب التحقق من الرمز باستخدام مكتبة مثل jsonwebtoken
    const user = await prisma.user.findFirst({
      where: { token },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'رمز مصادقة غير صالح' },
        { status: 401 }
      );
    }

    // جلب عدد الإشعارات غير المقروءة
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false
      }
    });

    return NextResponse.json({
      count: unreadCount
    });

  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب عدد الإشعارات غير المقروءة' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
