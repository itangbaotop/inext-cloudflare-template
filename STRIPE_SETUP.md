# Stripe 支付集成配置指南

## 环境变量配置

在 `.env.local` 文件中添加以下配置：

```bash
# Stripe 支付配置
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe 价格ID配置
STRIPE_BASIC_PRICE_ID=price_basic_plan_id
STRIPE_PRO_PRICE_ID=price_pro_plan_id
STRIPE_PREMIUM_PRICE_ID=price_premium_plan_id
```

## Stripe 配置步骤

### 1. 创建 Stripe 账户
- 访问 [stripe.com](https://stripe.com) 注册账户
- 完成账户验证

### 2. 创建产品
在 Stripe Dashboard 中创建以下产品：

#### 基础版 (Basic)
- 价格: ¥9.99/月
- 价格ID: 保存为 `STRIPE_BASIC_PRICE_ID`

#### 专业版 (Pro)
- 价格: ¥19.99/月
- 价格ID: 保存为 `STRIPE_PRO_PRICE_ID`

#### 高级版 (Premium)
- 价格: ¥39.99/月
- 价格ID: 保存为 `STRIPE_PREMIUM_PRICE_ID`

### 3. 配置 Webhook
1. 在 Stripe Dashboard 中进入 Developers > Webhooks
2. 创建新的 Webhook endpoint
3. URL: `https://yourdomain.com/api/stripe/webhook`
4. 选择以下事件：
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 4. 本地开发测试

#### 启动 Stripe CLI
```bash
# 安装 Stripe CLI
stripe login

# 转发 Webhook 到本地
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

#### 测试支付
1. 启动开发服务器: `npm run dev`
2. 访问 `http://localhost:3000/settings`
3. 切换到"订阅与支付"标签页
4. 选择计划进行测试

### 5. 测试卡号
使用以下测试卡号进行测试：

- **成功支付**: 4242 4242 4242 4242
- **需要3D验证**: 4000 0027 6000 3184
- **支付失败**: 4000 0000 0000 0002

## 功能特性

### ✅ 已实现功能
- [x] 订阅计划展示
- [x] Stripe Checkout 集成
- [x] Webhook 处理订阅状态
- [x] 客户门户管理
- [x] 订阅取消功能
- [x] 实时状态更新

### 📋 订阅计划
- **免费版**: 基础功能，5门课程限制
- **基础版**: ¥9.99/月，无限制课程
- **专业版**: ¥19.99/月，高级功能
- **高级版**: ¥39.99/月，企业级功能

### 🔧 管理功能
- 升级/降级订阅
- 查看订阅状态
- 管理支付方式
- 下载发票
- 取消订阅

## 部署注意事项

### 生产环境配置
1. 使用生产环境的 Stripe 密钥
2. 配置正确的 Webhook URL
3. 启用 HTTPS
4. 配置邮件通知

### 数据库迁移
运行以下命令更新数据库：
```bash
# 应用数据库迁移
npm run db:push
```

## 故障排除

### 常见问题
1. **Webhook 验证失败**: 检查 `STRIPE_WEBHOOK_SECRET`
2. **价格ID错误**: 确认价格ID与 Stripe Dashboard 一致
3. **客户创建失败**: 检查用户邮箱是否有效

### 调试技巧
- 查看 Stripe Dashboard 中的事件日志
- 检查服务器日志中的 Webhook 处理
- 使用 Stripe CLI 进行本地测试