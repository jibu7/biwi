#!/bin/bash
# Fix 'use client' directive positioning

echo "🔧 Fixing 'use client' directives..."

# Find all TypeScript/TSX files with 'use client'
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "'use client'" | while read file; do
    echo "Processing: $file"
    
    # Create a temporary file
    temp_file=$(mktemp)
    
    # Read the file and fix the 'use client' position
    {
        echo "'use client';"
        echo ""
        grep -v "'use client';" "$file"
    } > "$temp_file"
    
    # Replace the original file
    mv "$temp_file" "$file"
    
    echo "✅ Fixed: $file"
done

echo "🎉 All 'use client' directives fixed!"
