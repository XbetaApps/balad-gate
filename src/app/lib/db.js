import { Pool } from 'pg';

// تكوين اتصال قاعدة البيانات
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // مطلوب لاتصالات Supabase
  }
});

// اختبار الاتصال بقاعدة البيانات
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    client.release();
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
  }
}

// اختبار الاتصال بقاعدة البيانات
testConnection();

// تصدير pool للاستخدام في الملفات الأخرى
export { pool };
