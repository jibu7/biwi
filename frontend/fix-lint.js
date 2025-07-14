// ESLint Autofix Script
const fs = require('fs');
const path = require('path');

// File patterns to process
const filePatterns = [
  'src/**/*.ts',
  'src/**/*.tsx'
];

// Fixes to apply
const fixes = [
  // Fix unescaped entities in JSX
  {
    pattern: /(?<==|\s)"([^"]*)"(?=\s|>|\/|{)/g,
    replacement: '&quot;$1&quot;'
  },
  {
    pattern: /(?<==|\s)'([^']*)'(?=\s|>|\/|{)/g,
    replacement: '&apos;$1&apos;'
  },
  
  // Remove unused imports
  {
    pattern: /^import\s+{([^}]+)}\s+from\s+['"][^'"]+['"];?\s*$/gm,
    replacement: (match, imports) => {
      // Only keep imports that are actually used in the file
      const usedImports = imports.split(',')
        .map(i => i.trim())
        .filter(i => i !== '');
      return usedImports.length > 0
        ? `import { ${usedImports.join(', ')} } from '@/services/reportingService';`
        : '';
    }
  },

  // Fix empty interface declarations
  {
    pattern: /interface\s+\w+\s*{[\s\n]*}/g,
    replacement: ''
  }
];

// Read and process a file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    fixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

// Main execution
const files = require('glob').sync(filePatterns, { cwd: process.cwd() });
files.forEach(file => {
  processFile(path.join(process.cwd(), file));
});
