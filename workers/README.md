# Home List Workers API

基于 Cloudflare Workers + Hono + D1 的家庭任务管理系统后端 API。

## 功能特性

- 🔐 用户认证与授权 (JWT)
- 👨‍👩‍👧‍👦 家庭管理系统
- ✅ 任务管理与分配
- 🔗 邀请码系统
- 📊 数据统计与分析
- 🔄 localStorage 到 D1 数据迁移
- 🚀 高性能边缘计算

## 技术栈

- **Runtime**: Cloudflare Workers
- **Framework**: Hono.js
- **Database**: Cloudflare D1 (SQLite)
- **Cache**: Cloudflare KV
- **Language**: TypeScript
- **Testing**: Vitest

## 项目结构

```
workers/
├── src/
│   ├── routes/          # API 路由
│   │   ├── auth.ts      # 认证相关
│   │   ├── tasks.ts     # 任务管理
│   │   ├── family.ts    # 家庭管理
│   │   └── migration.ts # 数据迁移
│   ├── middleware/      # 中间件
│   │   └── auth.ts      # JWT 认证中间件
│   ├── models/          # 数据模型
│   │   └── types.ts     # TypeScript 类型定义
│   ├── utils/           # 工具函数
│   │   └── helpers.ts   # 辅助函数
│   └── index.ts         # 入口文件
├── schema.sql           # 数据库架构
├── wrangler.toml        # Cloudflare 配置
├── package.json         # 项目依赖
└── README.md           # 项目说明
```

## 快速开始

### 1. 安装依赖

```bash
cd workers
npm install
```

### 2. 配置环境变量

复制 `wrangler.toml` 并配置必要的环境变量：

```toml
[env.development.vars]
JWT_SECRET = "your-jwt-secret-key"
ENVIRONMENT = "development"
CORS_ORIGIN = "http://localhost:5173"
```

### 3. 创建 D1 数据库

```bash
# 创建数据库
npx wrangler d1 create home-list-db

# 执行数据库迁移
npx wrangler d1 execute home-list-db --file=./schema.sql
```

### 4. 创建 KV 命名空间

```bash
npx wrangler kv:namespace create "HOME_LIST_KV"
```

### 5. 本地开发

```bash
npm run dev
```

### 6. 部署到生产环境

```bash
npm run deploy
```

## API 文档

### 认证相关 `/api/auth`

- `POST /register` - 用户注册
- `POST /login` - 用户登录
- `GET /me` - 获取当前用户信息
- `PUT /profile` - 更新用户资料
- `POST /change-password` - 修改密码
- `POST /refresh` - 刷新 Token

### 任务管理 `/api/tasks`

- `GET /` - 获取任务列表
- `GET /:id` - 获取任务详情
- `POST /` - 创建任务
- `PUT /:id` - 更新任务
- `DELETE /:id` - 删除任务
- `GET /stats` - 获取任务统计

### 家庭管理 `/api/family`

- `POST /` - 创建家庭
- `GET /:id` - 获取家庭信息
- `PUT /:id` - 更新家庭信息
- `POST /:id/invite` - 生成邀请码
- `POST /join` - 使用邀请码加入家庭
- `POST /leave` - 退出家庭
- `DELETE /:id/members/:memberId` - 移除成员
- `POST /:id/transfer` - 转让管理权限
- `GET /:id/invites` - 获取邀请码列表

### 数据迁移 `/api/migration`

- `POST /migrate` - 执行数据迁移
- `GET /history` - 获取迁移历史
- `POST /validate` - 验证数据格式

## 数据库架构

### 用户表 (users)
- `id` - 用户ID (UUID)
- `name` - 用户姓名
- `email` - 邮箱地址 (唯一)
- `password` - 密码哈希
- `family_id` - 所属家庭ID
- `role` - 角色 (admin/member)
- `created_at` - 创建时间
- `updated_at` - 更新时间

### 家庭表 (families)
- `id` - 家庭ID (UUID)
- `name` - 家庭名称
- `description` - 家庭描述
- `admin_id` - 管理员ID
- `created_at` - 创建时间
- `updated_at` - 更新时间

### 任务表 (tasks)
- `id` - 任务ID (UUID)
- `title` - 任务标题
- `description` - 任务描述
- `assigned_to` - 分配给谁
- `assigned_by` - 分配者
- `family_id` - 所属家庭
- `status` - 状态 (pending/in_progress/completed)
- `priority` - 优先级 (low/medium/high)
- `due_date` - 截止日期
- `completed_at` - 完成时间
- `created_at` - 创建时间
- `updated_at` - 更新时间

### 邀请码表 (invite_codes)
- `id` - 邀请码ID (UUID)
- `code` - 邀请码 (8位)
- `family_id` - 家庭ID
- `used_by` - 使用者ID
- `expires_at` - 过期时间
- `created_at` - 创建时间

## 环境变量

| 变量名 | 描述 | 示例 |
|--------|------|------|
| `JWT_SECRET` | JWT 签名密钥 | `your-secret-key` |
| `ENVIRONMENT` | 运行环境 | `development/production` |
| `CORS_ORIGIN` | CORS 允许的源 | `http://localhost:5173` |

## 测试

```bash
# 运行测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 类型检查
npm run type-check
```

## 部署

### 开发环境

```bash
npm run dev
```

### 生产环境

```bash
# 构建
npm run build

# 部署
npm run deploy
```

## 监控与日志

- 使用 Cloudflare Dashboard 查看 Workers 运行状态
- 通过 `wrangler tail` 查看实时日志
- KV 存储迁移历史和操作日志

## 安全考虑

- JWT Token 过期时间设置
- 密码哈希存储
- CORS 配置
- 输入验证和清理
- SQL 注入防护
- 权限控制

## 性能优化

- 数据库索引优化
- KV 缓存策略
- 分页查询
- 边缘计算优势

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 D1 数据库配置
   - 确认 wrangler.toml 中的绑定设置

2. **JWT 验证失败**
   - 检查 JWT_SECRET 环境变量
   - 确认 Token 格式和过期时间

3. **CORS 错误**
   - 检查 CORS_ORIGIN 配置
   - 确认前端域名设置

### 调试命令

```bash
# 查看实时日志
npx wrangler tail

# 本地调试
npx wrangler dev --local

# 检查配置
npx wrangler whoami
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 更新日志

### v1.0.0
- 初始版本发布
- 基础认证功能
- 家庭和任务管理
- 数据迁移功能