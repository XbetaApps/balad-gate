import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = globalThis._prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis._prisma = prisma;

/* ============== Helpers ============== */
function base64UrlDecode(str) {
  try {
    return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  } catch {
    return null;
  }
}
function decodeJwtNoVerify(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payload = base64UrlDecode(parts[1]);
  if (!payload) return null;
  try { return JSON.parse(payload); } catch { return null; }
}
function getUserIdFromRequest(req) {
  const url = new URL(req.url);
  const hdrs = headers();

  const direct = hdrs.get("x-user-id") || hdrs.get("X-User-Id");
  if (direct) return direct;

  const auth = hdrs.get("authorization") || hdrs.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    const payload = decodeJwtNoVerify(auth.slice(7).trim());
    const uid = payload?.userId || payload?.sub || payload?.id;
    if (uid) return uid;
  }

  const ck = cookies();
  const names = [
    "bg_token",
    "token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "session",
  ];
  for (const n of names) {
    const v = ck.get(n)?.value;
    if (!v) continue;
    const payload = decodeJwtNoVerify(v);
    const uid = payload?.userId || payload?.sub || payload?.id;
    if (uid) return uid;
  }

  const uidParam = url.searchParams.get("uid"); // للديبج فقط
  if (uidParam) return uidParam;

  return null;
}

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
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ message: "غير مصرح: مفقود X-User-Id" }, { status: 401 });
    }

    if (action === "check") {
      const row = await prisma.user.findUnique({
        where: { id: userId },
        select: { onboarding_done: true, onboarding_done_at: true },
      });
      if (!row) return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });

      return NextResponse.json(
        { onboarding_done: !!row.onboarding_done, onboarding_done_at: row.onboarding_done_at || null },
        { status: 200 }
      );
    }

    // تحميل بيانات المودال
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        phone: true, 
        city: true,
        onboarding_done: true, 
        onboarding_done_at: true 
      },
    });
    if (!user) return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });

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
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ message: "غير مصرح: مفقود X-User-Id" }, { status: 401 });
    }
    if (!action) {
      return NextResponse.json({ message: "حدد action في الاستعلام" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    if (action === "update-status") {
      const { phone, city, onboarding_done, onboarding_done_at } = body || {};

      const data = {};
      if (phone !== undefined) data.phone = phone || null;
      if (city !== undefined) data.city = city || null;
      if (onboarding_done === true) {
        data.onboarding_done = true;
        data.onboarding_done_at = toDateOrNull(onboarding_done_at) || new Date();
      }

      if (Object.keys(data).length > 0) {
        await prisma.user.update({ where: { id: userId }, data, select: { id: true } });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          email: true, 
          name: true, 
          phone: true, 
          city: true,
          onboarding_done: true, 
          onboarding_done_at: true 
        },
      });

      return NextResponse.json(
        {
          ok: true,
          user,
          onboarding_done: !!user?.onboarding_done,
          onboarding_done_at: user?.onboarding_done_at || null,
        },
        { status: 200 }
      );
    }

    if (action === "update-profile") {
      const { phone, city, tags, onboarding_done, onboarding_done_at } = body || {};

      // تحديث بيانات المستخدم
      const data = {};
      if (phone !== undefined) data.phone = phone || null;
      if (city !== undefined) data.city = city || null;
      if (onboarding_done === true) {
        data.onboarding_done = true;
        data.onboarding_done_at = toDateOrNull(onboarding_done_at) || new Date();
      }
      if (Object.keys(data).length > 0) {
        await prisma.user.update({ where: { id: userId }, data, select: { id: true } });
      }

      // مزامنة التاغات
      if (Array.isArray(tags)) {
        const cleanNames = [...new Set(tags.map((n) => `${n}`.trim()).filter(Boolean))];
        if (cleanNames.length > 0) {
          const existing = await prisma.tags.findMany({
            where: { name: { in: cleanNames } },
            select: { id: true, name: true },
          });
          const existingNames = new Set(existing.map((t) => t.name));
          const toCreate = cleanNames.filter((n) => !existingNames.has(n));

          if (toCreate.length > 0) {
            await prisma.tags.createMany({
              data: toCreate.map((name) => ({ name })),
              skipDuplicates: true,
            });
          }

          const allTags = await prisma.tags.findMany({
            where: { name: { in: cleanNames } },
            select: { id: true },
          });
          const tagIds = allTags.map((t) => t.id);

          await prisma.user_tag_follows.deleteMany({ where: { user_id: userId } });
          if (tagIds.length > 0) {
            await prisma.user_tag_follows.createMany({
              data: tagIds.map((tag_id) => ({ user_id: userId, tag_id })),
              skipDuplicates: true,
            });
          }
        }
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          email: true, 
          name: true, 
          phone: true, 
          city: true,
          onboarding_done: true, 
          onboarding_done_at: true 
        },
      });

      return NextResponse.json(
        {
          ok: true,
          user,
          onboarding_done: !!user?.onboarding_done,
          onboarding_done_at: user?.onboarding_done_at || null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: "action غير مدعوم" }, { status: 400 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });
    }
    console.error("onboarding POST error:", e);
    return NextResponse.json({ message: e?.message || "Internal Server Error" }, { status: 500 });
  }
}
