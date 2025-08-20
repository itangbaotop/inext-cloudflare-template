-- 添加 Stripe 相关字段到用户表
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN subscription_end_date INTEGER;
ALTER TABLE users ADD COLUMN subscription_plan TEXT DEFAULT 'free';