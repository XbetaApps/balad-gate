import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import authOptions from '@/lib/authOptions';

/**
 * GET /api/auth/check-session
 * Checks if the current user has a valid session
 * Used by the middleware to verify authentication status
 */
export async function GET(request) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    // If no session, return 401 Unauthorized
    if (!session?.user) {
      return NextResponse.json(
        { isAuthenticated: false, user: null },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'X-Content-Type-Options': 'nosniff'
          }
        }
      );
    }

    // Return the user data without sensitive information
    const { user } = session;
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image
    };

    return NextResponse.json(
      { 
        isAuthenticated: true, 
        user: userData 
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
    
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { 
        isAuthenticated: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache'
        }
      }
    );
  }
}

// Prevent caching of this endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 0;
