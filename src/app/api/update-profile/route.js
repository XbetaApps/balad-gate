import { NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@/app/lib/auth';
import { pool } from '@/app/lib/db';

// تمكين خاصية bodyParser لتجاوز الحد الافتراضي
// هذا مهم لمعالجة البيانات الكبيرة
// يمكنك ضبط الحد وفقاً لاحتياجاتك
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  // تمكين الطرق المسموح بها
  methods: ['POST'],
  // تعطيل التخزين المؤقت
  cache: 'no-store',
};

export async function POST(request) {
  console.log('📨 Received update profile request');
  
  try {
    // استخراج التوكن من الطلب
    const token = extractToken(request);
    console.log('🔑 Extracted token:', token ? '***' + token.slice(-8) : 'None');
    
    if (!token) {
      console.log('❌ No token found in request');
      return NextResponse.json(
        { success: false, message: 'مطلوب توكن مصادقة' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // التحقق من صحة التوكن
    const decoded = verifyToken(token);
    console.log('🔍 Decoded token data:', decoded);
    
    if (!decoded || !decoded.userId) {
      console.log('❌ Invalid or expired token');
      return NextResponse.json(
        { 
          success: false, 
          message: 'جلسة غير صالحة أو منتهية الصلاحية. يرجى تسجيل الدخول مرة أخرى.' 
        },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    
    // تحليل جسم الطلب
    let body;
    try {
      body = await request.json();
      console.log('📝 Request body:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'تنسيق البيانات غير صالح. يرجى التحقق من البيانات المرسلة.'
        },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { phone, city } = body;
    
    // التحقق من وجود بيانات للتحديث
    if (phone === undefined && city === undefined) {
      console.log('⚠️ No data provided for update');
      return NextResponse.json(
        { 
          success: false, 
          message: 'يجب إدخال بيانات للتحديث (رقم الجوال أو المدينة)' 
        },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // التحقق من صحة البيانات
    if (phone !== undefined && (typeof phone !== 'string' || phone.trim() === '')) {
      return NextResponse.json(
        { success: false, message: 'يرجى إدخال رقم جوال صحيح' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (city !== undefined && (typeof city !== 'string' || city.trim() === '')) {
      return NextResponse.json(
        { success: false, message: 'يرجى إدخال اسم مدينة صالح' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Log the fields we're trying to update
      console.log('🔍 Received update data:', { phone, city, userId: decoded.userId });
      
      // Build the update query based on the actual database schema
      const updateParts = [];
      const updateValues = [];
      let paramIndex = 1;
    
    // Only include fields that are being updated and exist in the schema
    if (phone !== undefined) {
      updateParts.push(`phone = $${paramIndex++}`);
      updateValues.push(phone.trim());
    }
    
    if (city !== undefined) {
      updateParts.push(`city = $${paramIndex++}`);
      updateValues.push(city.trim());
    }
    
    if (updateParts.length === 0) {
      throw new Error('لا توجد حقول صالحة للتحديث');
    }
    
    // Add user ID as the last parameter
    updateValues.push(decoded.userId);
    
    // Build the final query with only the columns that exist
    const query = `
      UPDATE users 
      SET ${updateParts.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, phone, city, role_id, created_at
    `;
      
      console.log('🔍 Executing query:', query);
      console.log('📊 With values:', updateValues);
      
      // Execute the query with parameters
      const result = await pool.query(query, updateValues);
      console.log('✅ Query result:', result.rows[0]);

      if (result.rowCount === 0) {
        console.log(`❌ User not found with ID: ${decoded.userId}`);
        return NextResponse.json(
          { 
            success: false, 
            message: 'لم يتم العثور على المستخدم' 
          },
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'تم تحديث البيانات بنجاح',
        user: result.rows[0]
      }, {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      });

    } catch (dbError) {
      console.error('❌ Database error:', {
        message: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
        constraint: dbError.constraint,
        table: dbError.table,
        column: dbError.column,
        dataType: dbError.dataType,
        stack: dbError.stack
      });
      
      let errorMessage = 'حدث خطأ أثناء تحديث البيانات';
      let statusCode = 500;
      
      // معالجة أخطاء قاعدة البيانات الشائعة
      if (dbError.code === '23505') { // انتهاك القيد الفريد
        errorMessage = 'رقم الجوال مسجل مسبقاً';
        statusCode = 409;
      } else if (dbError.code === '22P02') { // خطأ في نوع البيانات
        errorMessage = 'تنسيق البيانات غير صالح';
        statusCode = 400;
      } else if (dbError.code === '42703') { // عمود غير موجود
        errorMessage = `حقل غير موجود في قاعدة البيانات: ${dbError.column}`;
        statusCode = 400;
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: errorMessage,
          ...(process.env.NODE_ENV === 'development' && { error: dbError.message })
        },
        { 
          status: statusCode,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'حدث خطأ غير متوقع',
        ...(process.env.NODE_ENV === 'development' && { 
          error: error.message,
          stack: error.stack 
        })
      },
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      }
    );
  }
}
