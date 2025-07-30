import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

/**
 * Session test endpoint for debugging and testing session validation
 * This endpoint provides detailed information about the current session
 */
export const runtime = 'nodejs';

export async function GET(request) {
  try {
    // 1. Get the session from next-auth
    const session = await getServerSession(authOptions);
    
    // 2. If there's a valid session, return the user data
    if (session?.user) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
          image: session.user.image
        },
        session: {
          provider: 'next-auth',
          expires: session.expires
        }
      });
    }

    // 3. If no session, check for token in the Authorization header
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    // 4. If there's a token, validate it
    if (token) {
      try {
        const sessionUrl = new URL('/api/auth/session', request.url).toString();
        const response = await fetch(sessionUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          cache: 'no-store' // Prevent caching
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData?.user) {
            return NextResponse.json({
              authenticated: true,
              user: userData.user,
              session: {
                provider: 'token',
                expires: userData.expires
              }
            });
          }
        }
      } catch (error) {
        console.error('Error validating token:', error);
      }
    }

    // 5. If no valid session or token found
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        session: null,
        reason: 'No valid session or token found',
        timestamp: new Date().toISOString()
      },
      { status: 401 }
    );
    
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        session: null,
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
