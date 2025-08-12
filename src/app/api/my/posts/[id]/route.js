export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const asUuid = (v) => (UUID_RE.test(String(v || '').trim()) ? String(v).trim() : null);

function getJwtSecret() {
  return (
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    ''
  );
}
function decodeUserIdFromToken(token) {
  const secret = getJwtSecret();
  if (!secret || !token) return null;
  try {
    const decoded = jwt.verify(token, secret);
    const candidates = [decoded.sub, decoded.userId, decoded.user_id, decoded.id, decoded.uid];
    for (const c of candidates) {
      const uid = asUuid(c);
      if (uid) return uid;
    }
    return null;
  } catch {
    return null;
  }
}
function getCurrentUserId(req) {
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const uid = decodeUserIdFromToken(token);
    if (uid) return uid;
  }
  const tokenCookie =
    cookies().get('token')?.value ||
    cookies().get('auth_token')?.value ||
    cookies().get('next-auth.session-token')?.value ||
    '';
  const uidFromCookie = decodeUserIdFromToken(tokenCookie);
  if (uidFromCookie) return uidFromCookie;

  const headerUid = asUuid(req.headers.get('x-user-id') || '');
  if (headerUid) return headerUid;

  if (process.env.NODE_ENV !== 'production') {
    const url = new URL(req.url);
    const testUserId = asUuid(url.searchParams.get('testUserId') || '');
    if (testUserId) return testUserId;
  }
  return null;
}

/** PATCH /api/my/posts/:id — تعديل منشور يملكه المستخدم */
export async function PATCH(req, { params }) {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return NextResponse.json({ message: 'غير مصرح: يرجى تسجيل الدخول.' }, { status: 401 });
  }

  const postId = asUuid(params?.id);
  if (!postId) {
    return NextResponse.json({ message: 'معرّف منشور غير صالح' }, { status: 400 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'صيغة الطلب غير صحيحة' }, { status: 400 });
  }

  // الحقول المسموحة فقط
  const allowed = ['title', 'description', 'price', 'governorate', 'is_visible', 'tags'];
  const updates = {};
  for (const k of allowed) {
    if (k in body) updates[k] = body[k];
  }

  // تحققات
  if ('title' in updates && !String(updates.title || '').trim()) {
    return NextResponse.json({ message: 'العنوان غير صالح' }, { status: 422 });
  }
  if ('price' in updates && updates.price !== null && updates.price !== undefined && `${updates.price}`.trim() !== '') {
    const n = Number(updates.price);
    if (Number.isNaN(n) || n < 0) {
      return NextResponse.json({ message: 'قيمة السعر غير صالحة.' }, { status: 422 });
    }
    updates.price = Math.round(n * 100) / 100;
  } else if ('price' in updates) {
    updates.price = null;
  }
  if ('is_visible' in updates) {
    updates.is_visible = !!updates.is_visible;
  }
  if ('tags' in updates && !Array.isArray(updates.tags)) {
    return NextResponse.json({ message: 'صيغة التاغات غير صحيحة' }, { status: 422 });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // تحقق الملكية
    const owner = await client.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (owner.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'المنشور غير موجود' }, { status: 404 });
    }
    if (owner.rows[0].user_id !== userId) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'غير مصرح بتعديل هذا المنشور' }, { status: 403 });
    }

    // تحديث جدول posts
    const setParts = [];
    const paramsArr = [];
    let i = 1;

    if ('title' in updates) { setParts.push(`title = $${i++}`); paramsArr.push(String(updates.title).trim()); }
    if ('description' in updates) { setParts.push(`description = $${i++}`); paramsArr.push(String(updates.description || '').trim()); }
    if ('governorate' in updates) { setParts.push(`governorate = $${i++}`); paramsArr.push(String(updates.governorate || '').trim()); }
    if ('price' in updates) { setParts.push(`price = $${i++}`); paramsArr.push(updates.price); }
    if ('is_visible' in updates) { setParts.push(`is_visible = $${i++}`); paramsArr.push(!!updates.is_visible); }

    if (setParts.length > 0) {
      const sql = `UPDATE posts SET ${setParts.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;
      paramsArr.push(postId);
      await client.query(sql, paramsArr);
    }

    // تحديث التاغات (من الموجودة فقط)
    if ('tags' in updates) {
      const tagNames = updates.tags
        .map((t) => String(t || '').trim())
        .filter(Boolean);

      // اجلب IDs للتاغات الموجودة فقط
      let tagIds = [];
      if (tagNames.length) {
        const { rows: trows } = await client.query(
          `SELECT id, name FROM tags WHERE name = ANY($1::text[])`,
          [tagNames]
        );
        const foundNames = new Set(trows.map((r) => r.name));
        const missing = tagNames.filter((n) => !foundNames.has(n));
        if (missing.length > 0) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { message: 'بعض التاغات غير موجودة', missing },
            { status: 422 }
          );
        }
        tagIds = trows.map((r) => r.id);
      }

      // بدّل الروابط
      await client.query(`DELETE FROM post_tags WHERE post_id = $1`, [postId]);
      if (tagIds.length) {
        await client.query(
          `INSERT INTO post_tags (post_id, tag_id)
           SELECT $1, UNNEST($2::uuid[])`,
          [postId, tagIds]
        );
      }
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true, message: 'تم حفظ التعديلات' });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('PATCH /api/my/posts/:id error:', e);
    return NextResponse.json({ message: 'تعذّر حفظ التعديلات' }, { status: 500 });
  } finally {
    client.release();
  }
}

/** DELETE /api/my/posts/:id — حذف منشور يملكه المستخدم */
export async function DELETE(req, { params }) {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return NextResponse.json({ message: 'غير مصرح: يرجى تسجيل الدخول.' }, { status: 401 });
  }

  const postId = asUuid(params?.id);
  if (!postId) {
    return NextResponse.json({ message: 'معرّف منشور غير صالح' }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // تحقق الملكية
    const owner = await client.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (owner.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'المنشور غير موجود' }, { status: 404 });
    }
    if (owner.rows[0].user_id !== userId) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'غير مصرح بحذف هذا المنشور' }, { status: 403 });
    }

    // حذف العلاقات ثم المنشور
    await client.query('DELETE FROM post_tags WHERE post_id = $1', [postId]);
    await client.query('DELETE FROM posts WHERE id = $1', [postId]);

    await client.query('COMMIT');
    return NextResponse.json({ success: true, message: 'تم حذف المنشور' });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('DELETE /api/my/posts/:id error:', e);
    return NextResponse.json({ message: 'تعذّر حذف المنشور' }, { status: 500 });
  } finally {
    client.release();
  }
}
