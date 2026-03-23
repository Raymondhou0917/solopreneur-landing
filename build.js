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

  if (fs.existsSync(OUTPUT_PATH)) {
    fs.copyFileSync(OUTPUT_PATH, BAK_PATH);
  }

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
