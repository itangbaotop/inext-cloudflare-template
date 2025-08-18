// src/db/schema.ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// 用户基础信息表
export const usersTable = sqliteTable('users', {
  id: text('id').notNull().primaryKey(),
  email: text('email').unique(),
  email_verified: integer('email_verified', { mode: 'boolean' }).default(false),
  username: text('username').unique(),
  display_name: text('display_name'),
  avatar_url: text('avatar_url'),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// 用户认证方式表（支持多种登录方式）
export const authMethodsTable = sqliteTable('auth_methods', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
   .notNull()
   .references(() => usersTable.id),
  provider: text('provider').notNull(), // 'email', 'google', 'github', etc.
  provider_id: text('provider_id'), // 第三方提供的用户ID
  hashed_password: text('hashed_password'), // 本地密码（provider为email时使用）
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// 邮箱验证码表
export const emailVerificationTable = sqliteTable('email_verification', {
  id: text('id').notNull().primaryKey(),
  email: text('email').notNull(),
  code: text('code').notNull(),
  expires_at: integer('expires_at', { mode: 'timestamp' }).notNull(),
  used: integer('used', { mode: 'boolean' }).default(false),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// 用户会话表（保持不变，用于JWT）
export const sessionsTable = sqliteTable('sessions', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
   .notNull()
   .references(() => usersTable.id),
  expiresAt: integer('expires_at').notNull(),
});

// 保留旧表结构用于向后兼容（后续可迁移）
export const keysTable = sqliteTable('keys', {
    id: text('id').notNull().primaryKey(),
    userId: text('user_id').notNull().references(() => usersTable.id),
    hashed_password: text('hashed_password')
});