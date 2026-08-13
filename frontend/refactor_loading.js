const fs = require('fs');
const path = require('path');

const ADMIN_DIR = path.join(__dirname, 'app', 'admin');
const CREATOR_DIR = path.join(__dirname, 'app', 'creator');

const GENERIC_LOADING_REGEX = /^\s*if\s*\(\s*loading\s*\)\s*return\s*<div[^>]*>.*?(?:<\/div>|;)\s*$/gm;
const GENERIC_LOADING_REGEX_2 = /^\s*if\s*\(\s*loading\s*\)\s*\{\s*return\s*<div[^>]*>.*?(?:<\/div>|;)\s*\}\s*$/gm;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Remove the blocking loading line
  content = content.replace(GENERIC_LOADING_REGEX, '');
  content = content.replace(GENERIC_LOADING_REGEX_2, '');

  // 2. Inject inline loading for tables
  content = content.replace(/\{([a-zA-Z0-9_]+)\.length === 0 && \(\s*<tr/g, '{loading ? <tr><td colSpan={10} className="p-8 text-center text-zinc-500">{t("common.loading") || "Đang tải..."}</td></tr> : $1.length === 0 && (<tr');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('page.tsx')) {
      processFile(fullPath);
    }
  }
}

walkDir(ADMIN_DIR);
walkDir(CREATOR_DIR);

console.log("Done");
