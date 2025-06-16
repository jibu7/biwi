const fs = require('fs');
const path = require('path');

// Files that need to be fixed based on the grep search results
const filesToFix = [
  '/home/ubuntu24/proj/biwi/frontend/src/app/(dashboard)/maintenance/system/roles/[id]/page.tsx',
  '/home/ubuntu24/proj/biwi/frontend/src/app/(dashboard)/maintenance/inventory/warehouses/[id]/page.tsx',
  '/home/ubuntu24/proj/biwi/frontend/src/app/(dashboard)/maintenance/gl/transaction-types/[id]/page.tsx',
  '/home/ubuntu24/proj/biwi/frontend/src/app/(dashboard)/maintenance/inventory/items/[id]/page.tsx',
  '/home/ubuntu24/proj/biwi/frontend/src/app/(dashboard)/maintenance/system/currencies/[id]/page.tsx',
  '/home/ubuntu24/proj/biwi/frontend/src/app/(dashboard)/maintenance/system/tax-types/[id]/page.tsx',
  '/home/ubuntu24/proj/biwi/frontend/src/app/(dashboard)/maintenance/inventory/units-of-measure/[id]/page.tsx',
  '/home/ubuntu24/proj/biwi/frontend/src/app/(dashboard)/maintenance/ap/suppliers/[id]/page.tsx',
  '/home/ubuntu24/proj/biwi/frontend/src/app/(dashboard)/maintenance/ap/transaction-types/[id]/page.tsx',
  '/home/ubuntu24/proj/biwi/frontend/src/app/(dashboard)/maintenance/system/branches/[id]/page.tsx',
  '/home/ubuntu24/proj/biwi/frontend/src/app/(dashboard)/transactions/ar/transactions/[id]/page.tsx',
  '/home/ubuntu24/proj/biwi/frontend/src/app/(dashboard)/transactions/ar/transactions/[id]/edit/page.tsx'
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add useState and useEffect imports if not present
    if (!content.includes('useState') || !content.includes('useEffect')) {
      content = content.replace(
        /'use client';\n\n/,
        "'use client';\n\nimport { useState, useEffect } from 'react';\n"
      );
      // Remove duplicate import if it already exists
      content = content.replace(
        /import { (.*), useState, useEffect (.*) } from 'react';\nimport { useState, useEffect } from 'react';\n/,
        "import { $1, useState, useEffect $2 } from 'react';\n"
      );
    }
    
    // Fix function signature and add state management
    const functionRegex = /export default function (\w+)\(\{ params \}: \{ params: \{ id: string \} \}\) \{/;
    const match = content.match(functionRegex);
    
    if (match) {
      const functionName = match[1];
      content = content.replace(
        functionRegex,
        `interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ${functionName}({ params }: PageProps) {`
      );
      
      // Add state management right after function declaration
      const stateManagement = `  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

`;
      
      content = content.replace(
        new RegExp(`export default function ${functionName}\\(\\{ params \\}: PageProps\\) \\{\n`),
        `export default function ${functionName}({ params }: PageProps) {\n${stateManagement}`
      );
    }
    
    // Fix direct params.id access
    content = content.replace(/params\.id/g, 'resolvedParams?.id');
    
    // Fix parseInt and Number calls
    content = content.replace(
      /const (\w+) = (parseInt|Number)\(resolvedParams\?\.id(.*?)\);/g,
      'const $1 = resolvedParams ? $2(resolvedParams.id$3) : 0;'
    );
    
    // Add enabled condition to queries that use the ID
    content = content.replace(
      /queryFn: \(\) => (\w+)\.(\w+)\((\w+)\),\n(\s+)\}\);/g,
      'queryFn: () => $1.$2($3),\n$4enabled: $3 > 0,\n$4});'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

filesToFix.forEach(fixFile);
console.log('All files processed!');
