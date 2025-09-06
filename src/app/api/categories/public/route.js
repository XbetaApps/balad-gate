import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Database connection pool
function getPool() {
  if (!globalThis.__PG_POOL__) {
    globalThis.__PG_POOL__ = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalThis.__PG_POOL__;
}

// GET /api/categories/public - Get all active categories for public use
export async function GET(request) {
  const pool = getPool();
  
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    // Query to get all active categories with their parent names
    let query = `
      WITH RECURSIVE category_tree AS (
        -- Base case: get all active root categories (where parent_id IS NULL)
        SELECT 
          id,
          serial_id,
          name,
          parent_id,
          description,
          sort_order,
          name as full_path,
          1 as level
        FROM categories
        WHERE is_active = true AND parent_id IS NULL
        
        UNION ALL
        
        -- Recursive case: get all active child categories
        SELECT 
          c.id,
          c.serial_id,
          c.name,
          c.parent_id,
          c.description,
          c.sort_order,
          ct.full_path || ' > ' || c.name as full_path,
          ct.level + 1 as level
        FROM categories c
        JOIN category_tree ct ON c.parent_id = ct.id
        WHERE c.is_active = true
      )
      SELECT 
        ct.*,
        p.name as parent_name
      FROM category_tree ct
      LEFT JOIN categories p ON ct.parent_id = p.id
    `;
    
    const queryParams = [];
    let whereClause = '';
    
    // Add parent filter if specified
    if (parentId) {
      whereClause = ' WHERE ct.parent_id = $1';
      queryParams.push(parentId);
    }
    
    // Add includeInactive filter if needed
    if (includeInactive) {
      whereClause = whereClause 
        ? whereClause + ' AND (ct.is_active = true OR ct.is_active = false)'
        : ' WHERE (ct.is_active = true OR ct.is_active = false)';
    }
    
    query += whereClause;
    
    // Order by level (to show parent categories first) and then by sort_order and name
    query += ' ORDER BY ct.level, ct.sort_order, ct.name';
    
    const result = await pool.query(query, queryParams);
    
    return NextResponse.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request