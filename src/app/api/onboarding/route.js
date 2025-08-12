export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

/* ---------- PG pool ---------- */
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

function asUuid(val) {
  const s = String(val || '').trim();
  return UUID_RE.test(s) ? s : null;
}

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
  // 1) Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const uid = decodeUserIdFromToken(token);
    if (uid) return uid;
  }

  // 2) token cookie (JWT)
  const tokenCookie =
    cookies().get('token')?.value ||
    cookies().get('auth_token')?.value ||
    cookies().get('next-auth.session-token')?.value ||
    '';
  const uidFromCookie = decodeUserIdFromToken(tokenCookie);
  if (uidFromCookie) return uidFromCookie;

  // 3) x-user-id (UUID) — لأغراض خاصة/داخلية
  const headerUid = asUuid(req.headers.get('x-user-id') || '');
  if (headerUid) return headerUid;

  // 4) dev only: testUserId
  if (process.env.NODE_ENV !== 'production') {
    const url = new URL(req.url);
    const testUserId = asUuid(url.searchParams.get('testUserId') || '');
    if (testUserId) return testUserId;
  }

  return null;
}

/* ============== GET /api/onboarding ============== */
/* يعيد حالة الإعداد + الهاتف + التاغات المتابعة + اقتراحات تاغات */
export async function GET(req) {
  const pool = getPool();
  
  // الحصول على معرف المستخدم مع معلومات تصحيح إضافية
  const userId = getCurrentUserId(req);
  
  // تسجيل معلومات التصحيح
  console.log('Onboarding GET request:', {
    url: req.url,
    userId,
    headers: Object.fromEntries(req.headers.entries())
  });
  
  if (!userId) {
    console.error('Unauthorized access - No user ID found');
    return NextResponse.json(
      { 
        success: false,
        message: 'غير مصرح: يرجى تسجيل الدخول.',
        code: 'UNAUTHORIZED',
        requiresAuth: true
      }, 
      { 
        status: 401,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache',
          'WWW-Authenticate': 'Bearer',
          'X-Auth-Required': 'true'
        }
      }
    );
  }

  const client = await pool.connect();
  try {
    const u = await client.query(
      `SELECT id, email, name, phone, onboarding_done, onboarding_done_at
       FROM public.users
       WHERE id = $1
       LIMIT 1`,
      [userId]
    );
    if (u.rowCount === 0) {
      return NextResponse.json({ message: 'المستخدم غير موجود' }, { status: 404 });
    }

    // التاغات التي يتابعها المستخدم (من user_tag_follows)
    const myTags = await client.query(
      `SELECT t.id, t.name
       FROM public.user_tag_follows utf
       JOIN public.tags t ON t.id = utf.tag_id
       WHERE utf.user_id = $1
         AND utf.status = 'following'
       ORDER BY t.name ASC`,
      [userId]
    );

    // اقتراح تاغات (مثلاً أول 30 بالاسم)
    const suggested = await client.query(
      `SELECT t.id, t.name
       FROM public.tags t
       ORDER BY t.name ASC
       LIMIT 30`
    );

    return NextResponse.json({
      user: u.rows[0],
      followedTags: myTags.rows,
      suggestedTags: suggested.rows,
    });
  } catch (e) {
    console.error('GET /api/onboarding error:', e);
    return NextResponse.json({ message: 'تعذر جلب البيانات' }, { status: 500 });
  } finally {
    client.release();
  }
}

/* ============== POST /api/onboarding ============== */
/* body:
   - skip: boolean  (لتخطّي الإعداد)
   - phone: string  (اختياري)
   - tags: string[] أسماء لتاغات موجودة فقط (اختياري)
*/
export async function POST(req) {
  const pool = getPool();
  let client;
  
  try {
    const userId = getCurrentUserId(req);
    
    // تسجيل معلومات التصحيح
    console.log('Onboarding POST request:', {
      url: req.url,
      userId,
      headers: Object.fromEntries(req.headers.entries())
    });
    
    if (!userId) {
      console.error('Unauthorized access - No user ID found in POST request');
      return NextResponse.json(
        { 
          success: false,
          message: 'غير مصرح: يرجى تسجيل الدخول.',
          code: 'UNAUTHORIZED'
        }, 
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Pragma': 'no-cache'
          }
        }
      );
    }

    let body;
    try { 
      body = await req.json(); 
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { 
          success: false,
          message: 'خطأ في تنسيق الطلب',
          code: 'INVALID_REQUEST_BODY'
        },
        { status: 400 }
      );
    }

    const skip = !!body.skip;
    const phone = (body.phone || '').trim();
    const tags = Array.isArray(body.tags)
      ? body.tags.map((s) => String(s || '').trim()).filter(Boolean)
      : [];

    client = await pool.connect();
    await client.query('BEGIN');

    // تخطّي الإعداد
    if (skip) {
      console.log(`Skipping onboarding for user: ${userId}`);
      
      const updateResult = await client.query(
        `UPDATE public.users
         SET onboarding_done = true, 
             onboarding_done_at = now(),
             updated_at = now()
         WHERE id = $1
         RETURNING id, onboarding_done, onboarding_done_at`,
        [userId]
      );
      
      if (updateResult.rowCount === 0) {
        throw new Error('User not found');
      }
      
      await client.query('COMMIT');
      
      console.log('Onboarding skipped successfully:', {
        userId,
        updatedUser: updateResult.rows[0]
      });
      
      return NextResponse.json({ 
        success: true, 
        done: true,
        user: updateResult.rows[0]
      });
    }

    // حفظ الهاتف إن أُرسل
    if (phone) {
      await client.query(
        `UPDATE public.users SET phone = $1, updated_at = now() WHERE id = $2`,
        [phone, userId]
      );
    }

    // ربط التاغات الموجودة فقط في user_tag_follows (UUID)
    if (tags.length > 0) {
      const existing = await client.query(
        `SELECT id, name FROM public.tags WHERE name = ANY($1::text[])`,
        [tags]
      );
      const tagIds = existing.rows.map((r) => r.id); // UUID[]

      if (tagIds.length > 0) {
        // upsert في user_tag_follows
        await client.query(
          `INSERT INTO public.user_tag_follows (user_id, tag_id, status, source, weight, notify, created_at, updated_at)
           SELECT $1, x.id, 'following', 'manual', 1, true, now(), now()
           FROM UNNEST($2::uuid[]) AS x(id)
           ON CONFLICT (user_id, tag_id)
           DO UPDATE SET
             status = 'following',
             source = 'manual',
             notify = true,
             updated_at = now()`,
          [userId, tagIds]
        );

        // (اختياري) مزامنة تفضيلات التاغات أيضًا كـ 'following'
        await client.query(
          `INSERT INTO public.user_tag_preferences (user_id, tag_id, status, created_at, updated_at)
           SELECT $1, x.id, 'following', now(), now()
           FROM UNNEST($2::uuid[]) AS x(id)
           ON CONFLICT (user_id, tag_id)
           DO UPDATE SET 
             status = 'following', 
             updated_at = now()`,
          [userId, tagIds]
        );
      }
    }

    // علّم أن الإعداد اكتمل
    await client.query(
      `UPDATE public.users
       SET onboarding_done = true, 
           onboarding_done_at = now(),
           updated_at = now()
       WHERE id = $1`,
      [userId]
    );

    await client.query('COMMIT');
    return NextResponse.json({ 
      success: true, 
      done: true 
    });
    
  } catch (e) {
    console.error('POST /api/onboarding error:', e);
    if (client) {
      try { 
        await client.query('ROLLBACK'); 
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }
    return NextResponse.json(
      { 
        success: false,
        message: 'تعذر حفظ الإعداد',
        error: process.env.NODE_ENV === 'development' ? e.message : undefined
      }, 
      { status: 500 }
    );
    
  } finally {
    if (client) {
      client.release();
    }
  }
}
