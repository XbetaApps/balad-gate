import { NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/auth';
import { pool } from '@/app/lib/db';

export async function GET(request) {
  console.log('GET /api/user/following - Started');
  
  try {
    // التحقق من صحة التوكن
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.split(' ')[1];
    
    console.log('Auth Header:', authHeader);
    console.log('Token:', token ? 'exists' : 'missing');
    
    if (!token) {
      console.error('No token provided');
      return NextResponse.json(
        { success: false, message: 'مطلوب مصادقة' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    console.log('Decoded token:', decoded);
    
    if (!decoded || !decoded.userId) {
      console.error('Invalid or expired token');
      return NextResponse.json(
        { success: false, message: 'جلسة غير صالحة' },
        { status: 401 }
      );
    }

    console.log('User ID from token:', decoded.userId);
    
    // جلب قائمة المتابعة مع معلومات المتجر
    const query = `
      SELECT 
        f.id,
        f.store_id as "storeId",
        f.created_at as "createdAt",
        s.name,
        s.description,
        COALESCE(s.image, 'default-store.png') as image,
        COALESCE(s.rating, 0) as rating,
        COALESCE(s.reviews_count, 0) as "reviewsCount"
      FROM following f
      JOIN stores s ON f.store_id = s.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `;

    console.log('Executing query for user:', decoded.userId);
    
    let result;
    try {
      result = await pool.query(query, [decoded.userId]);
      console.log('Query successful, rows returned:', result.rowCount);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'خطأ في قاعدة البيانات',
          error: dbError.message
        },
        { status: 500 }
      );
    }

    // إذا لم يتم العثور على متابعات، نرجع مصفوفة فارغة
    if (!result.rows || result.rows.length === 0) {
      console.log('No following records found for user:', decoded.userId);
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const data = result.rows.map(row => ({
      id: row.storeId,
      name: row.name || 'متجر بدون اسم',
      description: row.description || '',
      image: row.image || '/images/default-placeholder.png', // تحديث المسار ليكون نسبياً
      rating: parseFloat(row.rating) || 0,
      reviews: parseInt(row.reviewsCount) || 0,
      type: 'store',
      lastActivity: row.createdAt ? new Date(row.createdAt).toLocaleDateString('ar-EG') : 'غير معروف',
      archivedDate: null,
      item_id: row.storeId,
      item_type: 'store'
    }));

    console.log(`Returning ${data.length} following records`);

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error in GET /api/user/following:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'حدث خطأ غير متوقع',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
