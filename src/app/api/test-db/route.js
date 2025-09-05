import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';
import { authPool } from '@/app/lib/db-auth';

export async function GET() {
  const client = await pool.connect();
  const authClient = await authPool.connect();
  
  try {
    // Test public schema connection
    await client.query('SELECT 1');
    
    // Test auth schema connection
    await authClient.query('SELECT 1');
    
    // Get auth.users table structure
    const authUsers = await authClient.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'auth' AND table_name = 'users';
    `);
    
    // Get public.ads table structure
    const publicAds = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ads';
    `);
    
    // Try to get a sample user
    let sampleUser;
    try {
      const result = await authClient.query('SELECT id, email FROM auth.users LIMIT 1');
      sampleUser = result.rows[0];
    } catch (error) {
      sampleUser = { error: error.message };
    }
    
    return NextResponse.json({
      success: true,
      schemas: {
        auth: {
          users: authUsers.rows,
          sampleUser: sampleUser
        },
        public: {
          ads: publicAds.rows
        }
      }
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          detail: error.detail,
          hint: error.hint,
          position: error.position,
          schema: error.schema,
          table: error.table,
          column: error.column,
          dataType: error.dataType,
          constraint: error.constraint
        } : undefined
      },
      { status: 500 }
    );
  } finally {
    client.release();
    if (authClient) authClient.release();
  }
}
