import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * إنشاء توكن جديد للمستخدم
 * @param {string|object} payload - البيانات المراد تخزينها في التوكن
 * @param {string|number} expiresIn - مدة صلاحية التوكن (مثال: '30d', '1h')
 * @returns {string} - التوكن الموقّع
 */
export function generateToken(payload, expiresIn = '30d') {
  try {
    return jwt.sign(
      typeof payload === 'object' ? payload : { userId: payload },
      JWT_SECRET,
      { expiresIn }
    );
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('فشل في إنشاء التوكن');
  }
}

/**
 * التحقق من صحة التوكن
 * @param {string} token - التوكن المراد التحقق منه
 * @returns {object|null} - بيانات التوكن إذا كان صالحاً، وإلا فارغ
 */
export function verifyToken(token) {
  if (!token) {
    console.log('No token provided for verification');
    return null;
  }

  try {
    // إزالة كلمة 'Bearer' إذا وجدت
    const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    const decoded = jwt.verify(tokenValue, JWT_SECRET);
    
    if (!decoded) {
      console.log('Token verification returned null');
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.name, error.message);
    
    if (error.name === 'TokenExpiredError') {
      console.log('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      console.log('Invalid token format');
    }
    
    return null;
  }
}

/**
 * استخراج التوكن من طلب HTTP
 * @param {Request} request - كائن الطلب
 * @returns {string|null} - التوكن إذا وُجد، وإلا فارغ
 */
export function extractToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}
