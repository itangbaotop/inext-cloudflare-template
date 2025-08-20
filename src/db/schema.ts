// src/db/schema.ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// 用户基础信息表
export const usersTable = sqliteTable('users', {
  id: text('id').notNull().primaryKey(),
  email: text('email').unique(),
  email_verified: integer('email_verified', { mode: 'boolean' }).default(false),
  username: text('username').unique(),
  display_name: text('display_name'),
  first_name: text('first_name'),
  last_name: text('last_name'),
  phone: text('phone'),
  avatar_url: text('avatar_url'),
  google_id: text('google_id').unique(), // Google用户ID
  
  // Stripe 相关字段
  stripe_customer_id: text('stripe_customer_id').unique(),
  stripe_subscription_id: text('stripe_subscription_id').unique(),
  subscription_status: text('subscription_status').default('inactive'), // active, inactive, canceled, past_due
  subscription_end_date: integer('subscription_end_date', { mode: 'timestamp' }),
  subscription_plan: text('subscription_plan').default('free'), // free, basic, pro, premium
  
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

// 认证令牌表（用于魔法链接、密码重置等）
export const authTokensTable = sqliteTable('auth_tokens', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
   .notNull()
   .references(() => usersTable.id),
  token: text('token').notNull().unique(),
  type: text('type').notNull(), // 'magic_link', 'password_reset', etc.
  expires_at: integer('expires_at', { mode: 'timestamp' }).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});



// 保留旧表结构用于向后兼容（后续可迁移）
export const keysTable = sqliteTable('keys', {
    id: text('id').notNull().primaryKey(),
    userId: text('user_id').notNull().references(() => usersTable.id),
    hashed_password: text('hashed_password')
});