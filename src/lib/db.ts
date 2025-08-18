import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '@/db/schema';

export async function getDb() {
  // 开发环境使用本地 SQLite 文件
  if (process.env.NODE_ENV === 'development') {
    const sqlite = new Database('ilearning.db');
    return drizzleSqlite(sqlite, { schema });
  }
  
  // 生产环境使用 Cloudflare D1
  const { env } = await getCloudflareContext({ async: true });
  return drizzleD1(env.DB, { schema });
}
