const fs = require("fs");
const path = require("path");

const mappings = [
  { pattern: /(?<!dark:)\bbg-zinc-950(\/[0-9]+)?\b/g, replacement: "bg-zinc-100$1 dark:bg-zinc-950$1" },
  { pattern: /(?<!dark:)\bbg-zinc-900(\/[0-9]+)?\b/g, replacement: "bg-white$1 dark:bg-zinc-900$1" },
  { pattern: /(?<!dark:)\bbg-zinc-800(\/[0-9]+)?\b/g, replacement: "bg-zinc-100$1 dark:bg-zinc-800$1" },
  { pattern: /(?<!dark:)\bbg-zinc-700(\/[0-9]+)?\b/g, replacement: "bg-zinc-200$1 dark:bg-zinc-700$1" },
  
  { pattern: /(?<!dark:)\btext-white(\/[0-9]+)?\b/g, replacement: "text-zinc-900$1 dark:text-white$1" },
  { pattern: /(?<!dark:)\btext-zinc-100(\/[0-9]+)?\b/g, replacement: "text-zinc-900$1 dark:text-zinc-100$1" },
  { pattern: /(?<!dark:)\btext-zinc-200(\/[0-9]+)?\b/g, replacement: "text-zinc-800$1 dark:text-zinc-200$1" },
  { pattern: /(?<!dark:)\btext-zinc-300(\/[0-9]+)?\b/g, replacement: "text-zinc-700$1 dark:text-zinc-300$1" },
  { pattern: /(?<!dark:)\btext-zinc-400(\/[0-9]+)?\b/g, replacement: "text-zinc-600$1 dark:text-zinc-400$1" },

  { pattern: /(?<!dark:)\bborder-white\/([0-9]+)\b/g, replacement: "border-black/$1 dark:border-white/$1" },
  { pattern: /(?<!dark:)\bborder-zinc-800(\/[0-9]+)?\b/g, replacement: "border-zinc-200$1 dark:border-zinc-800$1" },
  { pattern: /(?<!dark:)\bborder-zinc-700(\/[0-9]+)?\b/g, replacement: "border-zinc-300$1 dark:border-zinc-700$1" },
  
  // also fix hover: classes
  { pattern: /(?<!dark:)\bhover:bg-zinc-800(\/[0-9]+)?\b/g, replacement: "hover:bg-zinc-200$1 dark:hover:bg-zinc-800$1" },
  { pattern: /(?<!dark:)\bhover:bg-zinc-700(\/[0-9]+)?\b/g, replacement: "hover:bg-zinc-300$1 dark:hover:bg-zinc-700$1" },
  { pattern: /(?<!dark:)\bhover:text-white(\/[0-9]+)?\b/g, replacement: "hover:text-zinc-900$1 dark:hover:text-white$1" },
  { pattern: /(?<!dark:)\bhover:border-white\/([0-9]+)\b/g, replacement: "hover:border-black/$1 dark:hover:border-white/$1" },
  { pattern: /(?<!dark:)\bhover:border-zinc-700(\/[0-9]+)?\b/g, replacement: "hover:border-zinc-300$1 dark:hover:border-zinc-700$1" },
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      results.push(file);
    }
  });
  return results;
}

const targetDirs = [
  path.join(__dirname, "frontend/app"),
  path.join(__dirname, "frontend/components")
];

let changedCount = 0;

targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = walk(dir);
  
  files.forEach(file => {
    const originalContent = fs.readFileSync(file, "utf8");
    let newContent = originalContent;
    
    mappings.forEach(m => {
      newContent = newContent.replace(m.pattern, m.replacement);
    });
    
    if (newContent !== originalContent) {
      fs.writeFileSync(file, newContent, "utf8");
      console.log("Updated:", file);
      changedCount++;
    }
  });
});

console.log("Total files updated:", changedCount);

