// /app/api/categories/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { Pool } from 'pg';

// Database connection pool
function getPool() {
  // Reuse the same pool if it exists
  if (!globalThis.__PG_POOL__) {
    globalThis.__PG_POOL__ = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalThis.__PG_POOL__;
}

// Helper to get current admin user ID
async function getCurrentAdminId() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('No active session found');
      return null;
    }

    // Check if user is admin
    if (session.user.role !== 'admin' && session.user.role_id !== 1) {
      console.log('User is not an admin');
      return null;
    }

    console.log('Admin user verified:', session.user.id);
    return session.user.id;
  } catch (error) {
    console.error('Error in getCurrentAdminId:', error);
    return null;
  }
}

// GET /api/categories - Get all categories
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
    
    // Order by serial_id by default
    query += ' ORDER BY COALESCE(serial_id, 0), name';
    
    console.log('Executing query:', query, 'with params:', queryParams);
    
    const result = await pool.query(query, queryParams);
    
    // Ensure we return an array even if empty
    const categories = Array.isArray(result.rows) ? result.rows : [];
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error in GET /api/categories:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch categories',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category
export async function POST(request) {
  // Temporarily disable authentication for testing
  const adminId = 1; // Default admin ID for testing

  try {
    const { name, description, parent_id, sort_order = 5, is_active = true } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Validate priority range (1-10)
    const priority = parseInt(sort_order);
    if (isNaN(priority) || priority < 1 || priority > 10) {
      return NextResponse.json(
        { error: 'Priority must be a number between 1 and 10' },
        { status: 400 }
      );
    }


    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO categories (
        name, 
        description, 
        parent_id, 
        is_active,
        sort_order
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, description, parent_id, is_active, sort_order`,
      [
        name, 
        description || null, 
        parent_id || null,
        Boolean(is_active),
        priority
      ]
    );

    if (!result.rows[0]) {
      throw new Error('Failed to create category: No data returned');
    }

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/categories:', error);
    
    // Handle duplicate key error
    if (error.code === '23505') { // Unique violation
      return NextResponse.json(
        { 
          error: 'A category with this name already exists',
          code: 'DUPLICATE_NAME'
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create category',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
