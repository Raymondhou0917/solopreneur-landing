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
