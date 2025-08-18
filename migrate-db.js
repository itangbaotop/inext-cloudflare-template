const Database = require('better-sqlite3');
const fs = require('fs');

// 连接到SQLite数据库
const db = new Database('ilearning.db');

// 读取迁移SQL文件
const migrationSql = fs.readFileSync('./drizzle/0001_goofy_guardsmen.sql', 'utf8');

console.log('开始应用数据库迁移...');

try {
  // 执行迁移SQL
  db.exec(migrationSql);
  console.log('✅ 数据库迁移成功完成');
  
  // 检查表结构
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('当前数据库表:', tables.map(t => t.name));
  
} catch (error) {
  console.error('❌ 数据库迁移失败:', error.message);
} finally {
  db.close();
}