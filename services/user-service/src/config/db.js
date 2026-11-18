const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Khởi tạo Connection Pool kết nối tới MySQL database (user_db)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'user_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Hàm kiểm tra kết nối CSDL lúc khởi động server
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ [user-service] Kết nối MySQL database (user_db) thành công!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ [user-service] Lỗi kết nối MySQL (user_db):', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
