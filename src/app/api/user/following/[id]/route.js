import { NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/auth';
import { pool } from '@/app/lib/db';

export async function DELETE(request, { params }) {
  try {
    // التحقق من صحة التوكن
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'مطلوب مصادقة' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'جلسة غير صالحة' },
        { status: 401 }
      );
    }

    const storeId = params.id;
    if (!storeId) {
      return NextResponse.json(
        { success: false, message: 'معرف المتجر مطلوب' },
        { status: 400 }
      );
    }

    // حذف المتابعة
    const result = await pool.query(
      'DELETE FROM following WHERE user_id = $1 AND store_id = $2 RETURNING *',
      [decoded.userId, storeId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'لم يتم العثور على المتابعة' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم إلغاء المتابعة بنجاح'
    });

  } catch (error) {
    console.error('Error unfollowing store:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إلغاء المتابعة' },
      { status: 500 }
    );
  }
}
