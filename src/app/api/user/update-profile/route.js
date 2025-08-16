import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function POST(request) {
  let client;
  
  try {
    const token = request.headers.get('authorization')?.split(' ')[1] || '';
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      );
    }

    // التحقق من المستخدم
    const userRes = await pool.query(
      'SELECT id FROM users WHERE id = (SELECT user_id FROM sessions WHERE token = $1)',
      [token]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'جلسة غير صالحة' },
        { status: 401 }
      );
    }

    const userId = userRes.rows[0].id;
    const { phone, tags, onboarding_done, onboarding_done_at } = await request.json();

    // بدء المعاملة
    client = await pool.connect();
    await client.query('BEGIN');

    // تحديث بيانات المستخدم
    const updateUserQuery = `
      UPDATE users 
      SET phone = COALESCE($1, phone),
          onboarding_done = COALESCE($2, onboarding_done),
          onboarding_done_at = CASE WHEN $2 = true THEN NOW() ELSE onboarding_done_at END,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    const updateResult = await client.query(updateUserQuery, [
      phone,
      onboarding_done,
      userId
    ]);

    if (updateResult.rowCount === 0) {
      throw new Error('فشل في تحديث الملف الشخصي');
    }

    // تحديث التاغات إذا وجدت
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // حذف التاغات القديمة
      await client.query(
        'DELETE FROM user_tag_follows WHERE user_id = $1',
        [userId]
      );

      // إضافة التاغات الجديدة
      for (const tagName of tags) {
        // البحث عن التاغ أو إنشاؤه إذا لم يكن موجوداً
        let tagResult = await client.query(
          'SELECT id FROM tags WHERE name = $1',
          [tagName]
        );

        let tagId;
        if (tagResult.rows.length === 0) {
          // إنشاء تاغ جديد
          const newTag = await client.query(
            'INSERT INTO tags (name) VALUES ($1) RETURNING id',
            [tagName]
          );
          tagId = newTag.rows[0].id;
        } else {
          tagId = tagResult.rows[0].id;
        }

        // إضافة التاغ للمستخدم
        await client.query(
          `INSERT INTO user_tag_follows 
           (user_id, tag_id, status, created_at, updated_at)
           VALUES ($1, $2, 'following', NOW(), NOW())
           ON CONFLICT (user_id, tag_id) DO UPDATE
           SET status = 'following',
               updated_at = NOW()
           RETURNING *`,
          [userId, tagId]
        );
      }
    }

    await client.query('COMMIT');

    // جلب بيانات المستخدم المحدثة
    const userData = await client.query(
      `SELECT u.*, 
              json_agg(
                json_build_object(
                  'id', t.id,
                  'name', t.name
                )
                ORDER BY t.name
              ) FILTER (WHERE t.id IS NOT NULL) as tags
       FROM users u
       LEFT JOIN user_tag_follows utf ON u.id = utf.user_id
       LEFT JOIN tags t ON utf.tag_id = t.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: userData.rows[0]
    });

  } catch (error) {
    await client?.query('ROLLBACK');
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'حدث خطأ أثناء تحديث الملف الشخصي',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
