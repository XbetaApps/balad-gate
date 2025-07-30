import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { authenticated: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        image: session.user.image
      },
      expires: session.expires
    });
    
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { 
        authenticated: false, 
        message: 'Internal server error',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// Prevent caching of this endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 0;
