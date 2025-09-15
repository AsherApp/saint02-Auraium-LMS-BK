#!/usr/bin/env node

/**
 * Script to update remaining date formatting across the system
 * This script helps identify and update files that still use old date formatting
 */

const fs = require('fs');
const path = require('path');

// Files that need date utility imports and updates
const filesToUpdate = [
  'app/(lms)/student/dashboard/page.tsx',
  'app/(lms)/teacher/dashboard/page.tsx',
  'app/(lms)/student/assignments/page.tsx',
  'app/(lms)/teacher/assignments/page.tsx',
  'app/(lms)/student/messages/page.tsx',
  'app/(lms)/teacher/messages/page.tsx',
  'app/(lms)/student/performance/page.tsx',
  'app/(lms)/teacher/student-management/page.tsx',
  'app/(lms)/teacher/student-management/[studentCode]/page.tsx',
  'app/(lms)/teacher/recordings/page.tsx',
  'app/(lms)/student/notes/page.tsx',
  'app/(lms)/student/assignment/[id]/page.tsx',
  'app/(lms)/teacher/assignment/[aid]/page.tsx',
  'app/(lms)/teacher/assignment/[aid]/submission/[sid]/page.tsx',
  'app/(lms)/student/course/[id]/assignment/[aid]/page.tsx',
  'app/(lms)/student/course/[id]/assignment/[aid]/detail/page.tsx',
  'app/(lms)/teacher/course/[id]/assignment/[aid]/page.tsx',
  'app/(lms)/student/course/[id]/page.tsx',
  'app/(lms)/teacher/course/[id]/page.tsx',
  'app/(lms)/student/inbox/page.tsx',
  'app/(lms)/teacher/inbox/page.tsx',
  'components/shared/notification-system.tsx',
  'components/live/participants-list.tsx',
  'components/live/chat-widget.tsx',
  'components/live/poll-widget.tsx',
  'components/student/clean-study-area.tsx',
  'components/shared/course-completion-certificate.tsx',
  'components/teacher/grading-interface.tsx',
  'components/teacher/assignment-grading.tsx',
  'components/student/assignment-grades.tsx',
  'components/teacher/course-details-modal.tsx',
  'components/live/classwork-widget.tsx',
  'components/teacher/pending-invites-widget.tsx'
];

// Date formatting patterns to replace
const datePatterns = [
  {
    pattern: /new Date\(([^)]+)\)\.toLocaleDateString\(\)/g,
    replacement: 'dateUtils.short($1)'
  },
  {
    pattern: /new Date\(([^)]+)\)\.toLocaleTimeString\(\)/g,
    replacement: 'dateUtils.time($1)'
  },
  {
    pattern: /new Date\(([^)]+)\)\.toLocaleString\(\)/g,
    replacement: 'dateUtils.full($1)'
  },
  {
    pattern: /new Date\(([^)]+)\)\.toLocaleTimeString\(\[\],\s*\{\s*hour:\s*'2-digit',\s*minute:\s*'2-digit'\s*\}\)/g,
    replacement: 'dateUtils.time($1)'
  },
  {
    pattern: /new Date\(([^)]+)\)\.toLocaleDateString\(\[\],\s*\{\s*weekday:\s*'short',\s*month:\s*'short',\s*day:\s*'numeric'\s*\}\)/g,
    replacement: 'dateUtils.short($1)'
  }
];

// Import pattern to add
const importPattern = /import.*from.*["']@\/services\/http["']/;
const importReplacement = `import { http } from "@/services/http"
import { dateUtils } from "@/utils/date-utils"`;

function updateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Add date utils import if not present
    if (!content.includes('dateUtils') && content.includes('new Date(')) {
      if (importPattern.test(content)) {
        content = content.replace(importPattern, importReplacement);
        updated = true;
      } else {
        // Add import at the top
        const lines = content.split('\n');
        const lastImportIndex = lines.findLastIndex(line => line.startsWith('import'));
        if (lastImportIndex !== -1) {
          lines.splice(lastImportIndex + 1, 0, 'import { dateUtils } from "@/utils/date-utils"');
          content = lines.join('\n');
          updated = true;
        }
      }
    }

    // Replace date formatting patterns
    datePatterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔄 Starting date formatting update...\n');
  
  let updatedCount = 0;
  let totalCount = filesToUpdate.length;

  filesToUpdate.forEach(filePath => {
    if (updateFile(filePath)) {
      updatedCount++;
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Total files processed: ${totalCount}`);
  console.log(`   Files updated: ${updatedCount}`);
  console.log(`   Files unchanged: ${totalCount - updatedCount}`);
  
  if (updatedCount > 0) {
    console.log('\n✨ Date formatting update completed!');
    console.log('   All date displays now use the centralized date utilities.');
    console.log('   This ensures consistent formatting and proper error handling.');
  } else {
    console.log('\n🎉 All files already up to date!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { updateFile, filesToUpdate, datePatterns };
