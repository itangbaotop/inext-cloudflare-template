const Database = require('better-sqlite3');

// 连接到SQLite数据库
const db = new Database('ilearning.db');

console.log('开始应用数据库迁移...');

try {
  // 创建认证方式表
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS auth_methods (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_id TEXT,
        hashed_password TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
  } catch(e) { console.log('auth_methods表已存在或跳过'); }

  // 创建邮箱验证表
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS email_verification (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        used INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
  } catch(e) { console.log('email_verification表已存在或跳过'); }

  // 检查users表是否存在
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
  
  if (tableExists) {
    console.log('✅ 用户表已存在，添加新字段...');
    
    // 逐个添加字段，忽略已存在的错误
    const addColumn = (column, definition) => {
      try {
        db.exec(`ALTER TABLE users ADD COLUMN ${column} ${definition}`);
        console.log(`✅ 添加字段 ${column}`);
      } catch(e) {
        if (e.message.includes('duplicate column name')) {
          console.log(`⏭️  字段 ${column} 已存在`);
        } else {
          console.log(`⚠️  添加 ${column} 时出错:`, e.message);
        }
      }
    };
    
    addColumn('email', 'TEXT');
    addColumn('email_verified', 'INTEGER DEFAULT 0');
    addColumn('display_name', 'TEXT');
    addColumn('avatar_url', 'TEXT');
    addColumn('created_at', 'INTEGER DEFAULT (strftime("%s", "now"))');
    addColumn('updated_at', 'INTEGER DEFAULT (strftime("%s", "now"))');
    
    // 更新现有数据
    try {
      db.exec(`UPDATE users SET email = username WHERE email IS NULL`);
      db.exec(`UPDATE users SET display_name = username WHERE display_name IS NULL`);
      console.log('✅ 更新现有数据');
    } catch(e) { console.log('更新数据时出错:', e.message); }
    
    // 创建索引
    try {
      db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email)`);
      console.log('✅ 创建email唯一索引');
    } catch(e) { console.log('索引已存在或跳过'); }
    
  } else {
    console.log('创建新的用户表...');
    db.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        email_verified INTEGER DEFAULT 0,
        username TEXT UNIQUE,
        display_name TEXT,
        avatar_url TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
  }
  
  console.log('✅ 数据库迁移成功完成');
  
  // 检查表结构
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  console.log('当前数据库表:', tables.map(t => t.name));
  
  if (tableExists) {
    const columns = db.prepare("PRAGMA table_info(users)").all();
    console.log('users表字段:', columns.map(c => c.name));
  }
  
} catch (error) {
  console.error('❌ 数据库迁移失败:', error.message);
} finally {
  db.close();
}