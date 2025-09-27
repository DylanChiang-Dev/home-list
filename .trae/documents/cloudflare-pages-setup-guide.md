# Cloudflare Pages 環境變數設置指南

## 問題描述

如果您遇到以下錯誤：
```
API request failed: SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
```

這表示前端正在請求HTML頁面而不是API端點，通常是因為環境變數配置不正確。

## 解決方案

### 步驟 1: 登入 Cloudflare Dashboard

1. 前往 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 登入您的帳戶
3. 選擇 "Pages" 選項卡

### 步驟 2: 找到您的 Pages 項目

1. 在 Pages 列表中找到您的項目（例如：home-list）
2. 點擊項目名稱進入項目詳情頁面

### 步驟 3: 設置環境變數

1. 在項目詳情頁面，點擊 "Settings" 選項卡
2. 在左側菜單中選擇 "Environment variables"
3. 點擊 "Add variable" 按鈕
4. 設置以下環境變數：
   - **Variable name**: `VITE_API_BASE_URL`
   - **Value**: `https://home-list-api.dylan-chiang.workers.dev`
   - **Environment**: 選擇 "Production" 和 "Preview"（兩個都要選）

### 步驟 4: 重新部署

1. 設置完環境變數後，點擊 "Save" 保存
2. 前往 "Deployments" 選項卡
3. 點擊最新部署旁邊的 "Retry deployment" 按鈕
4. 或者推送新的代碼到 Git 倉庫觸發自動部署

## 驗證設置

### 方法 1: 檢查瀏覽器控制台

1. 打開您的 Pages 網站
2. 按 F12 打開開發者工具
3. 查看 Console 選項卡
4. 應該看到類似以下的日誌：
   ```
   Making API request to: https://home-list-api.dylan-chiang.workers.dev/api/auth/me
   Using API_BASE_URL: https://home-list-api.dylan-chiang.workers.dev
   ```

### 方法 2: 測試 API 端點

在瀏覽器中直接訪問：
```
https://home-list-api.dylan-chiang.workers.dev/api/auth/me
```

應該返回 JSON 響應而不是 HTML 頁面。

## 常見問題

### Q: 設置了環境變數但仍然出錯？

A: 確保：
1. 環境變數名稱完全正確：`VITE_API_BASE_URL`
2. 值沒有多餘的空格或字符
3. 已經重新部署了項目
4. 清除瀏覽器緩存

### Q: 如何確認環境變數是否生效？

A: 查看瀏覽器控制台的日誌輸出，應該顯示正確的 API URL。

### Q: 本地開發正常但部署後出錯？

A: 這通常是因為 Cloudflare Pages 沒有讀取到環境變數，請確保按照上述步驟正確設置。

## 技術說明

- Vite 在構建時會將 `import.meta.env.VITE_API_BASE_URL` 替換為實際的環境變數值
- 如果環境變數未設置，會使用默認值：`https://home-list-api.dylan-chiang.workers.dev`
- Cloudflare Pages 需要在部署時設置環境變數，不能在運行時動態讀取

## 聯繫支持

如果按照以上步驟仍然無法解決問題，請檢查：
1. Workers API 是否正常運行
2. CORS 設置是否正確
3. 網絡連接是否正常
