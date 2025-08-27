export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { Pool } from 'pg';

function getPool() {
  if (!globalThis.__PG_POOL__) {
    globalThis.__PG_POOL__ = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalThis.__PG_POOL__;
}

export async function GET(req) {
  const pool = getPool();
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '12', 10)));

  const params = [];
  let i = 1;
  let where = '';

  if (q) {
    where = `WHERE name ILIKE $${i++}`;
    params.push(`%${q}%`);
  }

  const sql = `
    SELECT id, name
    FROM public.tags
    ${where}
    ORDER BY name ASC
    LIMIT $${i}
  `;
  params.push(limit);

  try {
    const { rows } = await pool.query(sql, params);
    return NextResponse.json(rows); // [{id, name}]
  } catch (e) {
    console.error('tags/search error:', e);
    return NextResponse.json({ message: 'تعذر جلب التاغات' }, { status: 500 });
  }
}
