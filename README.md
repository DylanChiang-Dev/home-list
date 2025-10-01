# 🏠 Home List - 家庭任務管理系統

一個現代化的家庭任務管理系統，支援多人協作、任務分配、進度追蹤和邀請碼管理。採用 React + TypeScript 前端和 Cloudflare Workers 後端，提供快速、可靠的全球化服務。

[![部署狀態](https://img.shields.io/badge/部署-Cloudflare%20Pages-orange)](https://home-list.pages.dev)
[![後端](https://img.shields.io/badge/後端-Cloudflare%20Workers-blue)](https://workers.cloudflare.com/)
[![授權](https://img.shields.io/badge/授權-MIT-green)](LICENSE)

## ✨ 主要功能

### 👥 家庭管理
- **創建家庭**：註冊時可創建新家庭，自動成為管理員
- **邀請成員**：管理員可生成邀請碼，設定使用次數和有效期限
- **角色管理**：支援管理員（admin）和成員（member）兩種角色
- **成員統計**：即時顯示每位成員的任務完成率和貢獻度

### 📋 任務系統
- **三種任務類型**：
  - **一般任務**：單次完成的普通任務
  - **長期任務**：跨越多天的持續性任務
  - **重複任務**：支援每日、每週、每月、每年的循環任務
- **任務狀態**：待處理（pending）→ 進行中（in_progress）→ 已完成（completed）
- **優先級管理**：高、中、低三個優先級
- **任務分配**：可指派給家庭成員
- **截止日期**：支援日期提醒和逾期標記

### 📅 日曆視圖
- **月曆顯示**：直觀查看當月所有任務
- **任務標記**：不同類型任務以不同顏色標記
- **日期篩選**：點擊日期查看當天任務詳情
- **當天高亮**：清楚顯示今日任務

### 🔧 系統功能
- **多端點容錯**：自動切換 Local → Cloudflare Workers → Mock Server
- **錯誤診斷**：內建錯誤監控和診斷工具
- **API 測試**：網路連線測試和端點健康檢查
- **資料遷移**：支援從 localStorage 遷移到雲端資料庫

## 🚀 技術架構

### 前端技術棧
- **框架**：React 18.3 + TypeScript 5.8
- **路由**：React Router v7
- **狀態管理**：Zustand + Context API
- **樣式**：Tailwind CSS 3.4
- **建置工具**：Vite 6.3
- **圖示**：Lucide React
- **工具庫**：clsx, tailwind-merge

### 後端技術棧
- **運行環境**：Cloudflare Workers
- **框架**：Hono.js
- **資料庫**：Cloudflare D1 (SQLite)
- **快取**：Cloudflare KV
- **認證**：JWT (JSON Web Tokens)
- **密碼加密**：bcryptjs

### 部署平台
- **前端**：Cloudflare Pages
- **後端**：Cloudflare Workers
- **資料庫**：Cloudflare D1
- **全球 CDN**：Cloudflare Edge Network

## 📦 快速開始

### 環境需求
- Node.js 18+
- pnpm 或 npm
- Cloudflare 帳號（用於部署）

### 本地開發

#### 1. 克隆專案
```bash
git clone https://github.com/your-username/home-list.git
cd home-list
```

#### 2. 安裝依賴

**前端：**
```bash
pnpm install
```

**後端：**
```bash
cd workers
pnpm install
```

#### 3. 設定環境變數

建立 `workers/.dev.vars` 檔案：
```env
JWT_SECRET=your-secret-key-here
ENVIRONMENT=development
CORS_ORIGIN=http://localhost:5173,https://home-list.pages.dev
```

#### 4. 初始化資料庫

```bash
cd workers

# 建立 D1 資料庫
npx wrangler d1 create home-list-db

# 執行 schema
npx wrangler d1 execute home-list-db --local --file=./schema.sql

# 執行遷移（如需要）
npx wrangler d1 execute home-list-db --local --file=./migrations/001_update_invite_codes.sql
npx wrangler d1 execute home-list-db --local --file=./migrations/002_alter_invite_codes.sql
```

#### 5. 啟動開發伺服器

**方式一：同時啟動前後端**
```bash
# 回到根目錄
cd ..

# 終端 1：啟動後端
cd workers && npm run dev

# 終端 2：啟動前端
npm run dev
```

**方式二：使用 Mock API**
```bash
npm run dev:full
```

訪問 http://localhost:5173 查看應用

## 🌐 部署指南

### Cloudflare Workers 後端部署

1. **登入 Cloudflare**
```bash
cd workers
npx wrangler login
```

2. **設定 wrangler.toml**
```toml
name = "home-list-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "home-list-db"
database_id = "your-database-id"

[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-id"

[vars]
JWT_SECRET = "your-production-secret"
ENVIRONMENT = "production"
CORS_ORIGIN = "https://home-list.pages.dev"
```

3. **建立生產環境資料庫**
```bash
# 建立 D1 資料庫
npx wrangler d1 create home-list-db

# 執行 schema
npx wrangler d1 execute home-list-db --remote --file=./schema.sql

# 執行遷移
npx wrangler d1 execute home-list-db --remote --file=./migrations/001_update_invite_codes.sql
npx wrangler d1 execute home-list-db --remote --file=./migrations/002_alter_invite_codes.sql
```

4. **部署 Worker**
```bash
npm run deploy
```

### Cloudflare Pages 前端部署

1. **在 Cloudflare Pages 建立專案**
   - 連接 GitHub 儲存庫
   - 選擇分支：`main`

2. **建置設定**
   - 建置命令：`npm run build`
   - 建置輸出目錄：`dist`
   - Root 目錄：`/`（預設）
   - Node 版本：`18` 或更高

3. **環境變數**（可選）
   無需設定環境變數，API 端點已在程式碼中配置

4. **觸發部署**
   - 推送到 `main` 分支自動部署
   - 或在 Cloudflare Dashboard 手動觸發

## 📖 使用說明

### 註冊與登入

#### 創建新家庭
1. 訪問註冊頁面
2. 選擇「創建家庭」
3. 填寫姓名、信箱、密碼和家庭名稱
4. 註冊成功後自動成為管理員

#### 加入現有家庭
1. 訪問註冊頁面
2. 選擇「加入家庭」
3. 填寫姓名、信箱、密碼和邀請碼
4. 註冊成功後加入對應家庭（member 角色）

### 任務管理

#### 建立任務
1. 點擊「新增任務」
2. 選擇任務類型（一般/長期/重複）
3. 填寫任務標題、描述、優先級
4. 選擇指派成員
5. 設定截止日期（可選）
6. 對於重複任務，設定重複規則

#### 更新任務狀態
- 點擊任務卡片的狀態標籤
- 選擇新狀態：待處理 → 進行中 → 已完成

#### 篩選任務
- 按狀態篩選
- 按優先級篩選
- 按任務類型篩選
- 按指派成員篩選

### 家庭管理（僅管理員）

#### 生成邀請碼
1. 進入「家庭管理」→「邀請管理」
2. 點擊「創建邀請碼」
3. 設定最大使用次數（預設 5 次）
4. 邀請碼有效期為 7 天

#### 管理成員
- 查看所有家庭成員
- 查看成員任務統計
- 移除成員（管理員限定）
- 轉移管理員權限

## 🗂️ 專案結構

```
home-list/
├── src/                        # 前端原始碼
│   ├── components/            # React 元件
│   │   ├── Calendar.tsx       # 日曆元件
│   │   ├── TaskCard.tsx       # 任務卡片
│   │   └── ...
│   ├── contexts/              # React Context
│   │   └── AuthContext.tsx    # 認證上下文
│   ├── pages/                 # 頁面元件
│   │   ├── Dashboard.tsx      # 主控台
│   │   ├── Login.tsx          # 登入頁
│   │   ├── Register.tsx       # 註冊頁
│   │   ├── FamilyManagement.tsx  # 家庭管理
│   │   ├── CreateTask.tsx     # 建立任務
│   │   ├── ApiTest.tsx        # API 測試
│   │   └── ErrorDiagnosis.tsx # 錯誤診斷
│   ├── router/                # 路由配置
│   │   └── index.tsx
│   ├── types/                 # TypeScript 類型定義
│   │   ├── task.ts
│   │   └── user.ts
│   ├── utils/                 # 工具函式
│   │   ├── api.ts             # API 請求封裝
│   │   ├── apiConfig.ts       # API 端點配置
│   │   ├── dataConverter.ts   # 資料格式轉換
│   │   ├── taskFilters.ts     # 任務篩選邏輯
│   │   └── errorMonitor.ts    # 錯誤監控
│   ├── App.tsx                # 應用程式進入點
│   └── main.tsx               # React 渲染
├── workers/                    # 後端原始碼
│   ├── src/
│   │   ├── routes/            # API 路由
│   │   │   ├── auth.ts        # 認證路由
│   │   │   ├── tasks.ts       # 任務路由
│   │   │   ├── family.ts      # 家庭管理路由
│   │   │   └── migration.ts   # 資料遷移路由
│   │   ├── middleware/        # 中介層
│   │   │   └── auth.ts        # JWT 認證中介層
│   │   ├── utils/             # 工具函式
│   │   │   └── dataConverter.ts
│   │   └── index.ts           # Worker 進入點
│   ├── migrations/            # 資料庫遷移
│   │   ├── 001_update_invite_codes.sql
│   │   └── 002_alter_invite_codes.sql
│   ├── schema.sql             # 資料庫 Schema
│   └── wrangler.toml          # Cloudflare 配置
├── public/                     # 靜態資源
├── .github/                    # GitHub Actions（可選）
├── package.json               # 前端依賴
├── tsconfig.json              # TypeScript 配置
├── vite.config.ts             # Vite 配置
├── tailwind.config.js         # Tailwind 配置
└── README.md                  # 專案說明
```

## 🔐 安全性

- **密碼加密**：使用 SHA-256 雜湊演算法
- **JWT 認證**：所有 API 請求需要有效的 JWT token
- **SQL 注入防護**：使用 D1 prepared statements
- **CORS 配置**：限制允許的來源
- **角色權限控制**：admin 和 member 分級權限

## 🛠️ 開發工具

### 可用指令

**前端：**
```bash
npm run dev          # 啟動開發伺服器
npm run build        # 建置生產版本
npm run preview      # 預覽生產建置
npm run lint         # 執行 ESLint
npm run check        # TypeScript 類型檢查
npm run dev:full     # 啟動前端 + Mock API
```

**後端：**
```bash
npm run dev          # 啟動本地 Worker
npm run deploy       # 部署到 Cloudflare
npm run build        # 建置（dry run）
```

### 資料庫操作

```bash
# 查詢資料庫
npx wrangler d1 execute home-list-db --command="SELECT * FROM users"

# 本地資料庫
npx wrangler d1 execute home-list-db --local --command="SELECT * FROM tasks"

# 遠端資料庫
npx wrangler d1 execute home-list-db --remote --command="SELECT * FROM families"

# 查看日誌
npx wrangler tail
```

## 📊 資料庫 Schema

### users（使用者）
```sql
- id: 使用者 ID (UUID)
- email: 信箱（唯一）
- password_hash: 密碼雜湊
- name: 姓名
- family_id: 所屬家庭 ID
- role: 角色（admin/member）
- created_at: 建立時間
```

### families（家庭）
```sql
- id: 家庭 ID (UUID)
- name: 家庭名稱
- created_by: 建立者信箱
- created_at: 建立時間
```

### tasks（任務）
```sql
- id: 任務 ID (UUID)
- title: 任務標題
- description: 任務描述
- assignee_id: 指派成員 ID
- creator_id: 建立者 ID
- type: 任務類型（regular/long_term/recurring）
- status: 狀態（pending/in_progress/completed）
- priority: 優先級（high/medium/low）
- due_date: 截止日期
- recurring_rule: 重複規則（JSON）
- created_at: 建立時間
```

### invite_codes（邀請碼）
```sql
- id: 邀請碼 ID (UUID)
- code: 邀請碼（唯一）
- family_id: 家庭 ID
- expires_at: 過期時間
- max_uses: 最大使用次數
- used_count: 已使用次數
- created_at: 建立時間
```

## 🐛 問題排查

### 常見問題

**Q: 登入後看到 401 錯誤？**
A: 清除瀏覽器快取並重新登入，或檢查 JWT_SECRET 是否正確設定。

**Q: 日曆不顯示任務？**
A: 確保已部署最新版本，並清除瀏覽器快取（Cmd/Ctrl + Shift + R）。

**Q: 邀請碼註冊失敗？**
A: 檢查邀請碼是否過期或已達使用次數上限。

**Q: 部署後 API 500 錯誤？**
A: 檢查資料庫遷移是否正確執行，查看 Worker 日誌（`npx wrangler tail`）。

### 錯誤診斷工具

訪問 `/error-diagnosis` 頁面查看：
- 即時錯誤日誌
- 網路請求狀態
- API 端點健康檢查
- 錯誤測試功能

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📝 授權

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

## 🙏 致謝

- [React](https://react.dev/) - UI 框架
- [Cloudflare](https://www.cloudflare.com/) - 部署平台
- [Hono](https://hono.dev/) - 輕量級 Web 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Lucide](https://lucide.dev/) - 圖示庫
- [Vite](https://vitejs.dev/) - 建置工具

## 📧 聯絡方式

專案維護者：[Your Name]
- GitHub: [@your-username](https://github.com/your-username)
- Email: your.email@example.com

專案連結：[https://github.com/your-username/home-list](https://github.com/your-username/home-list)

---

⭐ 如果這個專案對你有幫助，請給個星星支持一下！
