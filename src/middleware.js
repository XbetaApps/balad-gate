// middleware.js
import { NextResponse } from 'next/server';

/**
 * نتحقق فقط من وجود جلسة (كوكي أو Authorization Bearer).
 * لا نقوم بعمل verify للـ JWT هنا لأن middleware يعمل على Edge
 * وغالباً لا نحتاج أكثر من وجود التوكن للتمرير أو الرفض.
 */
function hasSession(req) {
  // Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  // Cookies:
  // - token                         : JWT الذي تُصدره /api/auth/login الخاصة بك
  // - next-auth.session-token       : كوكي NextAuth في التطوير/HTTP
  // - __Secure-next-auth.session-token : كوكي NextAuth في الإنتاج/HTTPS
  const cookieToken =
    req.cookies.get('token')?.value ||
    req.cookies.get('__Secure-next-auth.session-token')?.value ||
    req.cookies.get('next-auth.session-token')?.value;

  return Boolean(bearer || cookieToken);
}

export function middleware(req) {
  const { pathname, search } = req.nextUrl;

  // مسارات عامة لا تتطلب مصادقة (صفحات فقط)
  // ملاحظة: /api مستثناة أصلاً من الـ matcher بالأسفل.
  const publicExact = new Set([
    '/',             // الرئيسية
    '/auth',         // صفحة تسجيل الدخول
    '/about',
    '/departments',
    '/news',
    '/weather',
    '/money',
    '/services',
    '/car',
    '/test-session', // إن كانت لديك صفحة (وليس API) بنفس الاسم
  ]);

  const isPublicExact = publicExact.has(pathname);
  const isPublicPrefix =
    pathname.startsWith('/api/auth') || // للاحتياط فقط؛ /api مستثناة من الـ matcher
    pathname.startsWith('/_next');      // ملفات Next الداخلية

  // السماح بالمسارات العامة كما هي
  if (isPublicExact || isPublicPrefix) {
    // لو المستخدم مسجل ويحاول فتح /auth رجّعه للصفحة الرئيسية
    if (pathname === '/auth' && hasSession(req)) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // أي صفحة غير عامة تتطلب جلسة
  if (!hasSession(req)) {
    const loginUrl = new URL('/auth', req.url);
    // حفظ المسار الحالي للعودة بعد تسجيل الدخول
    const callbackUrl = pathname + search;
    loginUrl.searchParams.set('callbackUrl', callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  // لو (لأي سبب) وصلنا هنا على /auth والمستخدم مسجل، أعِد توجيهه
  if (pathname === '/auth') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

/**
 * الأهم هنا: لا تطبّق الـ middleware على /api أو مسارات Next الداخلية.
 * هذا يمنع تحويل ردود JSON إلى HTML (redirect) الذي كان يسبب أخطاء
 * مثل Unexpected token '<' و ChunkLoadError.
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
