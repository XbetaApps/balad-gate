// /app/api/admin/categories/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Re-use global pool to avoid too many connections
function getPool() {
  if (!globalThis.__PG_POOL__) {
    globalThis.__PG_POOL__ = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined
    });
  }
  return globalThis.__PG_POOL__;
}

// GET /api/admin/categories – list all categories (active & inactive)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    const pool = getPool();
    let query = 'SELECT id, name, parent_id, serial_id, is_active FROM categories';
    const queryParams = [];
    const conditions = [];

    if (parentId === 'null' || parentId === '') {
      conditions.push('parent_id IS NULL');
    } else if (parentId) {
      conditions.push('parent_id = $1');
      queryParams.push(parentId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY COALESCE(serial_id, 0), name';

    const result = await pool.query(query, queryParams);
    const rows = Array.isArray(result.rows) ? result.rows : [];
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error in admin GET /categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories', details: error.message }, { status: 500 });
  }
}
