# 超級個體銷售頁 Admin Panel — Design Spec

## Overview

Express server 同時 serve 銷售頁前台和後台管理介面。後台提供表單 UI 管理 9 個動態區塊的 JSON 資料，按「發布」後用 template + JSON 重新 build 出靜態 `index.html`。部署到 Zeabur，協作者登入 `/admin` 即可操作。

## Intentionally Static Sections

以下區塊不透過後台管理，直接寫在 template 裡：
Hero、Stats、這門課適合你嗎、課程大綱（Curriculum）、學習模式、講師介紹、定價（Pricing）、FAQ、Footer

## Architecture

```
solopreneur-landing/
├── server.js              # Express server（入口）
├── package.json
├── build.js               # Template + JSON → index.html
├── data/
│   └── content.json       # 所有動態內容（單一 JSON）
├── template/
│   └── index.ejs          # EJS template（從現有 index.html 轉換）
├── public/
│   ├── index.html          # Build 產出（.gitignore）
│   └── images/
│       └── meetup/         # 小聚照片
├── admin/
│   └── index.html          # 後台管理介面（靜態 HTML + vanilla JS）
└── docs/
```

**Source of truth:** `template/index.ejs` + `data/content.json`。`public/index.html` 是 build 產物，加入 `.gitignore`。

## Routes

| Method | Path | 說明 |
|:-------|:-----|:-----|
| GET | `/` | Serve `public/index.html`（靜態銷售頁） |
| GET | `/health` | 回傳 200（Zeabur readiness check） |
| GET | `/admin` | Serve `admin/index.html`（後台，需登入） |
| POST | `/api/login` | 驗證密碼，設定 session |
| GET | `/api/content` | 取得 `content.json` |
| PUT | `/api/content` | 更新 `content.json`（寫入前備份為 `content.backup.json`） |
| POST | `/api/upload` | 上傳圖片到 `public/images/` |
| POST | `/api/publish` | 執行 build，重新產出 `index.html` |
| GET | `/api/status` | 檢查登入狀態 |

## Authentication

- 一組共用密碼，存在環境變數 `ADMIN_PASSWORD`
- Express session + cookie（`express-session`）
- 所有 `/api/*` 路由（除 `/api/login`、`/api/status`）需要 session 驗證
- `/admin` 頁面在前端檢查登入狀態，未登入顯示密碼輸入框
- `/api/login` 加 rate limit（`express-rate-limit`），防暴力破解

## Data Schema — `content.json`

```json
{
  "talks": [
    {
      "id": "waki",
      "name": "瓦基",
      "topic": "個人事業的商業模式",
      "image": "https://raymondhouch.com/wp-content/uploads/2025/10/solopreneur-waki.jpg",
      "link": "https://raymondhouch.com/lifehacker/guide/waki-solo-business/",
      "alt": "超級個體訪談：瓦基",
      "title": "瓦基是誰？從台積電到知識型超級個體，不追求爆紅，選擇能走 10 年的路"
    }
  ],
  "internationalCases": [
    {
      "id": "case1",
      "image": "",
      "link": "",
      "alt": "",
      "title": ""
    }
  ],
  "media": [
    {
      "id": "media1",
      "type": "video",
      "source": "YouTube · 超真實商談",
      "title": "AI 時代，超級個體會跑贏公司嗎？",
      "image": "https://img.youtube.com/vi/g4r_NmU3fN8/hqdefault.jpg",
      "link": "https://www.youtube.com/watch?v=g4r_NmU3fN8"
    }
  ],
  "threads": [
    {
      "id": "t1",
      "url": "https://www.threads.net/@xiaoyuhinata/post/DOBYwAgD9H1"
    }
  ],
  "testimonials": [
    {
      "id": "esor",
      "name": "Esor",
      "role": "電腦玩物站長",
      "avatar": "",
      "quote": "..."
    }
  ],
  "miniQuotes": [
    {
      "id": "muki",
      "name": "Muki",
      "role": "網站前端工程師",
      "initial": "M",
      "quote": "雷蒙擅長的是..."
    }
  ],
  "studentArticles": [
    {
      "id": "sa1",
      "link": "https://...",
      "image": "...",
      "tag": "學員心得",
      "title": "...",
      "excerpt": "...",
      "meta": "作者 · 2025"
    }
  ],
  "meetupPhotos": [
    {
      "id": "meetup1",
      "label": "第一次小聚",
      "photos": ["images/meetup/IMG_2220.webp"]
    }
  ],
  "coursePreview": [
    {
      "id": "unit01",
      "unit": "單元 01",
      "title": "怎麼跳脫普通人賽道...",
      "videoUrl": "#",
      "thumbnail": "https://img.youtube.com/vi/placeholder01/hqdefault.jpg",
      "displayType": "card"
    }
  ]
}
```

### Empty state handling

當 `internationalCases` 為空陣列時，template 隱藏整個「國外超級個體案例」section header + grid。其他區塊同理。

## Build Process — `build.js`

1. 備份 `public/index.html` → `public/index.html.bak`
2. 讀取 `data/content.json`
3. 讀取 `template/index.ejs`
4. 用 EJS render，把 JSON 資料注入 template
5. 寫入暫存檔 `public/index.tmp.html`
6. Rename `index.tmp.html` → `index.html`（atomic write，避免中途失敗產出損壞 HTML）
7. 回傳成功/失敗

Template 從現有 `index.html` 轉換：把 9 個動態區塊的 hardcoded HTML 替換為 EJS loop（`<% talks.forEach(...) %>`），其餘靜態內容保持不動。

## Admin UI — `admin/index.html`

單頁面，vanilla HTML + JS，不用框架。

### Layout

- 左側 sidebar：9 個區塊的 nav
- 右側 main：對應區塊的表單
- 右上角固定「發布」按鈕

### 每個區塊的操作

| 區塊 | 操作 | 欄位 |
|:-----|:-----|:-----|
| 直播對談 | 新增/編輯/刪除/排序 | name, topic, image URL, link, alt, title |
| 國外案例 | 新增/編輯/刪除/排序 | image URL, link, alt, title |
| 媒體訪談 | 新增/編輯/刪除/排序 | type(影片/文章), source, title, image URL, link |
| Threads | 新增/刪除/排序 | Threads post URL |
| 學員心得 | 新增/編輯/刪除/排序 | name, role, avatar URL, quote |
| 學員短評 | 新增/編輯/刪除/排序 | name, role, initial, quote |
| 學員文章 | 新增/編輯/刪除/排序 | link, image URL, tag, title, excerpt, meta |
| 小聚照片 | 上傳/刪除/排序/分組 | 小聚名稱、圖片檔案（webp） |
| 課程試看 | 新增/編輯/刪除/排序 | unit, title, videoUrl, thumbnail, displayType(card/list) |

排序使用上下箭頭按鈕（↑↓），不用 drag-and-drop（保持簡單）。

### 發布流程

1. 編輯完任何區塊 → 按「儲存」→ PUT `/api/content` 更新 JSON
2. 按右上角「發布」按鈕 → POST `/api/publish` → build 新 HTML
3. 顯示「已發布」成功提示

### Concurrent editing

本版不支援多人同時編輯。假設同一時間只有一人操作後台。

## Dependencies

```json
{
  "express": "^4",
  "express-session": "^1",
  "express-rate-limit": "^7",
  "ejs": "^3",
  "multer": "^1"
}
```

## Deployment — Zeabur

- `package.json` 加 `"start": "node server.js"`
- 環境變數：`ADMIN_PASSWORD`（強密碼）、`SESSION_SECRET`（隨機字串）、`PORT`
- Zeabur auto-detect Node.js，deploy from GitHub
- **Zeabur Volume：** 掛載 `/app/data` 和 `/app/public/images/meetup`，確保 JSON 和上傳圖片在 redeploy 後不遺失
- Session 使用 MemoryStore（重啟後需重新登入，可接受）

## Security

- Admin 密碼存環境變數，不寫在 code 裡
- Session cookie 設 `httpOnly`、`sameSite: strict`
- `/api/login` 加 rate limit（每 IP 每 15 分鐘最多 10 次）
- 圖片上傳限制：只接受 `.webp/.jpg/.png`，最大 5MB
- 上傳檔名 sanitize（multer 自訂 filename，防 path traversal）
- `/api/*` 路由全部需要 session middleware
- PUT `/api/content` 寫入前備份為 `content.backup.json`

## Migration Plan

從現有 `index.html` 遷移：

1. 從 `index.html` 提取 9 個動態區塊的現有資料 → 寫入 `data/content.json`
2. 把 `index.html` 複製為 `template/index.ejs`，動態區塊改為 EJS loop
3. 靜態資源（CSS、JS、固定 HTML）保持不動
4. Threads embed 保留 `data-text-post-permalink` 屬性格式 + embed script tag
5. Build 一次確認產出的 HTML 跟原版一致
6. `public/index.html` 加入 `.gitignore`
