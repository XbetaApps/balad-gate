import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

// Initialize Prisma client
const prisma = globalThis._prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis._prisma = prisma;

/**
 * Converts a value to a Date object or returns null if invalid
 * @param {any} v - The value to convert
 * @returns {Date|null} The Date object or null if invalid
 */
function toDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/* ============== GET ============== */
/**
 * GET /api/onboarding
 *   - action=check  → { onboarding_done, onboarding_done_at }
 *   - بدون action  → { user, followedTags, suggestedTags }
 */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    // Get authorization header
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'غير مصرح - يرجى تسجيل الدخول' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify token
    let userData;
    try {
      userData = await verifyToken(authHeader);
    } catch (error) {
      return NextResponse.json(
        { error: error.message || 'رمز غير صالح أو منتهي الصلاحية' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.userId;

    if (action === "check") {
      // Use raw query to avoid Prisma schema validation
      const [row] = await prisma.$queryRaw`
        SELECT onboarding_done, onboarding_done_at 
        FROM users 
        WHERE id = ${userId}::uuid
      `;
      
      if (!row) return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });

      return NextResponse.json(
        { 
          onboarding_done: !!row.onboarding_done, 
          onboarding_done_at: row.onboarding_done_at || null 
        },
        { status: 200 }
      );
    }

    // تحميل بيانات المودال باستخدام raw query
    const [user] = await prisma.$queryRaw`
      SELECT 
        id, 
        email, 
        name, 
        phone, 
        city,
        onboarding_done, 
        onboarding_done_at 
      FROM users 
      WHERE id = ${userId}::uuid
    `;
    if (!user) return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });
    
    // Convert to boolean to ensure consistent type
    user.onboarding_done = !!user.onboarding_done;

    let followedTags = [];
    try {
      const follows = await prisma.user_tag_follows.findMany({
        where: { user_id: userId, status: "following" },
        select: { tags: { select: { id: true, name: true } } },
        take: 100,
      });
      followedTags = follows.map((f) => f.tags).filter(Boolean).map((t) => ({ id: t.id, name: t.name }));
    } catch { followedTags = []; }

    let suggestedTags = [];
    try {
      const prefs = await prisma.user_tag_preferences.findMany({
        where: { user_id: userId, status: "suggested" },
        select: { tags: { select: { id: true, name: true } } },
        take: 20,
      });
      suggestedTags = prefs.map((p) => p.tags).filter(Boolean).map((t) => ({ id: t.id, name: t.name }));
      if (suggestedTags.length === 0) {
        const any = await prisma.tags.findMany({ select: { id: true, name: true }, take: 10 });
        suggestedTags = any.map((t) => ({ id: t.id, name: t.name }));
      }
    } catch {
      try {
        const any = await prisma.tags.findMany({ select: { id: true, name: true }, take: 10 });
        suggestedTags = any.map((t) => ({ id: t.id, name: t.name }));
      } catch { suggestedTags = []; }
    }

    return NextResponse.json({ user, followedTags, suggestedTags }, { status: 200 });
  } catch (e) {
    console.error("onboarding GET error:", e);
    return NextResponse.json({ message: e?.message || "Internal Server Error" }, { status: 500 });
  }
}

/* ============== POST ============== */
/**
 * POST /api/onboarding?action=...
 *  - action=update-status  : phone + (onboarding_done? true) → يحدّث users فقط
 *  - action=update-profile : phone + tags[] + (onboarding_done? true)
 */
export async function POST(req) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    // Get authorization header
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'غير مصرح - يرجى تسجيل الدخول' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify token
    let userData;
    try {
      userData = await verifyToken(authHeader);
    } catch (error) {
      return NextResponse.json(
        { error: error.message || 'رمز غير صالح أو منتهي الصلاحية' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.userId;
    if (!action) {
      return NextResponse.json({ message: "حدد action في الاستعلام" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    if (action === "update-status") {
      try {
        const { phone, city, skip, onboarding_done, onboarding_done_at } = body || {};

        // Handle skip case - just return success with default values
        if (skip) {
          const [user] = await prisma.$queryRaw`
            SELECT id, email, name, phone, city 
            FROM users 
            WHERE id = ${userId}::uuid
          `;
          
          if (!user) {
            return NextResponse.json(
              { error: 'المستخدم غير موجود' },
              { status: 404 }
            );
          }
          
          // Update the user's onboarding status in the database
          await prisma.$executeRaw`
            UPDATE users 
            SET onboarding_done = true, 
                onboarding_done_at = NOW()
            WHERE id = ${userId}::uuid
          `;
          
          return NextResponse.json({
            ok: true,
            user: {
              ...user,
              onboarding_done: true,
              onboarding_done_at: new Date().toISOString()
            },
            onboarding_done: true,
            onboarding_done_at: new Date().toISOString()
          }, { 
            status: 200,
            headers: {
              'Cache-Control': 'no-store',
              'Pragma': 'no-cache'
            }
          });
        }

        // Build update query dynamically based on provided fields
        const updates = [];
        const params = [];
        let paramIndex = 1;
        
        if (phone !== undefined) {
          updates.push(`phone = $${paramIndex++}`);
          params.push(phone || null);
        }
        
        if (city !== undefined) {
          updates.push(`city = $${paramIndex++}`);
          params.push(city || null);
        }
        
        if (onboarding_done !== undefined) {
          updates.push(`onboarding_done = $${paramIndex++}`);
          params.push(!!onboarding_done);
        }
        
        if (onboarding_done_at !== undefined) {
          updates.push(`onboarding_done_at = $${paramIndex++}`);
          params.push(onboarding_done_at ? new Date(onboarding_done_at) : null);
        }
        
        if (updates.length === 0) {
          return NextResponse.json(
            { error: 'لا توجد حقول للتحديث' },
            { status: 400 }
          );
        }
        
        params.push(userId);
        
        // Execute the update
        await prisma.$executeRawUnsafe(
          `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}::uuid`,
          ...params
        );
        
        // Fetch the updated user data
        const [updatedUser] = await prisma.$queryRaw`
          SELECT 
            id, 
            email, 
            name, 
            phone, 
            city,
            onboarding_done, 
            onboarding_done_at 
          FROM users 
          WHERE id = ${userId}::uuid
        `;
        
        if (!updatedUser) {
          return NextResponse.json(
            { error: 'فشل تحديث بيانات المستخدم' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          ok: true,
          user: {
            ...updatedUser,
            onboarding_done: updatedUser.onboarding_done || false,
            onboarding_done_at: updatedUser.onboarding_done_at || null
          },
          onboarding_done: updatedUser.onboarding_done || false,
          onboarding_done_at: updatedUser.onboarding_done_at || null
        }, { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store',
            'Pragma': 'no-cache'
          }
        });
      } catch (error) {
        console.error('Error in update-status:', error);
        return NextResponse.json(
          { error: 'حدث خطأ أثناء معالجة الطلب' },
          { status: 500 }
        );
      }
    }

    if (action === "update-profile") {
      try {
        const { phone, city, tags, onboarding_done, onboarding_done_at } = body || {};

        // Build update query for user data
        const updates = [];
        const params = [];
        let paramIndex = 1;
        
        if (phone !== undefined) {
          updates.push(`phone = $${paramIndex++}`);
          params.push(phone || null);
        }
        
        if (city !== undefined) {
          updates.push(`city = $${paramIndex++}`);
          params.push(city || null);
        }
        
        if (onboarding_done === true) {
          updates.push(`onboarding_done = $${paramIndex++}`);
          params.push(true);
          updates.push(`onboarding_done_at = $${paramIndex++}`);
          params.push(toDateOrNull(onboarding_done_at) || new Date());
        }
        
        // Update user data if there are any fields to update
        if (updates.length > 0) {
          params.push(userId);
          await prisma.$executeRawUnsafe(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}::uuid`,
            ...params
          );
        }

        // Handle tags if provided
        if (Array.isArray(tags)) {
          const cleanNames = [...new Set(tags.map((n) => `${n}`.trim()).filter(Boolean))];
          if (cleanNames.length > 0) {
            // Find existing tags
            const existing = await prisma.$queryRaw`
              SELECT id, name 
              FROM tags 
              WHERE name = ANY(${cleanNames}::text[])
            `;
            
            const existingNames = new Set(existing.map((t) => t.name));
            const toCreate = cleanNames.filter((n) => !existingNames.has(n));

            // Create new tags that don't exist
            if (toCreate.length > 0) {
              await prisma.$executeRawUnsafe(
                `INSERT INTO tags (name) VALUES ${toCreate.map((_, i) => `($${i + 1})`).join(', ')}`,
                ...toCreate
              );
            }

            // Get all tag IDs (existing and newly created)
            const allTags = await prisma.$queryRaw`
              SELECT id FROM tags WHERE name = ANY(${cleanNames}::text[])
            `;
            
            // Delete existing user tags
            await prisma.$executeRaw`
              DELETE FROM _UserToTags WHERE "A" = ${userId}::uuid
            `;
            
            // Add new user tags
            if (allTags.length > 0) {
              await prisma.$executeRawUnsafe(
                `INSERT INTO "_UserToTags" ("A", "B") VALUES ${allTags.map((_, i) => `($1, $${i + 2}::uuid)`).join(', ')}`,
                [userId, ...allTags.map(t => t.id)]
              );
            }
          }
        }

        // Fetch updated user data
        const [updatedUser] = await prisma.$queryRaw`
          SELECT 
            id, 
            email, 
            name, 
            phone, 
            city,
            onboarding_done, 
            onboarding_done_at 
          FROM users 
          WHERE id = ${userId}::uuid
        `;

        if (!updatedUser) {
          return NextResponse.json(
            { error: 'فشل تحديث بيانات المستخدم' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          ok: true,
          user: {
            ...updatedUser,
            onboarding_done: updatedUser.onboarding_done || false,
            onboarding_done_at: updatedUser.onboarding_done_at || null
          },
          onboarding_done: updatedUser.onboarding_done || false,
          onboarding_done_at: updatedUser.onboarding_done_at || null
        }, { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store',
            'Pragma': 'no-cache'
          }
        });
      } catch (error) {
        console.error('Error in update-profile:', error);
        return NextResponse.json(
          { error: 'حدث خطأ أثناء تحديث الملف الشخصي' },
          { status: 500 }
        );
      }
    }

    // Default response if no action matches
    return NextResponse.json(
      { error: 'إجراء غير صالح' },
      { status: 400 }
    );
  } catch (e) {
    // Check for Prisma error using the error code
    if (e.code === "P2025") {
      return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });
    }
    
    console.error("onboarding POST error:", e);
    return NextResponse.json({ 
      message: e?.message || "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 });
  }
}
