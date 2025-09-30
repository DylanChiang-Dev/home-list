# Cloudflare 服務部署手冊

本手冊將指導您完成家庭任務管理系統在Cloudflare平台上的完整部署，包括前端Pages、D1數據庫、KV存儲和Workers API。

## 1. 前端Pages服務部署 ✅

前端服務已成功部署到Cloudflare Pages。

## 2. 安裝和配置Wrangler CLI

### 2.1 檢查Wrangler安裝狀態
```bash
# 檢查是否已安裝wrangler
wrangler --version
```

### 2.2 安裝Wrangler（如果未安裝）
```bash
# 使用npm安裝
npm install -g wrangler

# 或使用yarn安裝
yarn global add wrangler
```

### 2.3 登錄Cloudflare賬戶
```bash
# 登錄到Cloudflare
wrangler auth login
```

## 3. 創建和配置D1數據庫

### 3.1 創建D1數據庫
```bash
# 切換到workers目錄
cd workers

# 創建D1數據庫
wrangler d1 create home-task-db
```

### 3.2 更新wrangler.toml配置
將創建數據庫後返回的配置信息添加到 `workers/wrangler.toml` 文件中：

```toml
[[d1_databases]]
binding = "DB"
database_name = "home-task-db"
database_id = "your-database-id-here"
```

### 3.3 初始化數據庫Schema
```bash
# 執行數據庫遷移
wrangler d1 execute home-task-db --file=./migrations/schema.sql

# 如果有初始數據
wrangler d1 execute home-task-db --file=./migrations/seed.sql
```

## 4. 創建KV存儲

### 4.1 創建KV命名空間
```bash
# 創建生產環境KV存儲
wrangler kv:namespace create "CACHE"

# 創建預覽環境KV存儲（可選）
wrangler kv:namespace create "CACHE" --preview
```

### 4.2 更新wrangler.toml配置
將KV配置添加到 `workers/wrangler.toml` 文件中：

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id-here"
preview_id = "your-preview-kv-namespace-id-here"
```

## 5. 配置環境變量

### 5.1 設置生產環境變量
```bash
# 設置JWT密鑰
wrangler secret put JWT_SECRET

# 設置環境標識
wrangler secret put ENVIRONMENT

# 設置其他必要的環境變量
wrangler secret put API_BASE_URL
```

### 5.2 驗證環境變量
```bash
# 列出所有已設置的secrets
wrangler secret list
```

## 6. 部署Workers API

### 6.1 構建和部署
```bash
# 確保在workers目錄下
cd workers

# 安裝依賴
npm install

# 構建項目
npm run build

# 部署到Cloudflare Workers
npm run deploy
```

### 6.2 驗證部署
```bash
# 檢查部署狀態
wrangler deployments list

# 查看Worker日誌
wrangler tail
```

## 7. 驗證部署結果

### 7.1 測試API端點
```bash
# 測試健康檢查端點
curl https://your-worker-domain.workers.dev/health

# 測試認證端點
curl -X POST https://your-worker-domain.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### 7.2 測試數據庫連接
```bash
# 查看D1數據庫表
wrangler d1 execute home-task-db --command="SELECT name FROM sqlite_master WHERE type='table';"

# 測試數據查詢
wrangler d1 execute home-task-db --command="SELECT COUNT(*) FROM users;"
```

### 7.3 測試KV存儲
```bash
# 寫入測試數據
wrangler kv:key put --binding=CACHE "test-key" "test-value"

# 讀取測試數據
wrangler kv:key get --binding=CACHE "test-key"
```

## 8. 前端配置更新

### 8.1 更新API端點
更新前端項目中的API配置，將API_BASE_URL指向新部署的Workers域名：

```typescript
// src/utils/api.ts
const API_BASE_URL = 'https://your-worker-domain.workers.dev';
```

### 8.2 重新部署前端
```bash
# 在項目根目錄
npm run build

# 部署到Cloudflare Pages
npx wrangler pages deploy dist --project-name=home-task-frontend
```

## 9. 故障排除

### 9.1 常見問題

**問題1：D1數據庫連接失敗**
- 檢查wrangler.toml中的數據庫配置
- 確認數據庫ID正確
- 驗證schema是否正確執行

**問題2：KV存儲訪問失敗**
- 檢查KV命名空間ID
- 確認binding名稱匹配
- 驗證權限設置

**問題3：Workers部署失敗**
- 檢查代碼語法錯誤
- 確認所有依賴已安裝
- 查看部署日誌：`wrangler tail`

### 9.2 調試命令
```bash
# 查看Worker日誌
wrangler tail

# 本地開發模式
wrangler dev

# 檢查配置
wrangler whoami
wrangler kv:namespace list
wrangler d1 list
```

## 10. 部署檢查清單

- [ ] Wrangler CLI已安裝並登錄
- [ ] D1數據庫已創建並配置
- [ ] 數據庫schema已初始化
- [ ] KV存儲已創建並配置
- [ ] 環境變量已設置
- [ ] Workers API已部署
- [ ] 前端API配置已更新
- [ ] 所有服務功能測試通過

## 11. 後續維護

### 11.1 監控和日誌
- 使用Cloudflare Dashboard監控Workers性能
- 定期檢查D1數據庫使用情況
- 監控KV存儲容量

### 11.2 更新部署
```bash
# 更新Workers
cd workers
npm run deploy

# 更新前端
npm run build
npx wrangler pages deploy dist
```

---

**注意事項：**
1. 請確保所有敏感信息（如JWT_SECRET）使用wrangler secret管理
2. 定期備份D1數據庫數據
3. 監控Cloudflare使用配額，避免超出免費額度
4. 建議設置CI/CD流程自動化部署過程