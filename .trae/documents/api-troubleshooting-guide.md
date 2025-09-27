# API 請求故障排除完整指南

## 問題症狀

當您看到以下錯誤時：
```
API request failed: SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
```

這表示前端正在接收HTML頁面而不是預期的JSON API響應。

## 根本原因分析

### 1. 環境變數配置問題
- **本地開發環境**：`.env` 文件中的 `VITE_API_BASE_URL` 設置不正確
- **Cloudflare Pages**：未在 Pages 項目中設置環境變數

### 2. API端點問題
- Workers API 未正確部署
- API URL 配置錯誤
- CORS 設置問題

### 3. 網絡路由問題
- DNS 解析問題
- CDN 緩存問題
- 防火牆或代理攔截

## 診斷步驟

### 步驟 1: 檢查瀏覽器控制台

打開瀏覽器開發者工具，查看 Console 選項卡：

**正常情況下應該看到：**
```
Making API request to: https://home-list-api.dylan-chiang.workers.dev/api/auth/me
Using API_BASE_URL: https://home-list-api.dylan-chiang.workers.dev
Response content-type: application/json
Response status: 401
```

**異常情況會看到：**
```
Making API request to: https://home-list.pages.dev/api/auth/me
Using API_BASE_URL: undefined
Response content-type: text/html
Received non-JSON response: <!doctype html>...
```

### 步驟 2: 直接測試 API 端點

在瀏覽器中訪問：
```
https://home-list-api.dylan-chiang.workers.dev/api/auth/me
```

**正常響應：**
```json
{"error":"缺少认证token","status":401}
```

**異常響應：**
- 404 錯誤頁面
- HTML 頁面
- 網絡錯誤

### 步驟 3: 檢查環境變數

**本地開發：**
```bash
cat .env
# 應該包含：
# VITE_API_BASE_URL=https://home-list-api.dylan-chiang.workers.dev
```

**Cloudflare Pages：**
1. 登入 Cloudflare Dashboard
2. 進入 Pages 項目
3. Settings → Environment variables
4. 確認 `VITE_API_BASE_URL` 已設置

## 解決方案

### 解決方案 1: 修復環境變數配置

**本地開發：**
```bash
echo "VITE_API_BASE_URL=https://home-list-api.dylan-chiang.workers.dev" > .env
```

**Cloudflare Pages：**
1. 前往 Cloudflare Dashboard
2. Pages → 選擇項目 → Settings → Environment variables
3. 添加變數：
   - Name: `VITE_API_BASE_URL`
   - Value: `https://home-list-api.dylan-chiang.workers.dev`
   - Environment: Production + Preview
4. 重新部署項目

### 解決方案 2: 驗證 Workers API 部署

```bash
cd workers
npx wrangler deploy
```

確認部署成功後測試端點：
```bash
curl https://home-list-api.dylan-chiang.workers.dev/health
```

### 解決方案 3: 清除緩存

**瀏覽器緩存：**
- Chrome: Ctrl+Shift+R (強制刷新)
- 或開發者工具 → Network → Disable cache

**Cloudflare 緩存：**
1. Cloudflare Dashboard → Caching → Purge Cache
2. 選擇 "Purge Everything"

### 解決方案 4: 檢查 CORS 設置

確認 Workers API 中的 CORS 配置：
```typescript
// 在 workers/src/index.ts 中
app.use('*', cors({
  origin: ['https://home-list.pages.dev', 'http://localhost:5173'],
  credentials: true
}));
```

## 預防措施

### 1. 代碼改進

已在 `src/utils/api.ts` 中添加：
- 詳細的錯誤日誌
- Content-Type 檢查
- 更好的錯誤處理

### 2. 監控設置

建議添加：
- API 健康檢查端點
- 錯誤報告系統
- 性能監控

### 3. 部署檢查清單

每次部署前確認：
- [ ] 環境變數已設置
- [ ] Workers API 正常運行
- [ ] CORS 配置正確
- [ ] DNS 解析正常

## 常見問題 FAQ

### Q: 為什麼本地開發正常但部署後出錯？
A: 通常是 Cloudflare Pages 環境變數未設置。本地使用 `.env` 文件，但 Pages 需要在 Dashboard 中設置。

### Q: 設置環境變數後仍然出錯？
A: 確保重新部署了項目。環境變數只在構建時生效，不是運行時。

### Q: API 端點返回 404？
A: 檢查 Workers 是否正確部署，URL 是否正確。

### Q: 如何確認問題已解決？
A: 查看瀏覽器控制台，應該看到正確的 API URL 和 JSON 響應。

## 聯繫支持

如果以上步驟都無法解決問題，請提供：
1. 瀏覽器控制台的完整錯誤日誌
2. 網絡選項卡中的請求詳情
3. 當前的環境變數配置截圖
4. Workers API 的部署狀態

---

**最後更新：** 2024年12月
**版本：** 1.0
