#!/usr/bin/env node

/**
 * Formatting Migration Script
 * 
 * This script helps migrate existing components to use the new formatting system.
 * It performs basic replacements and provides suggestions for manual updates.
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Configuration
const config = {
  srcPath: path.join(__dirname, '../src'),
  componentsPath: path.join(__dirname, '../src/components'),
  pagesPath: path.join(__dirname, '../src/app'),
  backupPath: path.join(__dirname, '../backups/pre-formatting-migration'),
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose')
};

// Patterns to detect and replace
const patterns = {
  // Currency formatting patterns
  currencyDisplay: [
    {
      pattern: /\$\{([^}]+)\.toFixed\(2\)\}/g,
      replacement: '<CurrencyDisplay amount={$1} />',
      description: 'Replace ${amount.toFixed(2)} with CurrencyDisplay'
    },
    {
      pattern: /\$\{([^}]+)\.toFixed\(\d+\)\}/g,
      replacement: '<CurrencyDisplay amount={$1} />',
      description: 'Replace ${amount.toFixed(n)} with CurrencyDisplay'
    },
    {
      pattern: /formatCurrency\(([^)]+)\)/g,
      replacement: '<CurrencyDisplay amount={$1} />',
      description: 'Replace formatCurrency() calls with CurrencyDisplay'
    }
  ],

  // Date formatting patterns
  dateDisplay: [
    {
      pattern: /format\(([^,]+),\s*['"]yyyy-MM-dd['"]\)/g,
      replacement: '<DateDisplay date={$1} />',
      description: 'Replace format(date, "yyyy-MM-dd") with DateDisplay'
    },
    {
      pattern: /format\(([^,]+),\s*['"][^'"]*['"]\)/g,
      replacement: '<DateDisplay date={$1} />',
      description: 'Replace date format() calls with DateDisplay'
    },
    {
      pattern: /formatDate\(([^)]+)\)/g,
      replacement: '<DateDisplay date={$1} />',
      description: 'Replace formatDate() calls with DateDisplay'
    }
  ],

  // Input replacements
  currencyInput: [
    {
      pattern: /<Input\s+type="number"\s+([^>]*?)placeholder="[^"]*(?:amount|price|cost|total)[^"]*"([^>]*?)>/gi,
      replacement: '<CurrencyInput $1$2>',
      description: 'Replace number inputs with currency placeholders'
    }
  ],

  dateInput: [
    {
      pattern: /<Input\s+type="date"([^>]*?)>/gi,
      replacement: '<DatePicker$1 />',
      description: 'Replace date inputs with DatePicker'
    }
  ]
};

// Required imports to add
const requiredImports = {
  DateDisplay: "import { DateDisplay } from '@/components/ui/DateDisplay';",
  CurrencyDisplay: "import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';",
  CurrencyInput: "import { CurrencyInput } from '@/components/ui/CurrencyInput';",
  DatePicker: "import { DatePicker } from '@/components/ui/DatePicker';"
};

class MigrationReporter {
  constructor() {
    this.results = {
      filesProcessed: 0,
      filesChanged: 0,
      replacements: [],
      errors: [],
      suggestions: []
    };
  }

  addReplacement(file, pattern, count) {
    this.results.replacements.push({ file, pattern, count });
  }

  addError(file, error) {
    this.results.errors.push({ file, error });
  }

  addSuggestion(file, suggestion) {
    this.results.suggestions.push({ file, suggestion });
  }

  generateReport() {
    console.log('\n📊 Migration Report\n');
    console.log(`Files processed: ${this.results.filesProcessed}`);
    console.log(`Files changed: ${this.results.filesChanged}`);
    console.log(`Total replacements: ${this.results.replacements.reduce((sum, r) => sum + r.count, 0)}\n`);

    if (this.results.replacements.length > 0) {
      console.log('✅ Replacements made:');
      this.results.replacements.forEach(({ file, pattern, count }) => {
        console.log(`  ${path.relative(config.srcPath, file)}: ${count}x ${pattern}`);
      });
      console.log();
    }

    if (this.results.errors.length > 0) {
      console.log('❌ Errors:');
      this.results.errors.forEach(({ file, error }) => {
        console.log(`  ${path.relative(config.srcPath, file)}: ${error}`);
      });
      console.log();
    }

    if (this.results.suggestions.length > 0) {
      console.log('💡 Manual review suggested:');
      this.results.suggestions.forEach(({ file, suggestion }) => {
        console.log(`  ${path.relative(config.srcPath, file)}: ${suggestion}`);
      });
      console.log();
    }

    console.log('📝 Next steps:');
    console.log('1. Review the changes and test your components');
    console.log('2. Update component state to use proper data types (Date objects, numbers)');
    console.log('3. Update TypeScript interfaces if needed');
    console.log('4. Test with different locales and formatting preferences');
    console.log('5. Remove old formatting utility functions if no longer used');
  }
}

// Function to process files
function processFile(filePath, reporter) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  try {
    reporter.results.filesProcessed++;
    
    if (config.verbose) {
      console.log(`Processing: ${path.relative(config.srcPath, filePath)}`);
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let hasChanges = false;

    // Apply pattern replacements
    Object.entries(patterns).forEach(([category, categoryPatterns]) => {
      categoryPatterns.forEach(({ pattern, replacement, description }) => {
        const matches = content.match(pattern);
        if (matches) {
          content = content.replace(pattern, replacement);
          reporter.addReplacement(filePath, description, matches.length);
          hasChanges = true;
        }
      });
    });

    // Detect which components are now used
    const usedComponents = detectUsedComponents(content);
    
    // Add required imports
    if (usedComponents.length > 0) {
      const contentWithImports = addImports(content, usedComponents);
      if (contentWithImports !== content) {
        content = contentWithImports;
        hasChanges = true;
      }
    }

    // Look for patterns that need manual review
    if (content.includes('toFixed(') && !originalContent.includes('CurrencyDisplay')) {
      reporter.addSuggestion(filePath, 'Contains toFixed() calls that may need currency formatting');
    }
    
    if (content.includes('type="number"') && 
        (content.includes('amount') || content.includes('price') || content.includes('cost'))) {
      reporter.addSuggestion(filePath, 'Contains number inputs that may need CurrencyInput');
    }

    if ((content.includes('Date(') || content.includes('date')) && 
        !content.includes('DateDisplay') && !content.includes('DatePicker')) {
      reporter.addSuggestion(filePath, 'Contains date handling that may need formatting components');
    }

    // Write changes
    if (hasChanges) {
      reporter.results.filesChanged++;
      
      if (!config.dryRun) {
        fs.writeFileSync(filePath, content, 'utf8');
      } else {
        console.log(`Would update: ${path.relative(config.srcPath, filePath)}`);
      }
    }

  } catch (error) {
    reporter.addError(filePath, error.message);
  }
}

async function createBackup() {
  if (config.dryRun) return;

  console.log('📁 Creating backup...');
  
  if (!fs.existsSync(config.backupPath)) {
    fs.mkdirSync(config.backupPath, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(config.backupPath, timestamp);
  fs.mkdirSync(backupDir, { recursive: true });

  // Copy src directory
  await copyDirectory(config.srcPath, path.join(backupDir, 'src'));
  
  console.log(`✅ Backup created at: ${backupDir}`);
}

async function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function findReactFiles() {
  const patterns = [
    path.join(config.srcPath, '**/*.tsx'),
    path.join(config.srcPath, '**/*.jsx'),
    path.join(config.srcPath, '**/*.ts')
  ];

  const files = [];
  patterns.forEach(pattern => {
    try {
      const matches = glob.sync(pattern, { 
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/*.test.*',
          '**/*.spec.*'
        ]
      });
      files.push(...matches);
    } catch (error) {
      // Fallback to manual directory traversal if glob fails
      console.log('Note: Using manual file search (glob not available)');
      walkDirectory(config.srcPath, files);
    }
  });

  return [...new Set(files)]; // Remove duplicates
}

function walkDirectory(dir, files) {
  if (!fs.existsSync(dir)) return;
  
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory() && 
        !item.startsWith('.') && 
        item !== 'node_modules' && 
        item !== 'dist' && 
        item !== 'build') {
      walkDirectory(itemPath, files);
    } else if (item.endsWith('.tsx') || item.endsWith('.jsx') || 
               (item.endsWith('.ts') && !item.endsWith('.d.ts'))) {
      files.push(itemPath);
    }
  });
}

function detectUsedComponents(content) {
  const used = [];
  
  if (content.includes('CurrencyDisplay') || 
      patterns.currencyDisplay.some(p => p.pattern.test(content))) {
    used.push('CurrencyDisplay');
  }
  
  if (content.includes('DateDisplay') || 
      patterns.dateDisplay.some(p => p.pattern.test(content))) {
    used.push('DateDisplay');
  }
  
  if (content.includes('CurrencyInput') || 
      patterns.currencyInput.some(p => p.pattern.test(content))) {
    used.push('CurrencyInput');
  }
  
  if (content.includes('DatePicker') || 
      patterns.dateInput.some(p => p.pattern.test(content))) {
    used.push('DatePicker');
  }
  
  return used;
}

function addImports(content, usedComponents) {
  const lines = content.split('\n');
  let importInsertIndex = 0;
  
  // Find where to insert imports (after existing imports)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      importInsertIndex = i + 1;
    } else if (importInsertIndex > 0 && lines[i].trim() === '') {
      break;
    }
  }
  
  const importsToAdd = usedComponents
    .filter(component => !content.includes(requiredImports[component]))
    .map(component => requiredImports[component]);
  
  if (importsToAdd.length > 0) {
    lines.splice(importInsertIndex, 0, '', ...importsToAdd);
  }
  
  return lines.join('\n');
}

async function main() {
  console.log('🚀 Starting formatting migration...\n');
  
  if (config.dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  const reporter = new MigrationReporter();

  try {
    // Create backup
    if (!config.dryRun) {
      await createBackup();
    }

    // Find all React files
    console.log('🔍 Finding React files...');
    const files = findReactFiles();
    console.log(`Found ${files.length} files to process\n`);

    // Process each file
    console.log('⚙️  Processing files...');
    files.forEach(file => processFile(file, reporter));

    // Generate report
    reporter.generateReport();

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// CLI Help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Formatting Migration Script

Usage: node scripts/migrate-formatting.js [options]

Options:
  --dry-run    Run without making changes (preview mode)
  --verbose    Show detailed processing information
  --help, -h   Show this help message

Examples:
  node scripts/migrate-formatting.js --dry-run    # Preview changes
  node scripts/migrate-formatting.js             # Apply changes
  node scripts/migrate-formatting.js --verbose   # Detailed output
`);
  process.exit(0);
}

// Run migration
main().catch(console.error);
