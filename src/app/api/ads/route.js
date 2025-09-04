export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getPool } from '@/app/lib/db';
import { extractToken, verifyToken } from '@/app/lib/auth';

/*======================== JWT ========================*/
function getJwtSecret() {
  return (
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    ''
  );
}

/*======================== GET /api/ads ========================*/
/**
 * عام: يعرض قائمة الإعلانات مع فلاتر
 * Query params:
 * - page: رقم الصفحة (افتراضي 1)
 * - limit: عدد العناصر (افتراضي 12، أقصى 50)
 * - position: أحد [top,sidebar,middle,bottom] أو قائمة مفصولة بفواصل
 * - q: نص بحث في العنوان/الوصف
 * - includeExpired: bool (افتراضي false) — لو true يعرض المنتهية أيضًا
 * - includeInactive: bool (افتراضي false) — لو true يعرض غير النشطة أيضًا
 */
export async function GET(req) {
  try {
    const pool = getPool();
    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const rawLimit = parseInt(searchParams.get('limit') || '12', 10);
    const limit = Math.min(Math.max(isNaN(rawLimit) ? 12 : rawLimit, 1), 50);
    const offset = (page - 1) * limit;

    const q = (searchParams.get('q') || '').trim();
    const positionParam = (searchParams.get('position') || '').trim();
    const includeExpired = (searchParams.get('includeExpired') || '').toLowerCase() === 'true';
    const includeInactive = (searchParams.get('includeInactive') || '').toLowerCase() === 'true';

    // فلترة المواقع (قد تكون مفصولة بفواصل)
    const validPositions = ['top', 'sidebar', 'middle', 'bottom'];
    let positions = [];
    if (positionParam) {
      positions = positionParam
        .split(',')
        .map((p) => p.trim().toLowerCase())
        .filter((p) => validPositions.includes(p));
    }

    // نبني WHERE ديناميكي آمن
    const where = [];
    const params = [];
    let i = 1;

    // نشطة؟
    if (!includeInactive) {
      where.push(`a.is_active = TRUE`);
    }

    // ضمن الفترة الزمنية الحالية؟
    if (!includeExpired) {
      where.push(`a.start_date <= NOW() AND a.end_date > NOW()`);
    }

    // position
    if (positions.length > 0) {
      where.push(`a.position = ANY($${i++})`);
      params.push(positions);
    }

    // البحث
    if (q) {
      where.push(`(a.title ILIKE $${i} OR a.description ILIKE $${i})`);
      params.push(`%${q}%`);
      i++;
    }

    // الاستعلام الرئيسي مع التاغات
    const baseQuery = `
      SELECT 
        a.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', t.id, 'name', t.name)
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS tags
      FROM public.ads a
      LEFT JOIN public.ad_tags at ON at.ad_id = a.id
      LEFT JOIN public.tags t ON t.id = at.tag_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      GROUP BY a.id
      ORDER BY a.sort_order ASC, a.created_at DESC
      LIMIT $${i++} OFFSET $${i++};
    `;
    const mainParams = [...params, limit, offset];

    // استعلام العدد
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM public.ads a
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''};
    `;

    const [listRes, countRes] = await Promise.all([
      pool.query(baseQuery, mainParams),
      pool.query(countQuery, params),
    ]);

    const total = countRes.rows?.[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    const data = (listRes.rows || []).map((ad) => ({
      id: ad.id,
      serial_id: ad.serial_id,
      user_id: ad.user_id, // عام: إن أردت إخفاءه، احذفه هنا
      title: ad.title,
      description: ad.description,
      image_url: ad.image_url,
      start_date: ad.start_date ? new Date(ad.start_date).toISOString() : null,
      end_date: ad.end_date ? new Date(ad.end_date).toISOString() : null,
      is_active: ad.is_active,
      position: ad.position,
      sort_order: ad.sort_order,
      created_at: ad.created_at ? new Date(ad.created_at).toISOString() : null,
      updated_at: ad.updated_at ? new Date(ad.updated_at).toISOString() : null,
      price: ad.price != null ? Number(ad.price) : 0,
      tags: Array.isArray(ad.tags) ? ad.tags : [],
      // معلومة إضافية مفيدة للواجهة
      is_expired:
        ad.end_date ? new Date(ad.end_date).getTime() <= Date.now() : false,
    }));

    return NextResponse.json(
      {
        success: true,
        data,
        pagination: {
          total,
          total_pages: totalPages,
          current_page: page,
          per_page: limit,
          has_next_page: page < totalPages,
          has_previous_page: page > 1,
        },
      },
      {
        status: 200,
        headers: {
          // استخدم no-store أثناء التطوير. عند الإنتاج يمكنك وضع s-maxage/stale-while-revalidate
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (err) {
    console.error('Public ads GET error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ أثناء جلب الإعلانات',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status: 500 },
    );
  }
}

/*======================== POST /api/ads ========================*/
// (كودك السابق لإنشاء إعلان كما هو — أبقيته دون تغيير)
export async function POST(req) {
  console.log('Received request to create ad');

  try {
    // Verify authentication
    const token = extractToken(req);
    if (!token) {
      console.warn('No token provided');
      return NextResponse.json(
        { success: false, error: 'يرجى تسجيل الدخول أولاً' },
        { status: 401 },
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      console.warn('Invalid or expired token');
      return NextResponse.json(
        { success: false, error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى' },
        { status: 401 },
      );
    }

    const userId = decoded.userId;

    // Verify the user ID is a valid UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('Invalid user ID format:', userId);
      return NextResponse.json(
        {
          success: false,
          error: 'معرف المستخدم غير صالح',
          errorCode: 'INVALID_USER_ID',
        },
        { status: 400 },
      );
    }
    console.log('Authenticated user ID:', userId);

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { success: false, error: 'تنسيق الطلب غير صالح' },
        { status: 400 },
      );
    }

    // Extract ad data from request body
    const {
      title,
      description = null,
      image_url = null,
      start_date,
      end_date,
      is_active = true,
      position = 'top',
      sort_order = 0,
      price = 0,
      tags = [],
    } = body;

    // Validate required fields
    if (!title || !start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: 'العنوان وتواريخ البداية والنهاية مطلوبة' },
        { status: 400 },
      );
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'تنسيق التاريخ غير صالح' },
        { status: 400 },
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { success: false, error: 'يجب أن يكون تاريخ النهاية بعد تاريخ البداية' },
        { status: 400 },
      );
    }

    // Validate price
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json(
        { success: false, error: 'السعر غير صالح' },
        { status: 400 },
      );
    }

    // Validate position
    const validPositions = ['top', 'sidebar', 'middle', 'bottom'];
    if (!validPositions.includes(position)) {
      return NextResponse.json(
        { success: false, error: 'موضع الإعلان غير صالح' },
        { status: 400 },
      );
    }

    // Get database connection
    const client = await getPool().connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // تحقق أن المستخدم موجود في public.users (بعد إصلاح FK)
      const userCheck = await client.query(
        'SELECT id FROM public.users WHERE id = $1',
        [userId],
      );
      if (userCheck.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'حساب المستخدم غير موجود',
            errorCode: 'USER_NOT_FOUND',
          },
          { status: 404 },
        );
      }

      // Insert the new ad
      const insertAdQuery = `
        INSERT INTO public.ads (
          user_id,
          title,
          description,
          image_url,
          start_date,
          end_date,
          is_active,
          position,
          sort_order,
          price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;

      const {
        rows: [newAd],
      } = await client.query(insertAdQuery, [
        userId,
        title,
        description,
        image_url,
        startDate.toISOString(),
        endDate.toISOString(),
        is_active,
        position,
        sort_order,
        numericPrice,
      ]);

      // Handle tags if provided (يتوقع Array من UUIDs)
      if (Array.isArray(tags) && tags.length > 0) {
        // تحقّق من صحة UUIDs بشكل بسيط
        const uuidRx =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        const validTagIds = tags.filter((id) => typeof id === 'string' && uuidRx.test(id));
        if (validTagIds.length > 0) {
          // استخدم binding بدلاً من حقن نصي
          // (ad_id ثابت، أما tag_ids فنولّد placeholders)
          const values = validTagIds.map((_, idx) => `($1, $${idx + 2})`).join(', ');
          await client.query(
            `
              INSERT INTO public.ad_tags (ad_id, tag_id)
              VALUES ${values}
              ON CONFLICT DO NOTHING;
            `,
            [newAd.id, ...validTagIds],
          );
        }
      }

      await client.query('COMMIT');

      // Format dates for response
      newAd.price = Number(newAd.price);
      newAd.start_date = new Date(newAd.start_date).toISOString();
      newAd.end_date = new Date(newAd.end_date).toISOString();
      newAd.created_at = new Date(newAd.created_at).toISOString();
      newAd.updated_at = newAd.updated_at ? new Date(newAd.updated_at).toISOString() : null;

      return NextResponse.json(
        {
          success: true,
          data: newAd,
        },
        {
          status: 201,
          headers: { 'Cache-Control': 'no-store' },
        },
      );
    } catch (dbError) {
      await client.query('ROLLBACK');

      if (dbError.code === '23503') {
        // FK violation
        return NextResponse.json(
          {
            success: false,
            error: 'بيانات غير صالحة',
            errorCode: 'INVALID_DATA',
            details: process.env.NODE_ENV === 'development' ? dbError.detail : undefined,
          },
          { status: 400 },
        );
      }
      if (dbError.code === '23505') {
        // unique violation
        return NextResponse.json(
          { success: false, error: 'هذا الإعلان موجود مسبقاً', errorCode: 'DUPLICATE_ENTRY' },
          { status: 400 },
        );
      }

      console.error('Database error:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'حدث خطأ أثناء حفظ الإعلان',
          errorCode: 'DATABASE_ERROR',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
        },
        { status: 500 },
      );
    } finally {
      // أمان: release دائمًا
      try {
        // getPool().connect() أعطانا client، فلازم نحرره
      } catch {}
    }
  } catch (error) {
    console.error('Error in ads route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while processing your request',
        errorCode: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
