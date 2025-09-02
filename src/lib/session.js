// lib/session.js
import { cookies, headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export async function getSessionFromRequest() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      return {
        ok: true,
        source: 'next-auth',
        user: {
          id: session.user.id ?? session.user.sub ?? null,
          role: session.user.role ?? 'user',
          email: session.user.email ?? null,
          name: session.user.name ?? null,
        },
      };
    }
  } catch {}

  const jar = cookies();
  const cookieToken = jar.get('session')?.value || jar.get('token')?.value || null;

  const authHeader = headers().get('authorization') || '';
  const headerToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  const token = cookieToken || headerToken;
  if (!token) return { ok: false, reason: 'NO_TOKEN' };

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return {
      ok: true,
      source: cookieToken ? 'cookie' : 'authorization-header',
      user: {
        id: payload.sub ?? payload.id ?? payload.userId ?? null,
        role: payload.role ?? 'user',
        email: payload.email ?? null,
        name: payload.name ?? null,
      },
      payload,
    };
  } catch (err) {
    return { ok: false, reason: 'INVALID_TOKEN' };
  }
}