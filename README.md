# Solopreneur Landing

《超級個體工作術》課程銷售頁，含後台管理系統。

- 正式網址：https://solopreneur.lifehacker.tw/
- 後台：https://solopreneur.lifehacker.tw/admin

## Tech Stack

- **Template Engine** — EJS（`template/index.ejs` → `public/index.html`）
- **Server** — Express.js + express-session
- **Admin Panel** — 純前端 SPA（`admin/index.html`），密碼驗證，自動儲存 + 發布
- **Build** — `node build.js`，EJS + JSON 資料合併輸出靜態 HTML
- **Image Upload** — Multer（限 5MB，支援 webp/jpg/png）
- **Security** — express-rate-limit（登入限流）、session-based auth
- **Compression** — gzip via `compression` middleware

## 目錄結構

```
├── admin/            # 後台管理 UI
├── data/
│   └── content.json  # 所有內容資料（後台編輯此檔）
├── template/
│   └── index.ejs     # 頁面模板
├── public/           # 靜態檔案（images、build 產出）
├── build.js          # EJS → HTML 建置腳本
├── server.js         # Express server + API
└── .env              # ADMIN_PASSWORD、SESSION_SECRET
```

## 後台可管理區塊

| 區塊 | content.json key | 說明 |
|:-----|:-----------------|:-----|
| 直播對談 | `talks` | 超級個體直播對談影片 |
| 國外案例 | `internationalCases` | 國際超級個體案例 |
| 媒體訪談 | `media` | YouTube 影片、文章 |
| 見證牆 | `testimonialWall` | Threads/Facebook 好評卡片 |
| 學員心得 | `testimonials` | 各界好評引言 |
| 學員短評 | `miniQuotes` | Hero 區塊短評 |
| 學員文章 | `studentArticles` | Substack 上課筆記 |
| 課程試看 | `coursePreview` | YouTube 免費試看單元 |
| CTA 按鈕 | `ctaLinks` | 全站 CTA 連結 |
