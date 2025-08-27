// middleware.js
import { NextResponse } from 'next/server';

// Paths that should be accessible only to unauthenticated users (like login/register)
const guestPaths = [
  '/auth'
];

// Protected paths that require authentication
const protectedPaths = [
  '/profile',
  '/dashboard',
  '/settings'
];

// Admin paths that require admin role
const adminPaths = [
  '/admin',
  '/admin/*'
];

// Public paths that don't require authentication
const publicPaths = [
  // Main pages
  '/',
  '/about',
  '/departments',
  '/news',
  '/weather',
  '/money',
  '/services',
  '/car',
  
  // Auth related
  '/logout',
  '/test-session',
  '/profile',


  
  // API endpoints
  '/api/auth',
  '/api/auth/session',
  '/api/auth/check-session',
  '/api/auth/session-test',
  '/api/logout',
  
  // Static files and assets
  '/_next',
  '/favicon.ico',
  '/public',
  '/images',
  '/fonts',
  '/manifest.json',
  '/sw.js',
  '/workbox-*.js',
  '/worker-*.js',
  '/*.png',
  '/*.jpg',
  '/*.jpeg',
  '/*.gif',
  '/*.svg',
  '/*.ico',
  '/*.json',
  '/*.txt',
  '/*.xml',
  '/*.webp'
];

// Check if the current path is public
function isPublicPath(path) {
  // Check exact matches
  if (publicPaths.includes(path)) return true;
  
  // Check path prefixes
  const isPublic = publicPaths.some(publicPath => {
    // Handle wildcard paths (e.g., '/*.png')
    if (publicPath.startsWith('/*.')) {
      const ext = publicPath.substring(1);
      return path.endsWith(ext);
    }
    
    // Handle directory paths
    return path === publicPath || 
           path.startsWith(`${publicPath}/`) ||
           path.startsWith('/_next') ||
           path.startsWith('/api/auth');
  });
  
  return isPublic;
}

// Check if the current path is for guests only
function isGuestPath(path) {
  return guestPaths.some(guestPath => {
    // Handle wildcard paths
    if (guestPath.endsWith('*')) {
      const basePath = guestPath.replace(/\*$/, '');
      return path.startsWith(basePath);
    }
    return path === guestPath || path.startsWith(`${guestPath}/`);
  });
}

// Check if the current path is for admins only
function isAdminPath(path) {
  return adminPaths.some(adminPath => {
    // Handle wildcard paths
    if (adminPath.endsWith('*')) {
      const basePath = adminPath.replace(/\*$/, '');
      return path.startsWith(basePath);
    }
    return path === adminPath || path.startsWith(`${adminPath}/`);
  });
}

// Check if the current path is protected and requires authentication
function isProtectedPath(path) {
  // Don't check protected status for public or guest paths
  if (isPublicPath(path) || isGuestPath(path)) {
    return false;
  }
  
  // Check if path is in protected paths
  return protectedPaths.some(protectedPath => {
    if (protectedPath.endsWith('*')) {
      const basePath = protectedPath.replace(/\*$/, '');
      return path.startsWith(basePath);
    }
    return path === protectedPath || path.startsWith(`${protectedPath}/`);
  });
}

// Check if the user has a valid session
async function hasValidSession(req) {
  try {
    // 1. Check for token in authorization header
    const authHeader = req.headers.get('authorization') || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    // 2. Check for session cookies
    const sessionToken = 
      req.cookies.get('__Secure-next-auth.session-token')?.value ||
      req.cookies.get('next-auth.session-token')?.value ||
      req.cookies.get('token')?.value;

    // 3. If no token or session cookie, no active session
    if (!bearer && !sessionToken) {
      return { isValid: false };
    }

    // 4. Use the session check endpoint to validate the session
    try {
      const url = new URL('/api/auth/check-session', req.nextUrl.origin);
      const headers = {
        'Content-Type': 'application/json',
        'Cookie': req.headers.get('cookie') || ''
      };

      // Add the bearer token if available
      if (bearer) {
        headers['Authorization'] = `Bearer ${bearer}`;
      }

      const res = await fetch(url, {
        headers,
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (res.ok) {
        const data = await res.json();
        return { 
          isValid: data.isAuthenticated, 
          user: data.user || null 
        };
      }
    } catch (error) {
      console.error('Error validating session:', error);
    }

    return { isValid: false };
    
  } catch (error) {
    console.error('Error in hasValidSession:', error);
    return { isValid: false };
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  // 1. Add security headers to all responses
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 2. Handle public paths (no authentication required)
  if (isPublicPath(pathname)) {
    // Don't cache HTML pages
    if (pathname.endsWith('.html') || (!pathname.includes('.') && !pathname.endsWith('/'))) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }
    return response;
  }

  // 3. Check authentication status for protected routes
  let isAuthenticated = false;
  let user = null;
  
  if (isProtectedPath(pathname) || isAdminPath(pathname)) {
    const session = await hasValidSession(request);
    isAuthenticated = session.isValid;
    user = session.user;
    
    // 4. Handle guest-only paths (like login/register)
    if (isGuestPath(pathname)) {
      if (isAuthenticated) {
        // If user is logged in and tries to access guest-only page, redirect to home
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
      return response;
    }

    // 5. Handle protected paths (require authentication)
    if (isProtectedPath(pathname) && !isAuthenticated) {
      // Redirect to login with callback URL
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 6. Handle admin-only paths
    if (isAdminPath(pathname) && user?.role !== 'admin') {
      // If user is not an admin, redirect to home
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // 7. Add user info to request headers for API routes
  if (pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(request.headers);
    if (user) {
      requestHeaders.set('x-user-id', user.id || '');
      requestHeaders.set('x-user-role', user.role || '');
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 8. For all other requests, continue
  return response;
}

// Configure which paths should be processed by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - sitemap.xml
     * - robots.txt
     * - image/video/asset files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml|mp4|webm|woff|woff2|ttf|eot)$).*)',
  ],
};
