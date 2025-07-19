import { NextResponse } from 'next/server';
import prisma from '../../../../prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // جلب عينة من المستخدمين للتحقق من الاتصال
    const users = await prisma.users.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'تم الاتصال بقاعدة البيانات بنجاح',
      data: users 
    });
  } catch (error) {
    console.error('Error connecting to database:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'فشل الاتصال بقاعدة البيانات',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
