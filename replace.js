const fs = require('fs');
const path = require('path');

const targetDir = process.argv[2];

if (!targetDir) {
  console.error("Please provide a target directory");
  process.exit(1);
}

const map = {
  'bg-white': 'surface',
  'bg-slate-50': 'surface-subtle',
  'bg-slate-100': 'surface-elev',
  'bg-slate-200': 'surface-elev',
  'text-slate-900': 'text-app',
  'text-slate-800': 'text-app',
  'text-slate-700': 'text-app-2',
  'text-slate-600': 'text-app-2',
  'text-slate-500': 'text-app-muted',
  'text-slate-400': 'text-app-muted',
  'border-slate-100': 'border-app',
  'border-slate-200': 'border-app',
  'border-slate-300': 'border-app'
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  const regex = /(?<!hover:|focus:|group-hover:|group-focus:|peer-hover:|peer-focus:|dark:|active:|disabled:)\b(bg-white|bg-slate-50|bg-slate-100|bg-slate-200|text-slate-900|text-slate-800|text-slate-700|text-slate-600|text-slate-500|text-slate-400|border-slate-100|border-slate-200|border-slate-300)\b(?!\/|-)/g;

  content = content.replace(regex, (match) => {
    return map[match] || match;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Modified: ${filePath}`);
  }
}

processDirectory(targetDir);
console.log("Done processing:", targetDir);
