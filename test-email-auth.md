# 邮箱验证功能测试指南

## 功能概述

已完成邮箱验证功能的完整实现，包括：

### 1. 数据库结构更新
- `users` 表现在支持邮箱验证和OAuth登录
- 新增 `authMethods` 表支持多种登录方式
- 新增 `emailVerification` 表存储邮箱验证码

### 2. API端点
- `POST /api/auth/send-code` - 发送邮箱验证码
- `POST /api/auth/verify-code` - 验证邮箱验证码
- `POST /api/auth/register` - 邮箱验证注册
- `POST /api/auth/login` - 邮箱登录

### 3. 注册流程
1. **输入邮箱** - 用户输入邮箱地址
2. **发送验证码** - 系统发送6位验证码到邮箱
3. **验证邮箱** - 用户输入验证码验证邮箱
4. **设置账户** - 用户设置显示名称和密码
5. **完成注册** - 创建用户账户

### 4. 登录流程
- 用户输入邮箱和密码直接登录
- 支持邮箱和密码验证

## 测试步骤

### 注册测试
1. 访问 `http://localhost:3000/register`
2. 输入邮箱地址，点击"发送验证码"
3. 检查邮箱收到的验证码（开发环境会直接显示验证码）
4. 输入验证码，点击"验证邮箱"
5. 设置显示名称和密码
6. 点击"完成注册"

### 登录测试
1. 访问 `http://localhost:3000/login`
2. 输入注册时使用的邮箱和密码
3. 点击"登录"
4. 验证是否能成功登录

## 数据库字段说明

### users表
- `id` - 用户唯一标识
- `email` - 邮箱地址（唯一）
- `email_verified` - 邮箱验证状态
- `display_name` - 显示名称
- `avatar_url` - 头像URL
- `created_at` - 创建时间
- `updated_at` - 更新时间

### authMethods表
- `id` - 认证方式唯一标识
- `user_id` - 关联用户ID
- `provider` - 认证提供商（email/google/github等）
- `provider_id` - 提供商用户ID
- `hashed_password` - 密码哈希（仅email认证需要）
- `created_at` - 创建时间

### emailVerification表
- `id` - 验证记录唯一标识
- `email` - 邮箱地址
- `code` - 验证码
- `expires_at` - 过期时间
- `used` - 是否已使用
- `created_at` - 创建时间

## 后续扩展

此结构已预留支持：
- Google OAuth登录
- GitHub OAuth登录
- 其他第三方登录方式
- 密码重置功能
- 邮箱更改功能