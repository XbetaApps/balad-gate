import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
  try {
    // الحصول على الجلسة الحالية
    const session = await getServerSession(authOptions);
    
    // إذا لم تكن هناك جلسة نشطة
    if (!session?.user) {
      return Response.json(
        { success: false, error: 'لم يتم العثور على جلسة نشطة' },
        { status: 401 }
      );
    }

    // إرجاع بيانات المستخدم
    return Response.json({
      success: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        image: session.user.image
      }
    });
    
  } catch (error) {
    console.error('Error in auth/me API:', error);
    return Response.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
