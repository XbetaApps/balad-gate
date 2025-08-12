import { NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/auth';
import { pool } from '@/app/lib/db';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { message: 'غير مصرح' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { message: 'جلسة غير صالحة' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all, ad, store, offer
    const isArchived = searchParams.get('archived') === 'true';
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // استعلام منفصل لجلب الصور
    let query = `
      WITH media_cte AS (
        SELECT DISTINCT ON (owner_type, owner_id) *
        FROM media
        WHERE (owner_type = 'ad' AND owner_id IN (SELECT id FROM ads WHERE user_id = $1))
           OR (owner_type = 'store' AND owner_id IN (SELECT id FROM stores WHERE owner_id = $1))
           OR (owner_type = 'offer' AND owner_id IN (SELECT id FROM offers WHERE store_id IN (SELECT id FROM stores WHERE owner_id = $1)))
        ORDER BY owner_type, owner_id, created_at DESC
      )
      SELECT 
        f.*,
        COALESCE(a.title, s.name, o.title) as name,
        COALESCE(
          (SELECT file_path FROM media_cte m 
           WHERE (f.item_type = 'ad' AND m.owner_type = 'ad' AND m.owner_id = a.id)
              OR (f.item_type = 'store' AND m.owner_type = 'store' AND m.owner_id = s.id)
              OR (f.item_type = 'offer' AND m.owner_type = 'offer' AND m.owner_id = o.id)
           LIMIT 1
          ), '/images/default-placeholder.png'
        ) as image,
        COALESCE(a.price, NULL) as price,
        COALESCE(
          (SELECT AVG(rating) FROM comments 
           WHERE (target_type = 'ad' AND target_id = a.id) OR 
                 (target_type = 'store' AND target_id = s.id) OR
                 (target_type = 'offer' AND target_id = o.id)
          ), 0
        ) as rating,
        COALESCE(
          (SELECT COUNT(*) FROM comments 
           WHERE (target_type = 'ad' AND target_id = a.id) OR 
                 (target_type = 'store' AND target_id = s.id) OR
                 (target_type = 'offer' AND target_id = o.id)
          ), 0
        ) as review_count,
        CASE 
          WHEN f.item_type = 'ad' THEN CONCAT('/ads/', a.serial_id)
          WHEN f.item_type = 'store' THEN CONCAT('/stores/', s.serial_id)
          WHEN f.item_type = 'offer' THEN CONCAT('/offers/', o.serial_id)
        END as url
      FROM favorites f
      LEFT JOIN ads a ON f.item_type = 'ad' AND f.item_id = a.id
      LEFT JOIN stores s ON f.item_type = 'store' AND f.item_id = s.id
      LEFT JOIN offers o ON f.item_type = 'offer' AND f.item_id = o.id
      LEFT JOIN media_cte m ON (
        (f.item_type = 'ad' AND m.owner_type = 'ad' AND m.owner_id = a.id) OR
        (f.item_type = 'store' AND m.owner_type = 'store' AND m.owner_id = s.id) OR
        (f.item_type = 'offer' AND m.owner_type = 'offer' AND m.owner_id = o.id)
      )
      WHERE f.user_id = $1
        AND (${isArchived ? 'f.archived_at IS NOT NULL' : 'f.archived_at IS NULL'})
        AND ($2 = 'all' OR f.item_type = $2)
      GROUP BY f.id, a.id, s.id, o.id, m.file_path
      ORDER BY f.created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const result = await pool.query(query, [decoded.userId, type, limit, offset]);
    
    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب العناصر المفضلة' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { message: 'غير مصرح' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { message: 'جلسة غير صالحة' },
        { status: 401 }
      );
    }

    const { item_id, item_type } = await request.json();
    
    if (!['ad', 'store', 'offer'].includes(item_type)) {
      return NextResponse.json(
        { success: false, message: 'نوع العنصر غير صالح' },
        { status: 400 }
      );
    }

    // التحقق من وجود العنصر
    let itemExists;
    if (item_type === 'ad') {
      itemExists = await pool.query('SELECT 1 FROM ads WHERE id = $1', [item_id]);
    } else if (item_type === 'store') {
      itemExists = await pool.query('SELECT 1 FROM stores WHERE id = $1', [item_id]);
    } else {
      itemExists = await pool.query('SELECT 1 FROM offers WHERE id = $1', [item_id]);
    }

    if (!itemExists.rows.length) {
      return NextResponse.json(
        { success: false, message: 'العنصر غير موجود' },
        { status: 404 }
      );
    }

    // إضافة إلى المفضلة إذا لم تكن موجودة مسبقاً
    const result = await pool.query(
      `INSERT INTO favorites (user_id, item_id, item_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, item_id, item_type) 
       DO UPDATE SET archived_at = NULL
       RETURNING *`,
      [decoded.userId, item_id, item_type]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'تمت الإضافة إلى المفضلة بنجاح'
    });

  } catch (error) {
    console.error('Error adding to favorites:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إضافة العنصر إلى المفضلة' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { message: 'غير مصرح' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { message: 'جلسة غير صالحة' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const item_id = searchParams.get('item_id');
    const item_type = searchParams.get('item_type');
    const archive = searchParams.get('archive') === 'true';

    if (!item_id || !item_type) {
      return NextResponse.json(
        { success: false, message: 'معرّف العنصر ونوعه مطلوبان' },
        { status: 400 }
      );
    }

    if (archive) {
      // أرشفة العنصر بدلاً من حذفه
      const result = await pool.query(
        `UPDATE favorites 
         SET archived_at = NOW() 
         WHERE user_id = $1 AND item_id = $2 AND item_type = $3
         RETURNING *`,
        [decoded.userId, item_id, item_type]
      );

      if (!result.rows.length) {
        return NextResponse.json(
          { success: false, message: 'العنصر غير موجود في المفضلة' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'تم أرشفة العنصر بنجاح'
      });
    } else {
      // حذف العنصر نهائياً
      const result = await pool.query(
        `DELETE FROM favorites 
         WHERE user_id = $1 AND item_id = $2 AND item_type = $3
         RETURNING *`,
        [decoded.userId, item_id, item_type]
      );

      if (!result.rows.length) {
        return NextResponse.json(
          { success: false, message: 'العنصر غير موجود في المفضلة' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'تمت إزالة العنصر من المفضلة بنجاح'
      });
    }

  } catch (error) {
    console.error('Error removing from favorites:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إزالة العنصر من المفضلة' },
      { status: 500 }
    );
  }
}
