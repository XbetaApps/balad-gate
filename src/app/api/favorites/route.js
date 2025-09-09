// app/api/favorites/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/auth';
import { Pool } from 'pg';

// Database connection pool
let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false,
    });
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }
  return pool;
}

// Helper functions
const ok = (data, status = 200) => {
  return NextResponse.json({ success: true, ...data }, { status });
};

const fail = (message, status = 400, data = {}) => {
  console.error(`API Error [${status}]: ${message}`, data);
  return NextResponse.json({ 
    success: false, 
    message, 
    ...(process.env.NODE_ENV === 'development' ? { debug: data } : {}) 
  }, { status });
};

// Convert to UUID or return null
const asUuid = (val) => {
  if (!val) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val) ? val : null;
};

// Get user ID from auth token
const getAuthUserId = (request) => {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('No Authorization header found');
      return { error: 'مطلوب مصادقة', status: 401 };
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('No token found in Authorization header');
      return { error: 'رمز المصادقة غير صالح', status: 401 };
    }
    
    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      console.error('Invalid token payload:', decoded);
      return { error: 'رمز المصادقة غير صالح', status: 401 };
    }
    
    console.log('Authenticated user ID:', decoded.userId);
    return { userId: decoded.userId };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { 
      error: error.name === 'TokenExpiredError' 
        ? 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى' 
        : 'جلسة غير صالحة', 
      status: 401 
    };
  }
};

// Safe parseInt
const parseIntSafe = (v, def, min = 0, max = 5000) => {
  const n = Number.parseInt(v ?? '', 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
};

/* ========== GET /api/favorites ==========
   query: limit, offset  (وأي archived سيتم تجاهله للتوافق الخلفي)
   يُرجع قائمة المفضّلة للمستخدم الحالي.
========================================= */
export async function GET(request) {
  const pool = getPool();
  let client;
  
  try {
    console.log('GET /api/favorites - Starting');
    
    // Get user ID from token
    const authResult = getAuthUserId(request);
    if (authResult.error) {
      console.error('Authentication failed:', authResult.error);
      return fail(authResult.error, authResult.status);
    }
    const userId = authResult.userId;
    
    // Get query parameters with defaults
    const { searchParams } = new URL(request.url);
    const limit = parseIntSafe(searchParams.get('limit'), 20, 1, 100);
    const offset = parseIntSafe(searchParams.get('offset'), 0, 0);
    
    console.log(`Fetching favorites for user ${userId}, limit: ${limit}, offset: ${offset}`);
    
    // Get a client from the pool
    client = await pool.connect();
    
    // Query to get favorites with post details
    const query = `
      SELECT 
        f.id,
        f.item_id as "itemId",
        f.item_type as "itemType",
        f.created_at as "createdAt",
        p.title,
        p.description,
        p.price,
        p.governorate,
        p.status,
        p.is_visible as "isVisible",
        p.created_at as "postCreatedAt",
        p.updated_at as "postUpdatedAt",
        c.name as "categoryName",
        u.name as "authorName"
      FROM 
        favorites f
      JOIN 
        posts p ON f.item_id = p.id
      LEFT JOIN 
        categories c ON p.category_id = c.id
      LEFT JOIN
        users u ON p.user_id = u.id
      WHERE 
        f.user_id = $1 
        AND f.archived_at IS NULL
        AND p.status = 'approved'
        AND p.is_visible = true
      ORDER BY 
        f.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await client.query(query, [userId, limit, offset]);
    
    // Get total count for pagination
    const countResult = await client.query(
      'SELECT COUNT(*) FROM favorites WHERE user_id = $1 AND archived_at IS NULL',
      [userId]
    );
    
    const total = parseInt(countResult.rows[0].count, 10);
    
    console.log(`Found ${result.rows.length} favorites out of ${total} total`);
    
    return ok({
      data: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + result.rows.length < total
      }
    });
    
  } catch (error) {
    console.error('Error in GET /api/favorites:', error);
    return fail('حدث خطأ أثناء جلب قائمة المفضلة', 500, { 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (client) {
      try {
        client.release();
      } catch (e) {
        console.error('Error releasing client:', e);
      }
    }
  }
}

/* ========== POST /api/favorites ==========
   body: { item_id: uuid }
   Toggle داخل ترانزاكشن:
   - إن كان السجل موجودًا → حذف (isFavorited=false)
   - إن لم يكن موجودًا → إدراج (isFavorited=true)
========================================= */
export async function POST(request) {
  const pool = getPool();
  let client;
  
  try {
    console.log('Starting POST /api/favorites');
    
    // التحقق من التوثيق
    const auth = getAuthUserId(request);
    if (auth.error) {
      console.log('Authentication failed:', auth.error);
      return fail(auth.error, auth.status);
    }

    // تحليل الطلب
    let body;
    try {
      body = await request.json();
      console.log('Request body:', JSON.stringify(body));
    } catch (e) {
      console.error('Error parsing JSON:', e);
      return fail('تنسيق الطلب غير صالح', 400);
    }
    
    // Get a client from the pool
    client = await pool.connect();
    console.log('Database connection established');

    // التحقق من معرف العنصر
    const item_id = asUuid(body?.item_id);
    if (!item_id) {
      console.error('Invalid item_id:', body?.item_id);
      return fail('item_id يجب أن يكون UUID صالح', 400);
    }

    console.log(`Processing favorite toggle for user ${auth.userId}, item ${item_id}`);

    try {
      // بدء المعاملة
      console.log('Starting transaction');
      await client.query('BEGIN');

      try {
        // البحث عن المفضلة الحالية مع قفل
        const queryText = `
          SELECT id FROM favorites 
          WHERE user_id = $1::uuid AND item_id = $2::uuid
          FOR UPDATE`;
          
        console.log('Executing query:', queryText, [auth.userId, item_id]);
        const sel = await client.query(queryText, [auth.userId, item_id]);

        if (sel.rowCount > 0) {
          // موجود → احذف
          console.log('Favorite exists, deleting...');
          await client.query(`DELETE FROM favorites WHERE id = $1`, [sel.rows[0].id]);
          await client.query('COMMIT');
          console.log('Favorite deleted successfully');
          return ok({ isFavorited: false, mode: 'deleted' }, 200);
        } else {
          // غير موجود → أدرج
          console.log('Favorite does not exist, inserting...');
          const insertText = `
            INSERT INTO favorites (user_id, item_id, created_at)
            VALUES ($1::uuid, $2::uuid, NOW())
            ON CONFLICT (user_id, item_id) DO NOTHING
            RETURNING id`;
            
          console.log('Executing insert:', insertText, [auth.userId, item_id]);
          const ins = await client.query(insertText, [auth.userId, item_id]);
          await client.query('COMMIT');
          
          if (ins.rowCount > 0) {
            console.log('Favorite inserted successfully:', ins.rows[0]);
            return ok({ 
              isFavorited: true, 
              mode: 'inserted', 
              id: ins.rows[0].id 
            }, 201);
          } else {
            console.log('Favorite already exists (race condition)');
            return ok({ isFavorited: true, mode: 'exists' }, 200);
          }
        }
      } catch (err) {
        // التراجع عن المعاملة في حالة حدوث خطأ
        console.error('Transaction error, rolling back:', {
          message: err.message,
          code: err.code,
          detail: err.detail,
          hint: err.hint,
          stack: err.stack,
        });
        try { 
          await client.query('ROLLBACK'); 
          console.log('Transaction rolled back');
        } catch (rollbackErr) {
          console.error('Error during rollback:', rollbackErr);
        }
        throw err; // إعادة رمي الخطأ للمعالجة الخارجية
      }
    } catch (error) {
      console.error('Database operation failed:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        stack: error.stack,
      });
      
      // Handle specific database errors
      let errorMessage = 'حدث خطأ أثناء معالجة طلبك';
      let statusCode = 500;
      
      // Handle common database errors
      if (error.code === '23505') { // Unique violation
        errorMessage = 'هذا العنصر مضاف بالفعل إلى المفضلة';
        statusCode = 409;
      } else if (error.code === '23503') { // Foreign key violation
        errorMessage = 'العنصر المطلوب غير موجود';
        statusCode = 404;
      } else if (error.code === '23514') { // Check violation
        errorMessage = 'بيانات غير صالحة';
        statusCode = 400;
      } else if (error.code === '22P02') { // Invalid text representation
        errorMessage = 'معرف غير صالح';
        statusCode = 400;
      }
      
      return fail(errorMessage, statusCode, {
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code,
        hint: process.env.NODE_ENV === 'development' ? error.hint : undefined
      });
    } finally {
      if (client) {
        try {
          // Ensure the client is released back to the pool
          if (client.release) {
            client.release();
            console.log('Database connection released');
          } else {
            console.warn('Client does not have release method');
          }
        } catch (releaseErr) {
          console.error('Error releasing database connection:', releaseErr);
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error in POST /api/favorites:', {
      message: error.message,
      stack: error.stack,
    });
    return fail('حدث خطأ غير متوقع', 500, {
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
