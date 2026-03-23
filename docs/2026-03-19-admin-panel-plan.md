# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Express-based admin panel that manages 9 dynamic content sections of the solopreneur landing page via JSON + EJS templates, deployed to Zeabur.

**Architecture:** Express server serves static landing page at `/` and admin UI at `/admin`. Content stored in `data/content.json`. Admin edits JSON via API, clicks publish to rebuild `public/index.html` from `template/index.ejs` + JSON.

**Tech Stack:** Node.js, Express 4, EJS 3, express-session, express-rate-limit, multer, vanilla HTML/JS admin UI.

**Spec:** `docs/2026-03-19-admin-panel-design.md`

**Working directory:** `/Users/hyh/Island of Ideas/300 Entities/Projects/LMSS/solopreneur-landing/`

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `data/content.json` (empty structure)

- [ ] **Step 1: Initialize package.json**

```bash
cd "/Users/hyh/Island of Ideas/300 Entities/Projects/LMSS/solopreneur-landing"
npm init -y
```

Then edit `package.json`:
```json
{
  "name": "solopreneur-landing",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node server.js",
    "build": "node build.js"
  },
  "dependencies": {
    "ejs": "^3.1.10",
    "express": "^4.21.0",
    "express-rate-limit": "^7.4.0",
    "express-session": "^1.18.0",
    "multer": "^1.4.5-lts.1"
  }
}
```

- [ ] **Step 2: Create .gitignore**

```
node_modules/
public/index.html
.env
data/content.backup.json
public/index.html.bak
```

- [ ] **Step 3: Create .env.example**

```
ADMIN_PASSWORD=your-strong-password
SESSION_SECRET=random-string-here
PORT=3000
```

- [ ] **Step 4: Create empty content.json structure**

Create `data/content.json` — extract all current dynamic data from `index.html` into this file. The 9 sections are: `talks`, `internationalCases`, `media`, `threads`, `testimonials`, `miniQuotes`, `studentArticles`, `meetupPhotos`, `coursePreview`.

Read the current `index.html` to extract:
- 3 talks (瓦基, 周加恩, 藍諾) from the `.talks-article-card` elements
- 0 internationalCases (empty array)
- 4 media items from `.media-card` elements
- 8 threads URLs from `blockquote.text-post-media` elements
- 4+ testimonials from `.testimonial-card` elements
- 3 miniQuotes (Muki, Tobie, 思誼) from `.mini-quote` elements
- 3 studentArticles from `.article-card` elements
- 30 meetupPhotos grouped under "第一次小聚" from `.meetup-thumb` elements
- 10 coursePreview items (3 card + 7 list) from `.course-preview-card` and `.course-preview-list-item` elements

- [ ] **Step 5: Install dependencies**

```bash
npm install
```

- [ ] **Step 6: Commit**

```bash
git add package.json .gitignore .env.example data/content.json
git commit -m "feat: scaffold admin panel project with content.json"
```

---

### Task 2: Build Script + EJS Template

**Files:**
- Create: `build.js`
- Create: `template/index.ejs` (copy from `index.html`, replace 9 dynamic sections with EJS loops)
- Create: `public/` directory (move `images/` into it)

- [ ] **Step 1: Create build.js**

Create `build.js`:
```javascript
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const DATA_PATH = path.join(__dirname, 'data', 'content.json');
const TEMPLATE_PATH = path.join(__dirname, 'template', 'index.ejs');
const OUTPUT_PATH = path.join(__dirname, 'public', 'index.html');
const TMP_PATH = path.join(__dirname, 'public', 'index.tmp.html');
const BAK_PATH = path.join(__dirname, 'public', 'index.html.bak');

function build() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const html = ejs.render(template, data, { filename: TEMPLATE_PATH });

  // Backup existing
  if (fs.existsSync(OUTPUT_PATH)) {
    fs.copyFileSync(OUTPUT_PATH, BAK_PATH);
  }

  // Atomic write
  fs.writeFileSync(TMP_PATH, html, 'utf8');
  fs.renameSync(TMP_PATH, OUTPUT_PATH);

  return { success: true };
}

if (require.main === module) {
  try {
    build();
    console.log('Build complete: public/index.html');
  } catch (err) {
    console.error('Build failed:', err.message);
    process.exit(1);
  }
}

module.exports = { build };
```

- [ ] **Step 2: Create template/index.ejs**

Copy current `index.html` to `template/index.ejs`. Then replace these 9 dynamic sections with EJS loops:

**Section 1: talks** — Replace hardcoded `.talks-article-card` elements (inside the first `.talks-articles` div after "超級個體直播對談"):
```ejs
<div class="talks-articles">
  <% talks.forEach(function(talk) { %>
  <a href="<%= talk.link %>" target="_blank" class="talks-article-card">
    <div class="talks-article-thumb"><img src="<%= talk.image %>" alt="<%= talk.alt %>"></div>
    <div class="talks-article-body sr-only">
      <div class="talks-article-title"><%= talk.title %></div>
    </div>
  </a>
  <% }); %>
</div>
```

**Section 2: internationalCases** — Replace the empty `.talks-articles` div after "國外超級個體案例":
```ejs
<% if (internationalCases.length > 0) { %>
<div style="max-width:var(--max-width);margin:4rem auto 1.25rem;">
  <div class="section-label">國外超級個體案例</div>
  <h2 class="section-heading" style="color:var(--cream);">他們怎麼做到的？</h2>
</div>
<div class="talks-articles">
  <% internationalCases.forEach(function(c) { %>
  <a href="<%= c.link %>" target="_blank" class="talks-article-card">
    <div class="talks-article-thumb"><img src="<%= c.image %>" alt="<%= c.alt %>"></div>
    <div class="talks-article-body sr-only">
      <div class="talks-article-title"><%= c.title %></div>
    </div>
  </a>
  <% }); %>
</div>
<% } %>
```

**Section 3: media** — Replace `.media-card` elements:
```ejs
<div class="media-grid">
  <% media.forEach(function(m) { %>
  <a href="<%= m.link %>" target="_blank" class="media-card">
    <div class="media-card-thumb">
      <img src="<%= m.image %>" alt="">
      <% if (m.type === 'video') { %><div class="media-card-play"></div><% } %>
    </div>
    <div class="media-card-body">
      <div class="media-card-type media-card-type--<%= m.type %>"><%= m.type === 'video' ? '▶ 影片' : '✎ 文章' %></div>
      <div class="media-card-source"><%= m.source %></div>
      <div class="media-card-title"><%= m.title %></div>
    </div>
  </a>
  <% }); %>
</div>
```

**Section 4: threads** — Replace `blockquote` elements:
```ejs
<div class="threads-grid" id="threads-grid">
  <% threads.forEach(function(t) { %>
  <blockquote class="text-post-media" data-text-post-permalink="<%= t.url %>" data-text-post-version="0"></blockquote>
  <% }); %>
</div>
<script async src="https://www.threads.net/embed.js"></script>
```

**Section 5: testimonials** — Replace `.testimonial-card` elements:
```ejs
<div class="testimonial-grid">
  <% testimonials.forEach(function(t) { %>
  <div class="testimonial-card">
    <div class="testimonial-quote">「<%= t.quote %>」</div>
    <div class="testimonial-author">
      <div class="testimonial-avatar"><% if (t.avatar) { %><img src="<%= t.avatar %>" alt="<%= t.name %>"><% } %></div>
      <div>
        <div class="testimonial-author-name"><%= t.name %></div>
        <div class="testimonial-author-role"><%= t.role %></div>
      </div>
    </div>
  </div>
  <% }); %>
</div>
```

**Section 6: miniQuotes** — Replace `.mini-quote` elements (inside pricing section):
```ejs
<div class="mini-quotes" style="max-width:var(--max-width);margin:2.5rem auto 0;display:flex;flex-wrap:wrap;gap:1rem;justify-content:flex-start;">
  <% miniQuotes.forEach(function(q) { %>
  <div class="mini-quote" style="background:rgba(0,0,0,0.04);">
    <div class="mini-quote-avatar"><%= q.initial %></div>
    <div class="mini-quote-content">
      <p class="mini-quote-text" style="color:rgba(0,0,0,0.6);">「<%= q.quote %>」</p>
      <div class="mini-quote-author" style="color:rgba(0,0,0,0.35);"><%= q.name %> · <%= q.role %></div>
    </div>
  </div>
  <% }); %>
</div>
```

**Section 7: studentArticles** — Replace `.article-card` elements:
```ejs
<div class="article-grid">
  <% studentArticles.forEach(function(a) { %>
  <a href="<%= a.link %>" target="_blank" class="article-card">
    <% if (a.image) { %>
    <img class="article-card-img" src="<%= a.image %>" alt="">
    <% } else { %>
    <div class="article-card-img-placeholder">文章封面圖</div>
    <% } %>
    <div class="article-card-body">
      <div class="article-card-tag"><%= a.tag %></div>
      <div class="article-card-title"><%= a.title %></div>
      <div class="article-card-excerpt"><%= a.excerpt %></div>
      <div class="article-card-meta"><%= a.meta %></div>
    </div>
  </a>
  <% }); %>
</div>
```

**Section 8: meetupPhotos** — Replace `.meetup-panel` elements:
```ejs
<% meetupPhotos.forEach(function(meetup, mi) { %>
<div class="meetup-panel<%= mi === 0 ? ' active' : '' %>" data-meetup="<%= mi %>">
  <div class="meetup-gallery">
    <% meetup.photos.forEach(function(photo, pi) { %>
    <div class="meetup-thumb<%= pi >= 6 ? ' hidden' : '' %>" onclick="openLightbox(<%= pi %>)"><img src="<%= photo %>" alt="超級個體小聚" loading="lazy"></div>
    <% }); %>
  </div>
  <button class="meetup-show-more" onclick="showMorePhotos(this)">顯示更多照片（共 <%= meetup.photos.length %> 張）</button>
</div>
<% }); %>
```

Also update the meetup select dropdown:
```ejs
<select class="meetup-select" onchange="switchMeetup(this.value)">
  <% meetupPhotos.forEach(function(meetup, mi) { %>
  <option value="<%= mi %>"><%= meetup.label %></option>
  <% }); %>
</select>
```

**Section 9: coursePreview** — Replace card + list items:
```ejs
<div class="course-preview-grid">
  <% coursePreview.filter(function(c) { return c.displayType === 'card'; }).forEach(function(c) { %>
  <a class="course-preview-card" href="<%= c.videoUrl %>">
    <div class="course-preview-thumb">
      <img src="<%= c.thumbnail %>" alt="">
      <div class="course-preview-play"><div class="course-preview-play-btn"></div></div>
    </div>
    <div class="course-preview-info">
      <div class="course-preview-num"><%= c.unit %></div>
      <div class="course-preview-title"><%= c.title %></div>
    </div>
  </a>
  <% }); %>
</div>
<div class="course-preview-list">
  <% coursePreview.filter(function(c) { return c.displayType === 'list'; }).forEach(function(c) { %>
  <a class="course-preview-list-item" href="<%= c.videoUrl %>">
    <span class="course-preview-list-num"><%= c.unit %></span>
    <span class="course-preview-list-title"><%= c.title %></span>
  </a>
  <% }); %>
</div>
```

- [ ] **Step 3: Move images into public/**

```bash
mkdir -p public
mv images public/
```

Update `template/index.ejs` — all `images/` paths already relative, should work from `public/`.

- [ ] **Step 4: Run initial build and verify**

```bash
node build.js
```

Open `public/index.html` in browser, compare with original `index.html` to verify they look identical.

- [ ] **Step 5: Commit**

```bash
git add build.js template/ public/images/
git commit -m "feat: add build script and EJS template"
```

---

### Task 3: Express Server

**Files:**
- Create: `server.js`

- [ ] **Step 1: Create server.js**

```javascript
const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { build } = require('./build');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'strict' }
}));

// Static files
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => res.sendStatus(200));

// Admin UI
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// Login rate limit
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts' }
});

// API: Login
app.post('/api/login', loginLimiter, (req, res) => {
  if (req.body.password === process.env.ADMIN_PASSWORD) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

// API: Auth status
app.get('/api/status', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

// API: Get content
app.get('/api/content', requireAuth, (req, res) => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'content.json'), 'utf8'));
  res.json(data);
});

// API: Update content
app.put('/api/content', requireAuth, (req, res) => {
  const dataPath = path.join(__dirname, 'data', 'content.json');
  const backupPath = path.join(__dirname, 'data', 'content.backup.json');
  // Backup before writing
  if (fs.existsSync(dataPath)) {
    fs.copyFileSync(dataPath, backupPath);
  }
  fs.writeFileSync(dataPath, JSON.stringify(req.body, null, 2), 'utf8');
  res.json({ success: true });
});

// API: Upload image
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'public', 'images', 'meetup'),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.webp', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No valid file' });
  res.json({ path: `images/meetup/${req.file.filename}` });
});

// API: Publish
app.post('/api/publish', requireAuth, (req, res) => {
  try {
    build();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

- [ ] **Step 2: Test server starts**

```bash
ADMIN_PASSWORD=test123 node server.js
```

Visit `http://localhost:3000` — should show the landing page.
Visit `http://localhost:3000/health` — should return 200.

- [ ] **Step 3: Commit**

```bash
git add server.js
git commit -m "feat: add Express server with API routes"
```

---

### Task 4: Admin UI

**Files:**
- Create: `admin/index.html`

- [ ] **Step 1: Create admin/index.html**

Single-page admin UI with:
- Login screen (password input)
- Left sidebar with 9 section nav items
- Right main area with forms for each section
- Fixed "發布" button top-right
- Each section: list of items + add/edit/delete/reorder (↑↓ arrows)
- Save button per section → PUT `/api/content`
- Publish button → POST `/api/publish`

The admin HTML is a self-contained file with inline CSS and JS (vanilla, no framework). Key features:

**Login flow:**
- On load, fetch `/api/status`
- If not authenticated, show password form
- On submit, POST `/api/login` with password
- On success, fetch `/api/content` and render sections

**Section rendering:**
- Each section has a `renderSection(sectionName)` function
- Items displayed as compact rows with edit/delete/↑↓ buttons
- "新增" button at top of each section
- Edit opens inline form fields
- Changes stored in local JS state until "儲存" is clicked

**Save flow:**
- "儲存" button → PUT `/api/content` with full JSON state
- Show success/error toast

**Publish flow:**
- "發布" button → POST `/api/publish`
- Show "已發布" success toast

**Image upload (meetup photos):**
- File input in meetup section
- On select, POST `/api/upload` with FormData
- On success, add returned path to meetup photos array

Style: compact, dark sidebar, clean forms. Functional over pretty.

- [ ] **Step 2: Test admin UI**

```bash
ADMIN_PASSWORD=test123 node server.js
```

1. Visit `http://localhost:3000/admin`
2. Enter password "test123" → should see admin panel
3. Navigate between 9 sections
4. Edit an item, click 儲存 → verify `data/content.json` updated
5. Click 發布 → verify `public/index.html` rebuilt
6. Visit `http://localhost:3000` → verify changes visible

- [ ] **Step 3: Commit**

```bash
git add admin/
git commit -m "feat: add admin UI with CRUD for all 9 sections"
```

---

### Task 5: Cleanup + Deploy Prep

**Files:**
- Modify: `.gitignore`
- Delete: root `index.html` (replaced by `public/index.html` via build)

- [ ] **Step 1: Remove old index.html from root**

The original `index.html` is now split into `template/index.ejs` (source) + `public/index.html` (build output). Remove the root copy.

```bash
rm index.html
```

- [ ] **Step 2: Run full build and verify**

```bash
ADMIN_PASSWORD=test123 node server.js
```

1. Visit `http://localhost:3000` — landing page works
2. Visit `http://localhost:3000/admin` — login, edit, save, publish cycle works
3. All 9 dynamic sections render correctly

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete admin panel — ready for Zeabur deploy"
```

- [ ] **Step 4: Deploy to Zeabur**

1. Push to GitHub
2. Create Zeabur service from repo
3. Set environment variables: `ADMIN_PASSWORD`, `SESSION_SECRET`, `PORT`
4. Create Zeabur Volumes:
   - Mount `/app/data` for persistent JSON storage
   - Mount `/app/public/images/meetup` for uploaded photos
5. Deploy and verify
