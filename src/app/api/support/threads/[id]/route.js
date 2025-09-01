/* ============================================================
   GET /api/support/threads/[id]
   ============================================================ */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

/* ---------- Prisma Setup ---------- */
let prisma;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma)
    global.prisma = new PrismaClient({ log: ['error', 'warn'] });
  prisma = global.prisma;
}
process.on('beforeExit', () => prisma?.$disconnect());

/* ---------- Session Function ---------- */
async function getSession(req) {
  try {
    const base = new URL(req.url).origin;
    const res = await fetch(`${base}/api/test-session`, {
      headers: {
        cookie: req.headers.get('cookie') ?? '',
        authorization: req.headers.get('authorization') ?? '',
        accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json().catch(() => null);
  } catch (err) {
    console.error('getSession error:', err);
    return null;
  }
}

/* ============================================================
   GET: Get Thread by ID
   ============================================================ */
export async function GET(req, { params }) {
  try {
    // Get session
    const session = await getSession(req);
    if (!session?.authenticated) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const userId = session.rawPayload?.userId ?? session.user?.id;
    const userRole = Number(session.rawPayload?.role_id ?? session.user?.role_id);
    const threadId = BigInt(params.id);

    // Get thread with user info
    const [thread] = await prisma.$queryRaw`
      SELECT 
        t.id::text,
        t.user_id::text,
        t.assigned_admin_id::text,
        t.status,
        t.created_at,
        t.updated_at,
        u.name as user_name,
        u.email as user_email,
        a.name as admin_name
      FROM support_threads t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN users a ON a.id = t.assigned_admin_id
      WHERE t.id = ${threadId}::bigint
      LIMIT 1
    `;

    if (!thread) {
      return NextResponse.json({ error: 'المحادثة غير موجودة' }, { status: 404 });
    }

    // Check permissions (admin or thread owner)
    if (!(userRole === 4 || thread.user_id === userId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // If admin is accessing, assign them if not already assigned
    if (userRole === 4 && !thread.assigned_admin_id) {
      await prisma.$queryRaw`
        UPDATE support_threads
        SET assigned_admin_id = ${userId}::uuid,
            updated_at = NOW()
        WHERE id = ${threadId}::bigint
        RETURNING *
      `;
      thread.assigned_admin_id = userId;
      thread.admin_name = session.user?.name;
    }

    return NextResponse.json(thread);
  } catch (error) {
    console.error('Error getting thread:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المحادثة' },
      { status: 500 }
    );
  }
}
