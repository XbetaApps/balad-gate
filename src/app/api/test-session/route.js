// app/api/test-session/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs'; // تأكد أننا لسنا على Edge إذا كنت تستخدم jsonwebtoken

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export async function GET(request) {
  // 1) جرّب القراءة من الكوكيز (الأفضل أمنياً)
  const jar = cookies();
  const cookieToken =
    jar.get('session')?.value || jar.get('token')?.value || null;

  // 2) أو جرّب من الهيدر Authorization: Bearer <token> (للأنظمة التي تستخدم localStorage)
  const authHeader = request.headers.get('authorization') || '';
  const headerToken = authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  const token = cookieToken || headerToken;

  if (!token) {
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        session: null,
        reason: 'No token found (cookie or Authorization header)',
      },
      { status: 401 }
    );
  }

  try {
    // تحقق/فك التوكن
    const payload = jwt.verify(token, JWT_SECRET);

    // أعرض معلومات المستخدم والجلسة
    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.sub ?? payload.id ?? null,
        name: payload.name ?? null,
        email: payload.email ?? null,
        // أضف أي Claims أخرى تحفظها في التوكن
      },
      session: {
        provider: cookieToken ? 'cookie' : 'authorization-header',
        issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
        expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
      },
      rawPayload: payload, // لإظهار كل الـ claims (احذفها في الإنتاج إن أردت)
    });
  } catch (err) {
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        session: null,
        error: 'Invalid or expired token',
        details: process.env.NODE_ENV === 'development' ? String(err) : undefined,
      },
      { status: 401 }
    );
  }
}
