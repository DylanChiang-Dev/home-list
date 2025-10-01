# 中国地区访问优化指南

## 已实施的优化措施

### 1. 前端优化

#### API 请求超时优化
- **默认超时**: 从 30 秒缩短到 8 秒
- **快速重试**: 从 15 秒缩短到 5 秒
- **健康检查**: 从 10 秒缩短到 5 秒
- **重试次数**: 减少到 2 次,快速失败并切换端点

#### 首次加载优化
- 添加网络状态检测组件 ([src/components/NetworkStatus.tsx](src/components/NetworkStatus.tsx))
- 登录页面首次加载时快速检测网络 ([src/pages/Login.tsx](src/pages/Login.tsx))
- 显示友好的加载提示和离线警告
- 网络失败时禁用登录按钮

#### 用户体验优化
- 加载骨架屏组件 ([src/components/LoadingScreen.tsx](src/components/LoadingScreen.tsx))
- 网络状态实时反馈
- 区分"离线"和"网络慢"状态

### 2. 后端优化

#### Cloudflare Workers 配置
- 健康检查端点添加缓存头 (60秒)
- CORS 预检请求缓存 24 小时,减少 OPTIONS 请求
- 快速响应设计,不查询数据库

#### 配置文件
- [workers/wrangler.toml](workers/wrangler.toml): 添加中国地区优化注释

## 进一步优化建议

### 立即可行的方案

#### 1. 使用自定义域名 + Cloudflare CDN
```bash
# 在 Cloudflare Dashboard 中:
# 1. 添加自定义域名到你的 Workers
# 2. 启用 Cloudflare CDN
# 3. 配置以下优化:
#    - 启用 Brotli 压缩
#    - 设置缓存规则
#    - 启用 HTTP/3 (QUIC)
```

在 `wrangler.toml` 中配置路由:
```toml
[env.production]
route = "api.your-domain.com/*"
```

#### 2. 前端静态资源优化
```bash
# 构建时启用压缩
npm run build

# 部署到 Cloudflare Pages 时:
# - 自动启用全球 CDN
# - HTTP/3 支持
# - 自动压缩
```

#### 3. 使用备用 API 端点
如果 Cloudflare Workers 在中国不稳定,考虑添加备用端点:

在 [src/utils/apiConfig.ts](src/utils/apiConfig.ts) 中添加:
```typescript
{
  name: 'China Backup (Aliyun/Tencent Cloud)',
  baseUrl: 'https://api-cn.your-domain.com',
  priority: 1,
  healthCheck: '/health',
  timeout: 3000,
  retries: 2
}
```

### 付费方案 (推荐)

#### 1. Cloudflare Argo Smart Routing
- **价格**: $5/月 + $0.1/GB
- **效果**: 智能路由,绕过拥塞节点
- **启用方法**:
  ```bash
  # 在 Cloudflare Dashboard:
  # Traffic > Argo Smart Routing > Enable
  ```

#### 2. Cloudflare China Network (Enterprise)
- **价格**: 联系 Cloudflare 销售
- **效果**: 直接使用中国境内 CDN 节点
- **适用**: 需要 ICP 备案的域名

#### 3. 使用中国云服务商
- **阿里云函数计算** (Alibaba Cloud Function Compute)
- **腾讯云云函数** (Tencent Cloud SCF)
- **华为云 FunctionGraph**

迁移步骤:
1. 将 Workers 代码适配到对应平台
2. 部署 D1 数据库到云 SQL
3. 修改前端 API 配置

### 免费优化方案

#### 1. 减少 API 调用次数
```typescript
// 使用本地缓存
const cache = new Map();

export const apiGetWithCache = async <T>(endpoint: string, ttl = 60000) => {
  const cached = cache.get(endpoint);
  if (cached && Date.now() - cached.time < ttl) {
    return cached.data;
  }

  const result = await apiGet<T>(endpoint);
  cache.set(endpoint, { data: result, time: Date.now() });
  return result;
};
```

#### 2. 实现离线优先策略
```typescript
// 使用 Service Worker + IndexedDB
// 1. 离线存储任务数据
// 2. 网络恢复时同步
// 3. 参考 PWA 最佳实践
```

#### 3. 压缩请求和响应体
```typescript
// 在 Workers 中启用压缩
app.use('*', compress({
  threshold: 1024, // 大于 1KB 才压缩
}));
```

## 测试和监控

### 本地测试
```bash
# 测试网络超时
npm run dev

# 在浏览器控制台:
# Network > Throttling > Slow 3G

# 检查:
# - 首次加载时间
# - 登录响应时间
# - 网络失败时的提示
```

### 生产环境监控
```bash
# 部署后测试
npx wrangler tail

# 查看实时日志:
# - 请求延迟
# - 错误率
# - 地理位置
```

### 中国地区测试工具
- **17CE**: https://www.17ce.com/ (多地区 ping 测试)
- **站长工具**: https://tool.chinaz.com/speedtest (国内测速)
- **阿里云拨测**: 真实用户体验监控

## 常见问题

### Q: 为什么中国地区访问 Cloudflare Workers 慢?
A: Cloudflare 免费套餐不包含中国 CDN 节点,请求需要绕道海外。建议:
1. 使用自定义域名 + CDN
2. 启用 Argo Smart Routing
3. 考虑使用中国云服务商

### Q: 如何快速验证优化效果?
A: 在浏览器开发者工具中:
1. Network > Throttling > Slow 3G
2. 刷新页面
3. 检查首次加载时间 (应在 10 秒内)

### Q: 如何选择最佳方案?
A: 根据预算和需求:
- **免费**: 当前优化 + 自定义域名 CDN
- **小预算** ($5-10/月): Argo Smart Routing
- **中预算** ($50-100/月): 阿里云/腾讯云
- **大预算**: Cloudflare China Network (需 ICP)

## 下一步行动

### 立即执行 (5分钟)
```bash
# 1. 部署优化后的代码
cd workers
npx wrangler deploy

# 2. 测试健康检查
curl -v https://home-list-api.dylan-chiang.workers.dev/health

# 3. 检查响应头是否包含缓存
# Cache-Control: public, max-age=60
```

### 短期优化 (1-2天)
1. 注册自定义域名
2. 配置 Cloudflare DNS
3. 添加 Workers 路由
4. 测试中国地区访问

### 中期优化 (1-2周)
1. 评估 Argo Smart Routing
2. 实现本地缓存策略
3. 添加离线支持
4. 部署到 Cloudflare Pages

### 长期规划 (1个月+)
1. 如果中国用户多,考虑迁移到中国云
2. 实现双端点架构 (海外 + 中国)
3. 根据地理位置自动选择端点

## 相关文件

- [src/utils/apiConfig.ts](src/utils/apiConfig.ts): API 端点配置
- [src/utils/api.ts](src/utils/api.ts): API 请求封装
- [src/pages/Login.tsx](src/pages/Login.tsx): 登录页面网络检测
- [workers/src/index.ts](workers/src/index.ts): Workers 入口文件
- [workers/wrangler.toml](workers/wrangler.toml): Workers 配置

## 参考资料

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Argo Smart Routing](https://www.cloudflare.com/products/argo-smart-routing/)
- [Cloudflare China Network](https://www.cloudflare.com/zh-cn/china-network/)
- [网络性能优化最佳实践](https://web.dev/fast/)
