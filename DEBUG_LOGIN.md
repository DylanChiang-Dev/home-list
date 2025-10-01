# 登录问题排查指南

## 问题描述
访问 https://list.3331322.xyz/login 登录后直接返回首页,没有登录迹象

## 可能原因

### 1. localStorage 有残留数据
如果 localStorage 中有旧的 `userData`,即使 token 无效,也可能导致问题。

### 2. 账号不存在
测试账号可能不存在于数据库中。

### 3. 路由重定向逻辑
`PublicRoute` 会检查用户状态,如果认为已登录会自动跳转到 dashboard。

## 立即排查步骤

### 步骤 1: 清除浏览器数据

打开浏览器控制台 (F12):

```javascript
// 1. 查看当前存储的数据
console.log('authToken:', localStorage.getItem('authToken'));
console.log('userData:', localStorage.getItem('userData'));

// 2. 清除所有认证数据
localStorage.removeItem('authToken');
localStorage.removeItem('userData');
localStorage.clear();

// 3. 刷新页面
location.reload();
```

### 步骤 2: 检查 API 连接

在控制台运行:

```javascript
// 测试 API 健康检查
fetch('https://home-list-api.dylan-chiang.workers.dev/health')
  .then(r => r.json())
  .then(d => console.log('API健康:', d))
  .catch(e => console.error('API错误:', e));
```

### 步骤 3: 测试登录 API

```javascript
// 测试登录接口 (使用测试账号)
fetch('https://home-list-api.dylan-chiang.workers.dev/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://list.3331322.xyz'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'test123'
  })
})
.then(r => r.json())
.then(d => console.log('登录响应:', d))
.catch(e => console.error('登录错误:', e));
```

如果返回 401 "邮箱或密码错误",说明账号不存在。

### 步骤 4: 创建测试账号

如果测试账号不存在,需要先注册:

1. 访问 https://list.3331322.xyz/register
2. 清除浏览器数据 (localStorage.clear())
3. 刷新页面
4. 注册新账号

或者在控制台测试注册:

```javascript
fetch('https://home-list-api.dylan-chiang.workers.dev/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://list.3331322.xyz'
  },
  body: JSON.stringify({
    name: '测试用户',
    email: 'test@test.com',
    password: 'test123456',
    familyName: '测试家庭',
    registrationType: 'create'
  })
})
.then(r => r.json())
.then(d => console.log('注册响应:', d))
.catch(e => console.error('注册错误:', e));
```

## 常见问题

### Q1: 登录后立即跳转到首页
**原因**: localStorage 有残留的 userData,导致 AuthContext 认为用户已登录
**解决**:
```javascript
localStorage.clear();
location.reload();
```

### Q2: 显示"邮箱或密码错误"
**原因**: 账号不存在或密码错误
**解决**:
1. 确认账号是否存在
2. 使用注册页面创建新账号
3. 或者重置密码

### Q3: CORS 错误
**原因**: 前端域名未在 CORS 白名单
**解决**: 已配置 `list.3331322.xyz`,应该不会有这个问题

### Q4: 网络超时
**原因**: API 连接超时
**解决**:
1. 检查网络连接
2. 查看控制台是否有网络错误
3. 尝试访问 https://home-list-api.dylan-chiang.workers.dev/health

## 推荐操作流程

### 方案 1: 完全重置 (推荐)

```javascript
// 1. 清除所有数据
localStorage.clear();
sessionStorage.clear();

// 2. 刷新页面
location.reload();

// 3. 访问注册页面创建新账号
// https://list.3331322.xyz/register
```

### 方案 2: 创建测试账号

如果数据库是空的,需要创建第一个账号:

```bash
# 使用 curl 测试注册
curl -X POST https://home-list-api.dylan-chiang.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://list.3331322.xyz" \
  -d '{
    "name": "测试用户",
    "email": "test@test.com",
    "password": "test123456",
    "familyName": "测试家庭",
    "registrationType": "create"
  }'
```

然后使用这个账号登录:
- 邮箱: test@test.com
- 密码: test123456

## 查看详细日志

打开浏览器控制台,应该能看到:

```
[API Config] 开始选择最佳API端点...
[API Config] 选择端点: Cloudflare Workers (Primary)
[API] 检测到网络错误... (如果有错误)
```

如果看到大量网络错误,说明 API 连接有问题。

## 数据库检查 (开发者)

如果你有 Workers 访问权限:

```bash
cd workers

# 查看用户表
npx wrangler d1 execute home-list-db \
  --command="SELECT email, name FROM users LIMIT 10"

# 查看家庭表
npx wrangler d1 execute home-list-db \
  --command="SELECT name, id FROM families LIMIT 10"
```

## 临时解决方案

如果问题持续,可以暂时使用:

1. **错误诊断页面**: https://list.3331322.xyz/error-diagnosis
2. **API 测试页面**: https://list.3331322.xyz/api-test

但这两个页面需要登录,所以需要先解决登录问题。

## 需要帮助?

如果以上步骤都无法解决,请提供:

1. 浏览器控制台的完整日志
2. Network 标签中 login 请求的详细信息
3. localStorage 中的所有数据

```javascript
// 获取所有 localStorage 数据
console.log('localStorage:', JSON.stringify(localStorage));

// 获取所有 console 日志
// 右键控制台 > Save as... > 保存日志
```

## 快速修复脚本

复制以下代码到浏览器控制台并运行:

```javascript
(async function() {
  console.log('=== 登录问题诊断 ===');

  // 1. 检查当前存储
  console.log('1. 检查 localStorage:');
  console.log('  authToken:', localStorage.getItem('authToken') ? '存在' : '不存在');
  console.log('  userData:', localStorage.getItem('userData') ? '存在' : '不存在');

  // 2. 清除数据
  console.log('2. 清除所有认证数据...');
  localStorage.clear();
  sessionStorage.clear();

  // 3. 测试 API
  console.log('3. 测试 API 连接...');
  try {
    const health = await fetch('https://home-list-api.dylan-chiang.workers.dev/health');
    const healthData = await health.json();
    console.log('  API 健康状态:', healthData.status);
  } catch (e) {
    console.error('  API 连接失败:', e.message);
  }

  console.log('4. 诊断完成! 现在刷新页面并尝试注册新账号。');
  console.log('   访问: https://list.3331322.xyz/register');

  // 询问是否刷新
  if (confirm('诊断完成! 是否立即刷新页面?')) {
    location.reload();
  }
})();
```

这个脚本会:
1. 检查 localStorage
2. 清除所有认证数据
3. 测试 API 连接
4. 询问是否刷新页面
