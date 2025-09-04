import { jwtDecode } from 'jwt-decode';

/**
 * Decodes a JWT token without verification
 * @param {string} token - The JWT token to decode
 * @returns {object|null} The decoded token payload or null if invalid
 */
export function decodeJwtNoVerify(token) {
  if (!token || typeof token !== 'string') return null;
  
  try {
    // Using jwt-decode which is more reliable than manual parsing
    return jwtDecode(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Extracts user ID from request headers or cookies
 * @param {Request} req - The incoming request object
 * @returns {Promise<string|null>} The user ID or null if not found
 */
export async function getUserIdFromRequest(req) {
  try {
    const url = new URL(req.url);
    const headers = req.headers;
    
    // 1. Check Authorization header first
    const authHeader = headers.get('authorization') || headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = decodeJwtNoVerify(token);
      const userId = payload?.sub || payload?.userId || payload?.user_id || payload?.id;
      if (userId) return userId;
    }

    // 2. Check X-User-Id header (for development/testing)
    const directUserId = headers.get('x-user-id') || headers.get('X-User-Id');
    if (directUserId) return directUserId;

    // 3. Check cookies
    const cookieHeader = headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, value] = c.trim().split('=');
        return [key, value];
      })
    );

    const cookieNames = [
      'bg_token',
      'token',
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'session',
    ];

    for (const name of cookieNames) {
      const token = cookies[name];
      if (!token) continue;
      
      const payload = decodeJwtNoVerify(token);
      const userId = payload?.sub || payload?.userId || payload?.user_id || payload?.id;
      if (userId) return userId;
    }

    // 4. Check URL parameter (for debugging only)
    const uidParam = url.searchParams.get('uid');
    if (uidParam && process.env.NODE_ENV !== 'production') {
      return uidParam;
    }

    return null;
  } catch (error) {
    console.error('Error in getUserIdFromRequest:', error);
    return null;
  }
}

/**
 * Middleware to protect API routes
 * @param {Request} req - The request object
 * @returns {Promise<{userId: string}|Response>} Either the user ID or a response object
 */
export async function requireAuth(req) {
  const userId = await getUserIdFromRequest(req);
  
  if (!userId) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'غير مصرح - يرجى تسجيل الدخول' 
      }),
      { 
        status: 401,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
  
  return { userId };
}
