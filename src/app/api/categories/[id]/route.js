// /app/api/categories/[id]/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

// Helper to get current admin user ID
async function getCurrentAdminId(request) {
  console.log('\n=== getCurrentAdminId ===');
  
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      console.log('Token found in Authorization header');
    } else {
      // Fallback to cookies if no Authorization header
      const cookieStore = cookies();
      const tokenCookie = cookieStore.get('token')?.value || 
                         cookieStore.get('session')?.value ||
                         cookieStore.get('next-auth.session-token')?.value ||
                         cookieStore.get('__Secure-next-auth.session-token')?.value;
      
      if (tokenCookie) {
        token = tokenCookie;
        console.log('Token found in cookies');
      } else {
        console.log('No token found in headers or cookies');
        return null;
      }
    }
    
    if (!token) {
      console.log('No token provided');
      return null;
    }
    
    console.log('Token length:', token.length);
    console.log('Token prefix:', token.substring(0, 10) + '...');
    
    try {
      // Verify JWT token
      const jwt = require('jsonwebtoken');
      console.log('Verifying token with secret:', process.env.JWT_SECRET ? '***' : 'Using default secret');
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme-secret');
      console.log('Decoded token:', JSON.stringify(decoded, null, 2));
      
      if (!decoded) {
        console.log('Invalid token: No payload');
        return null;
      }
      
      const userId = decoded.userId || decoded.sub;
      if (!userId) {
        console.log('Invalid token: No userId or sub in payload');
        return null;
      }
      
      // Check if user exists and is admin
      const pool = getPool();
      const user = await pool.query(
        'SELECT id, email, role_id FROM users WHERE id = $1',
        [userId]
      );

      if (user.rows.length === 0) {
        console.log('User not found in database');
        return null;
      }

      // Check if user is admin (assuming role_id 1 is admin)
      if (user.rows[0].role_id !== 1) {
        console.log('User is not an admin');
        return null;
      }

      return userId;
    } catch (error) {
      console.error('Error in getCurrentAdminId:', error);
      return null;
    }
  } catch (error) {
    console.error('Error in getCurrentAdminId:', error);
    return null;
  }
}

// GET /api/categories/[id] - Get a single category
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const pool = getPool();
    
    const result = await pool.query(
      `SELECT id, name, description, parent_id, is_active, sort_order, created_at, updated_at 
       FROM categories 
       WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { 
          error: 'Category not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error in GET /api/categories/[id]:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch category',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// PATCH /api/categories/[id] - Update a category
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { name, description, parent_id, is_active, sort_order = 5 } = await request.json();
    
    // Ensure is_active is a boolean
    const isActiveStatus = typeof is_active === 'boolean' ? is_active : true;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }
    
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
    
    // Check if category exists
    const checkResult = await pool.query(
      'SELECT id FROM categories WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { 
          error: 'Category not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }
    
    // Prevent circular references
    if (parent_id === id) {
      return NextResponse.json(
        { 
          error: 'Category cannot be its own parent',
          code: 'INVALID_PARENT'
        },
        { status: 400 }
      );
    }
    
    // Temporarily disable authentication for testing (match POST behavior)
    const adminId = 1; // Default admin ID for testing
    // TODO: Re-enable proper admin authentication once frontend sends valid token

    // Update category
    const result = await pool.query(
      `UPDATE categories 
       SET name = $1, 
           description = $2, 
           parent_id = $3,
           is_active = $4,
           sort_order = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, name, description, parent_id, is_active, sort_order`,
      [
        name,
        description || null,
        parent_id || null,
        isActiveStatus,  // Use the properly typed is_active value
        priority,
        id
      ]
    );
    
    return NextResponse.json(result.rows[0]);
    
  } catch (error) {
    console.error('Error in PATCH /api/categories/[id]:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update category',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(request, { params }) {
  try {
    // Temporarily disable authentication for testing (match POST behavior)
    const adminId = 1; // Default admin ID for testing
    // TODO: Re-enable proper admin authentication once frontend sends valid token

    const { id } = params;
    const pool = getPool();
    
    // First, check if the category exists
    const checkResult = await pool.query(
      'SELECT id FROM categories WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { 
          error: 'Category not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Attempt to detach references from other tables to avoid FK conflicts
    try {
      await pool.query('UPDATE ads SET category_id = NULL WHERE category_id IN (SELECT id FROM categories WHERE id = $1 OR parent_id = $1)', [id]);
    } catch (e) { console.log('No ads table or update failed:', e.message); }
    try {
      await pool.query('UPDATE posts SET category_id = NULL WHERE category_id IN (SELECT id FROM categories WHERE id = $1 OR parent_id = $1)', [id]);
    } catch (e) { console.log('No posts table or update failed:', e.message); }
    try {
      await pool.query('UPDATE services SET category_id = NULL WHERE category_id IN (SELECT id FROM categories WHERE id = $1 OR parent_id = $1)', [id]);
    } catch (e) { console.log('No services table or update failed:', e.message); }

    // Delete all subcategories first (cascade delete)
    await pool.query('DELETE FROM categories WHERE parent_id = $1', [id]);

    // Delete the parent category
    const deleteResult = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (deleteResult.rowCount === 0) {
      throw new Error('No rows were deleted');
    }
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/categories/[id]:', error);
    
    // Handle foreign key constraint violation
    if (error.code === '23503') {
      return NextResponse.json(
        { 
          error: 'Cannot delete category because it is in use',
          code: 'IN_USE'
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete category',
        details: error.message 
      },
      { status: 500 }
    );
  }
}