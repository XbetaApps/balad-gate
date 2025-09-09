// /app/api/admin/categories/[id]/route.js
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Helper to get current admin user ID
async function getCurrentAdminId(headers) {
  const cookieString = headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieString.split(';').map(c => {
      const [key, val] = c.trim().split('=').map(decodeURIComponent);
      return [key, val];
    })
  );

  const token = cookies['next-auth.session-token'] || 
               cookies['__Secure-next-auth.session-token'];
  
  if (!token) return null;

  try {
    const result = await pool.query(
      `SELECT user_id FROM sessions 
       WHERE session_token = $1 
       AND expires > NOW() 
       LIMIT 1`,
      [token]
    );
    
    if (result.rows.length === 0) return null;
    
    // Verify if user is admin (role_id = 4)
    const user = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND role_id = 4`,
      [result.rows[0].user_id]
    );
    
    return user.rows[0]?.id || null;
  } catch (error) {
    console.error('Error getting admin ID:', error);
    return null;
  }
}

// GET /api/admin/categories/[id] - Get a single category
async function GET(request, { params }) {
  try {
    const adminId = await getCurrentAdminId(request.headers);
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const result = await pool.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/categories/[id] - Update a category
async function PATCH(request, { params }) {
  try {
    const adminId = await getCurrentAdminId(request.headers);
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const updates = await request.json();
    
    // Build the update query dynamically based on provided fields
    const fields = [];
    const values = [id];
    let paramIndex = 2;

    if ('name' in updates) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
      
      // If name is being updated, update the slug too
      if (!updates.slug) {
        const slug = updates.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        fields.push(`slug = $${paramIndex++}`);
        values.push(slug);
      }
    }

    if ('slug' in updates && updates.slug) {
      fields.push(`slug = $${paramIndex++}`);
      values.push(updates.slug);
    }

    if ('description' in updates) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description || null);
    }

    if ('parent_id' in updates) {
      fields.push(`parent_id = $${paramIndex++}`);
      values.push(updates.parent_id || null);
    }

    if ('is_active' in updates) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(updates.is_active);
    }

    if ('sort_order' in updates) {
      fields.push(`sort_order = $${paramIndex++}`);
      values.push(updates.sort_order || 0);
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const query = {
      text: `
        UPDATE categories
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      values
    };

    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error.code === '23505') { // Unique violation
      return NextResponse.json(
        { error: 'A category with this name or slug already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories/[id] - Delete a category
async function DELETE(request, { params }) {
  try {
    const adminId = await getCurrentAdminId(request.headers);
    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if category has subcategories
    const subcategories = await pool.query(
      'SELECT id FROM categories WHERE parent_id = $1',
      [id]
    );

    if (subcategories.rows.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}

export { GET, PATCH, DELETE };