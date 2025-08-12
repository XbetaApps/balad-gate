import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Logout API route
 * Handles both GET and POST requests to log the user out
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // 1. Get cookie domain from environment or use default
    const domain = process.env.COOKIE_DOMAIN || undefined;
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieStore = cookies();
    
    // 2. Cookie options for clearing
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'lax' : 'lax',
      path: '/',
      domain,
    };

    // 3. Clear all possible auth cookies
    const cookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'token',
      'session',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      'next-auth.pkce.code_verifier'
    ];

    // 4. Create response with cache control headers
    const response = NextResponse.redirect(
      new URL('/', process.env.NEXTAUTH_URL || 'http://localhost:3000'),
      { status: 302 }
    );

    // 5. Clear all cookies in the response
    cookieNames.forEach(cookieName => {
      // Clear from server
      cookieStore.delete(cookieName);
      
      // Clear from response
      response.cookies.set({
        name: cookieName,
        value: '',
        expires: new Date(0),
        ...cookieOptions
      });
    });
    
    // 6. Add cache control headers
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    headers.set('X-Accel-Expires', '0'); // For Nginx
    
    // 7. Return the response with updated headers
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to logout',
        details: error.message 
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      }
    );
  }
}

// Support both GET and POST methods
export { GET as POST };
