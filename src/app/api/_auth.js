// src/app/api/_auth.js
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'changeme-secret';

/**
 * يحاول استخراج JWT من Authorization Bearer أو من الكوكي:
 * - token (الذي تُصدره /api/auth/login)
 * - next-auth.session-token / __Secure-next-auth.session-token (لو كنت تستخدم NextAuth)
 * ويقوم بعمل verify. يعيد payload أو null.
 */
export function getUserFromReq(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    const cookieHeader = req.headers.get('cookie') || '';
    let cookieToken = null;

    if (cookieHeader) {
      const parts = cookieHeader.split(';').map(s => s.trim());
      const tokenPair = parts.find(p => p.startsWith('token='));
      const nA = parts.find(p => p.startsWith('next-auth.session-token='));
      const nASec = parts.find(p => p.startsWith('__Secure-next-auth.session-token='));

      if (tokenPair) cookieToken = decodeURIComponent(tokenPair.split('=')[1]);
      else if (nA) cookieToken = decodeURIComponent(nA.split('=')[1]);
      else if (nASec) cookieToken = decodeURIComponent(nASec.split('=')[1]);
    }

    const tok = bearer || cookieToken;
    if (!tok) return null;

    return jwt.verify(tok, JWT_SECRET); // قد يحتوي على { userId, role_id, ... }
  } catch {
    return null;
  }
}

/** تحقّق بسيط من أن الدور (role_id) يساوي 4 = مدير/مشرف */
export function isAdmin(payload) {
  return Boolean(payload && Number(payload.role_id) === 4);
}
