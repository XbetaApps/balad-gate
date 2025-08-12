export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

function getPool() {
  if (!globalThis.__PG_POOL__) {
    globalThis.__PG_POOL__ = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalThis.__PG_POOL__;
}

function getJwtSecret() {
  return (
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    ''
  );
}

async function checkAdminAccess(req) {
  try {
    const headerAuth = req.headers.get('authorization') || '';
    let token = null;

    if (headerAuth.startsWith('Bearer ')) {
      token = headerAuth.slice(7).trim();
    } else {
      token = cookies().get('token')?.value || null;
    }

    if (!token) return { isAdmin: false, error: 'لم يتم العثور على جلسة نشطة. يرجى تسجيل الدخول.' };

    const secret = getJwtSecret();
    if (!secret) return { isAdmin: false, error: 'خطأ في إعدادات الخادم' };

    const decoded = jwt.verify(token, secret);
    const userId = decoded.sub || decoded.userId || decoded.user_id || decoded.id || decoded.uid;
    if (!userId) return { isAdmin: false, error: 'رمز مصادقة غير صالح' };

    const pool = getPool();
    const userResult = await pool.query('SELECT id, role_id FROM public.users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return { isAdmin: false, error: 'المستخدم غير موجود' };

    const user = userResult.rows[0];
    if (user.role_id !== 4) {
      return { isAdmin: false, error: 'غير مصرح بالوصول. تحتاج إلى صلاحيات المشرف.' };
    }

    return { isAdmin: true, userId: user.id, roleId: user.role_id };
  } catch (error) {
    console.error('خطأ في التحقق من الصلاحيات:', error);
    if (error.name === 'TokenExpiredError') {
      return { isAdmin: false, error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى' };
    }
    return { isAdmin: false, error: 'خطأ في المصادقة: ' + (error.message || 'رمز غير صالح') };
  }
}

// PATCH /api/admin/posts/:id
export async function PATCH(req, { params }) {
  const { isAdmin, error } = await checkAdminAccess(req);
  if (!isAdmin) {
    return NextResponse.json({ message: error || 'غير مصرح بالوصول' }, { status: 401 });
  }

  const postId = params.id;
  if (!postId) {
    return NextResponse.json({ message: 'Post ID is required' }, { status: 400 });
  }

  let updates;
  try {
    updates = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  const validUpdates = {};
  if (updates.status && ['pending', 'approved', 'rejected'].includes(updates.status)) {
    validUpdates.status = updates.status;
  }
  if (typeof updates.is_visible === 'boolean') {
    validUpdates.is_visible = updates.is_visible;
  }
  if (updates.rejection_reason) {
    validUpdates.rejection_reason = updates.rejection_reason;
  }

  if (Object.keys(validUpdates).length === 0) {
    return NextResponse.json({ message: 'No valid updates provided' }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const setClause = [];
    const paramsArr = [];
    let i = 1;

    Object.entries(validUpdates).forEach(([k, v]) => {
      setClause.push(`${k} = $${i++}`);
      paramsArr.push(v);
    });

    setClause.push('updated_at = NOW()');
    paramsArr.push(postId);

    const updateQuery = `
      UPDATE public.posts
      SET ${setClause.join(', ')}
      WHERE id = $${i}
      RETURNING *
    `;

    const { rows } = await client.query(updateQuery, paramsArr);
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

// DELETE /api/admin/posts/:id
export async function DELETE(req, { params }) {
  const { isAdmin, error } = await checkAdminAccess(req);
  if (!isAdmin) {
    return NextResponse.json({ message: error || 'غير مصرح بالوصول' }, { status: 401 });
  }

  const postId = params.id;
  if (!postId) {
    return NextResponse.json({ message: 'Post ID is required' }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM public.post_tags WHERE post_id = $1', [postId]);
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
