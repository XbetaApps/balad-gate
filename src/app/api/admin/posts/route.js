// /api/admin/posts/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { cookies as nextCookies } from 'next/headers';
import jwt from 'jsonwebtoken';

/*======================== DB ========================*/
function getPool() {
  if (!globalThis.__PG_POOL__) {
    globalThis.__PG_POOL__ = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalThis.__PG_POOL__;
}

/*======================== Auth ========================*/
// إرجاع { isAdmin, userId, roleId, error } بعد التحقق من الكوكي/الهيدر + DB
async function checkAdminAccess(req) {
  try {
    // 1) التوكن من Cookie أو Authorization
    const cookieStore = nextCookies();
    const cookieToken = cookieStore.get('token')?.value || null;
    const authHeader = req.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    const token = cookieToken || bearerToken;
    if (!token) {
      return { isAdmin: false, error: 'لم يتم العثور على جلسة نشطة. يرجى تسجيل الدخول.' };
    }

    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('JWT_SECRET/NEXTAUTH_SECRET غير مضبوط');
      return { isAdmin: false, error: 'خطأ في إعدادات الخادم' };
    }

    const decoded = jwt.verify(token, secret);
    const userId = decoded.userId || decoded.sub;
    if (!userId) {
      return { isAdmin: false, error: 'رمز مصادقة غير صالح' };
    }

    // 2) جلب المستخدم والتأكد من الدور
    const pool = getPool();
    const { rows } = await pool.query(
      'SELECT id, role_id FROM public.users WHERE id = $1 LIMIT 1',
      [userId]
    );
    if (rows.length === 0) {
      return { isAdmin: false, error: 'المستخدم غير موجود' };
    }

    const user = rows[0];
    // عدّل القيمة حسب نظام الأدوار لديك (هنا اعتبرنا 4 = admin)
    const isAdmin = Number(user.role_id) === 4;

    if (!isAdmin) {
      return { isAdmin: false, error: 'غير مصرح بالوصول. تحتاج إلى صلاحيات المشرف.' };
    }

    return { isAdmin: true, userId: user.id, roleId: user.role_id };
  } catch (err) {
    console.error('خطأ في التحقق من الصلاحيات:', err);
    if (err.name === 'TokenExpiredError') {
      return { isAdmin: false, error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى' };
    }
    return { isAdmin: false, error: 'خطأ في المصادقة: ' + (err.message || 'رمز غير صالح') };
  }
}

/*======================== GET /api/admin/posts ========================*/
// فلترة/بحث/ترقيم صفحات — بدون أي علاقة بجدول media
export async function GET(req) {
  const { isAdmin, error } = await checkAdminAccess(req);
  if (!isAdmin) {
    return NextResponse.json({ message: error || 'غير مصرح بالوصول' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get('status') || '').trim();           // pending | approved | rejected
  const page   = Math.max(1, parseInt(searchParams.get('page')  || '1', 10));
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const search = (searchParams.get('search') || '').trim();
  const userId = (searchParams.get('userId') || '').trim();
  const offset = (page - 1) * limit;

  const pool = getPool();

  // بناء WHERE آمن بالباراميترات
  const where = [];
  const params = [];
  let i = 1;

  if (status)    { where.push(`p.status = $${i++}`); params.push(status); }
  if (userId)    { where.push(`p.user_id = $${i++}`); params.push(userId); }
  if (search) {
    where.push(`(
      p.title ILIKE $${i} OR
      p.description ILIKE $${i} OR
      u.name ILIKE $${i} OR
      u.email ILIKE $${i}
    )`);
    params.push(`%${search}%`);
    i++;
  }

  // الاستعلام الرئيسي — بدون media
  const query = `
    SELECT 
      p.id, p.title, p.description, p.status, p.governorate, p.price,
      p.created_at, p.updated_at, p.is_visible,
      u.id AS user_id, u.name AS user_name, u.email AS user_email,
      c.id AS category_id, c.name AS category_name,
      (
        SELECT COALESCE(
          json_agg(t.name) FILTER (WHERE t.name IS NOT NULL),
          '[]'::json
        )
        FROM public.post_tags pt
        LEFT JOIN public.tags t ON t.id = pt.tag_id
        WHERE pt.post_id = p.id
      ) AS tags
    FROM public.posts p
    LEFT JOIN public.users u ON u.id = p.user_id
    LEFT JOIN public.categories c ON c.id = p.category_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY p.created_at DESC
    LIMIT $${i++} OFFSET $${i++};
  `;
  const paginatedParams = [...params, limit, offset];

  // استعلام العدد الكلي
  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM public.posts p
    LEFT JOIN public.users u ON u.id = p.user_id
    LEFT JOIN public.categories c ON c.id = p.category_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''};
  `;

  try {
    const [{ rows: posts }, { rows: [countRow] }] = await Promise.all([
      pool.query(query, paginatedParams),
      pool.query(countQuery, params),
    ]);

    const total = countRow?.total || 0;
    return NextResponse.json({
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Error fetching posts:', err);
    return NextResponse.json(
      { message: 'Failed to fetch posts', error: err.message },
      { status: 500 }
    );
  }
}

/*======================== Helpers: extractId ========================*/
// يدعم: /api/admin/posts/[id] أو /api/admin/posts?id=...
function extractPostId(req, params) {
  // من params إن وُجد (لو كان الملف داخل مجلد [id])
  if (params?.id) return params.id;

  // من كويري سترينغ
  const url = new URL(req.url);
  const idFromQuery = url.searchParams.get('id');
  if (idFromQuery) return idFromQuery;

  // من آخر جزء في المسار (حل وسط إن الملف بغير بنية مجلد [id])
  const parts = url.pathname.split('/').filter(Boolean);
  const last = parts[parts.length - 1];
  // لو كان آخر جزء رقم/UUID وليس "posts"
  if (last && last !== 'posts') return last;

  return null;
}

/*======================== PATCH /api/admin/posts/:id ========================*/
// تحديث status / is_visible / rejection_reason
export async function PATCH(req, context) {
  const { isAdmin, error } = await checkAdminAccess(req);
  if (!isAdmin) {
    return NextResponse.json({ message: error || 'غير مصرح بالوصول' }, { status: 401 });
  }

  const postId = extractPostId(req, context?.params);
  if (!postId) {
    return NextResponse.json({ message: 'Post ID is required' }, { status: 400 });
  }

  let updates;
  try {
    updates = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  const valid = {};
  if (['pending', 'approved', 'rejected'].includes(updates?.status)) {
    valid.status = updates.status;
  }
  if (typeof updates?.is_visible === 'boolean') {
    valid.is_visible = updates.is_visible;
  }
  if (updates?.rejection_reason) {
    valid.rejection_reason = updates.rejection_reason;
  }
  if (Object.keys(valid).length === 0) {
    return NextResponse.json({ message: 'No valid updates provided' }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sets = [];
    const params = [];
    let i = 1;
    for (const [k, v] of Object.entries(valid)) {
      sets.push(`${k} = $${i++}`);
      params.push(v);
    }
    sets.push('updated_at = NOW()');
    params.push(postId);

    const sql = `
      UPDATE public.posts
      SET ${sets.join(', ')}
      WHERE id = $${i}
      RETURNING *;
    `;
    const { rows } = await client.query(sql, params);
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true, message: 'Post updated successfully', post: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating post:', err);
    return NextResponse.json({ message: 'Failed to update post', error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}

/*======================== DELETE /api/admin/posts/:id ========================*/
export async function DELETE(req, context) {
  const { isAdmin, error } = await checkAdminAccess(req);
  if (!isAdmin) {
    return NextResponse.json({ message: error || 'غير مصرح بالوصول' }, { status: 401 });
  }

  const postId = extractPostId(req, context?.params);
  if (!postId) {
    return NextResponse.json({ message: 'Post ID is required' }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // مسح روابط التاغات أولاً
    await client.query('DELETE FROM public.post_tags WHERE post_id = $1', [postId]);

    // لا نحذف من media لأن المنشورات حالياً بلا صور
    // لو فعّلت media لاحقاً:
    // await client.query('DELETE FROM public.media WHERE owner_type = $1 AND owner_id = $2', ['post', postId]);

    const { rowCount } = await client.query('DELETE FROM public.posts WHERE id = $1', [postId]);
    if (rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true, message: 'Post deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting post:', err);
    return NextResponse.json({ message: 'Failed to delete post', error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
