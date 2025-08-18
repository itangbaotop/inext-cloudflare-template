// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts', // 指向您的 schema 文件
  out: './drizzle', // 迁移文件的输出目录
  dialect: 'sqlite', // D1 与 SQLite 兼容
  driver: 'd1-http',
  dbCredentials: {
    wranglerConfigPath: 'wrangler.toml',
    dbName: 'ilearning_db',
  },
});