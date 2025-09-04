import { Pool } from 'pg';

// Create a separate pool for auth-related queries
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Set the search path to include auth schema
  options: '-c search_path=auth,public'
});

// Test the connection
async function testAuthConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to auth schema successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to auth schema:', error.message);
    return false;
  }
}

// Test the connection on startup
testAuthConnection();

export { pool as authPool };
