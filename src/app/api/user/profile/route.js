import { NextResponse } from 'next/server';
import prisma from '../../../../prisma/client';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic'; // Ensure this route is handled at runtime

// دالة لتحويل BigInt إلى نص
const bigIntToString = (key, value) => {
  return typeof value === 'bigint' ? value.toString() : value;
};

// Helper function to handle errors
const handleError = (message, status = 400) => {
  console.error(`[Profile API Error] ${status}: ${message}`);
  const errorResponse = { error: message };
  const response = NextResponse.json(
    errorResponse,
    { status }
  );
  return response;
};

export async function GET(request) {
  try {
    console.log('[Profile API] Request received');
    
    // Get the token from the Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('[Profile API] Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Profile API] No or invalid auth header');
      return handleError('مطلوب رمز دخول صالح', 401);
    }
    
    const token = authHeader.split(' ')[1];
    console.log('[Profile API] Token extracted');
    
    if (!token) {
      console.log('[Profile API] No token found in header');
      return handleError('مطلوب رمز دخول', 401);
    }

    // Verify the token
    let userId;
    try {
      console.log('[Profile API] Verifying token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('[Profile API] Token verified:', decoded);
      
      userId = decoded.userId || decoded.id || decoded.sub;
      if (!userId) {
        console.log('[Profile API] No user ID in token');
        return handleError('رمز الدخول غير صالح', 401);
      }
    } catch (err) {
      console.error('[Profile API] Token verification failed:', err);
      return handleError('رمز الدخول غير صالح أو منتهي الصلاحية', 401);
    }

    console.log(`[Profile API] Fetching user with ID: ${userId}`);
    
    try {
      // Fetch user data from the database
      console.log(`[Profile API] Trying to find user with ID: ${userId}`);
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          city: true,
          phone: true,
          role_id: true,
          serial_id: true,
          created_at: true
        }
      });

      if (!user) {
        console.log(`[Profile API] User not found with ID: ${userId}`);
        return handleError('المستخدم غير موجود', 404);
      }
      
      console.log('[Profile API] User data from DB (raw):', user);
      console.log('[Profile API] User data types:', {
        id: typeof user.id,
        role_id: typeof user.role_id,
        serial_id: typeof user.serial_id
      });

      console.log('[Profile API] User found successfully');
      
      // تحويل البيانات إلى JSON مع معالجة BigInt
      const response = {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        city: user.city,
        phone: user.phone || null,
        role_id: Number(user.role_id), // تحويل إلى رقم عادي
        serial_id: user.serial_id ? Number(user.serial_id) : null, // تحويل إلى رقم عادي
        created_at: user.created_at.toISOString()
      };
      
      console.log('[Profile API] Sending response:', response);
      
      // استخدام JSON.parse و JSON.stringify لضمان عدم وجود BigInt
      const safeResponse = JSON.parse(JSON.stringify(response, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
      ));
      
      return NextResponse.json(safeResponse);
      
    } catch (dbError) {
      console.error('[Profile API] Database error:', dbError);
      return handleError('خطأ في قاعدة البيانات: ' + (dbError.message || 'خطأ غير معروف'), 500);
    }
    
  } catch (error) {
    console.error('[Profile API] Unexpected error:', error);
    return handleError('حدث خطأ غير متوقع في الخادم: ' + (error.message || 'تفاصيل غير متوفرة'), 500);
  }
}
