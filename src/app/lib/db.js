import { Pool } from 'pg';

const pools = {};

/**
 * Get a database connection pool
 * @param {string} [schema='public'] - The database schema to use
 * @returns {Pool} A PostgreSQL connection pool
 */
function getPool(schema = 'public') {
  if (!pools[schema]) {
    const config = {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false,
    };

    // Only set search_path if not the default 'public' schema
    if (schema !== 'public') {
      config.options = `-c search_path=${schema},public`;
    }

    pools[schema] = new Pool(config);
    
    // Test the connection
    testConnection(pools[schema], schema);
  }
  
  return pools[schema];
}

/**
 * Test the database connection
 * @param {Pool} pool - The connection pool to test
 * @param {string} schema - The schema name for logging
 */
async function testConnection(pool, schema) {
  const client = await pool.connect().catch(error => {
    console.error(`❌ Failed to connect to database (${schema}):`, error.message);
    return null;
  });

  if (client) {
    try {
      await client.query('SELECT NOW()');
      console.log(`✅ Successfully connected to database (${schema})`);
    } catch (error) {
      console.error(`❌ Database connection test failed (${schema}):`, error.message);
    } finally {
      client.release();
    }
  }
}

// Initialize default pool when this module is imported
getPool('public');

export { getPool };
