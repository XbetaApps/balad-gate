import jwt from 'jsonwebtoken';

/**
 * التحقق من صحة التوكن
 * @param {string} token - توكن JWT
 * @returns {Promise<Object>} - بيانات المستخدم المشفرة في التوكن
 */
export async function verifyToken(token) {
  if (!token) {
    console.log('[Auth] No token provided');
    return null;
  }

  try {
    // إزالة كلمة Bearer من بداية التوكن إذا وجدت
    const tokenValue = token.replace(/^Bearer\s+/, '');
    
    // فك تشفير التوكن باستخدام المفتاح السري
    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);
    
    console.log('[Auth] Token verified successfully:', {
      userId: decoded.userId || decoded.id,
      role: decoded.role || (decoded.role_id === 1 ? 'admin' : 'user'),
      email: decoded.email,
      name: decoded.name
    });
    
    return {
      userId: decoded.userId || decoded.id,
      role: decoded.role || (decoded.role_id === 1 ? 'admin' : 'user'),
      email: decoded.email,
      name: decoded.name,
      role_id: decoded.role_id,
      ...decoded
    };
  } catch (error) {
    console.error('[Auth] Token verification failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
    }
    
    throw new Error('رمز غير صالح أو منتهي الصلاحية');
  }
}

/**
 * التحقق من صلاحيات المستخدم
 * @param {Object} user - بيانات المستخدم
 * @param {string} requiredRole - الدور المطلوب (admin, user, etc.)
 * @returns {boolean} - صحيح إذا كان المستخدم لديه الصلاحية
 */
export function checkPermissions(user, requiredRole) {
  if (!user) return false;
  if (user.role === 'admin') return true; // للمشرفين جميع الصلاحيات
  return user.role === requiredRole;
}
