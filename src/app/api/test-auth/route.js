import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';

export async function GET() {
  const client = await pool.connect();
  
  try {
    // Test connection and query the auth.users table
    const result = await client.query('SELECT id, email FROM auth.users LIMIT 1');
    
    return NextResponse.json({
      success: true,
      user: result.rows[0] || null,
      message: 'Successfully queried auth.users table'
    });
    
  } catch (error) {
    console.error('Error querying auth.users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to query auth.users',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
