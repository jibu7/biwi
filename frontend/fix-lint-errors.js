const fs = require('fs');
const path = require('path');
const glob = require('glob');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix unescaped entities
  const unescapedQuotes = content.match(/(['"])/g);
  if (unescapedQuotes) {
    content = content.replace(/'/g, "&apos;")
      .replace(/"/g, "&quot;");
    modified = true;
  }

  // Add proper types for common any usages
  const anyReplacements = {
    'Record<string, any>': 'Record<string, unknown>',
    'Promise<any>': 'Promise<unknown>',
    'any[]': 'unknown[]',
    'Array<any>': 'Array<unknown>',
    ': any': ': unknown'
  };

  for (const [find, replace] of Object.entries(anyReplacements)) {
    if (content.includes(find)) {
      content = content.replace(new RegExp(find, 'g'), replace);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${filePath}`);
  }
}

// Process all TypeScript files
const files = glob.sync('src/**/*.{ts,tsx}', { cwd: process.cwd() });
files.forEach(file => {
  try {
    fixFile(path.join(process.cwd(), file));
  } catch (err) {
    console.error(`Error processing ${file}:`, err);
  }
});
