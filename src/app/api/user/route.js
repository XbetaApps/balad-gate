import { getServerSession } from 'next-auth';
import prisma from '../../../../prisma/client';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'غير مصرح - يرجى تسجيل الدخول أولاً' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        city: true,
        role_id: true,
        created_at: true,
        serial_id: true
      }
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'المستخدم غير موجود' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching user data:', error);
    return new Response(JSON.stringify({ error: 'حدث خطأ في الخادم' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
