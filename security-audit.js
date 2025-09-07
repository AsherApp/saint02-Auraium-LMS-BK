#!/usr/bin/env node

/**
 * SECURITY AUDIT SCRIPT
 * 
 * This script checks all API routes for potential security vulnerabilities
 * where users might see data that doesn't belong to them.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
}

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Security issues found
const securityIssues = []

// Check if a route file has proper user filtering
function auditRouteFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const fileName = path.basename(filePath)
  
  log('cyan', `\n🔍 Auditing: ${fileName}`)
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    {
      pattern: /\.from\(['"`](\w+)['"`]\)\s*\.select\(['"`]\*['"`]\)(?!\s*\.eq)/g,
      issue: 'SELECT * without user filtering',
      severity: 'CRITICAL'
    },
    {
      pattern: /\.from\(['"`](\w+)['"`]\)\s*\.select\([^)]+\)(?!\s*\.eq)/g,
      issue: 'SELECT without user filtering',
      severity: 'HIGH'
    },
    {
      pattern: /\.from\(['"`](\w+)['"`]\)\s*\.select\([^)]+\)\s*\.order\(/g,
      issue: 'Query without user filtering (only ORDER BY)',
      severity: 'HIGH'
    }
  ]
  
  // Check for good patterns
  const goodPatterns = [
    /\.eq\(['"`]teacher_email['"`],\s*(req\.user|userEmail)/g,
    /\.eq\(['"`]student_email['"`],\s*(req\.user|userEmail)/g,
    /\.eq\(['"`]user_email['"`],\s*(req\.user|userEmail)/g,
    /\.eq\(['"`]created_by['"`],\s*(req\.user|userEmail)/g,
    /\.eq\(['"`]sender_email['"`],\s*(req\.user|userEmail)/g
  ]
  
  let hasUserFiltering = false
  for (const pattern of goodPatterns) {
    if (pattern.test(content)) {
      hasUserFiltering = true
      break
    }
  }
  
  // Check for dangerous patterns
  for (const { pattern, issue, severity } of dangerousPatterns) {
    const matches = content.match(pattern)
    if (matches) {
      securityIssues.push({
        file: fileName,
        issue,
        severity,
        matches: matches.length,
        details: `Found ${matches.length} instances of ${issue}`
      })
      log('red', `  ❌ ${severity}: ${issue} (${matches.length} instances)`)
    }
  }
  
  // Check for authentication
  if (!content.includes('requireAuth')) {
    securityIssues.push({
      file: fileName,
      issue: 'No authentication middleware',
      severity: 'CRITICAL',
      matches: 1,
      details: 'Route has no authentication protection'
    })
    log('red', `  ❌ CRITICAL: No authentication middleware`)
  } else {
    log('green', `  ✅ Has authentication middleware`)
  }
  
  // Check for user filtering
  if (hasUserFiltering) {
    log('green', `  ✅ Has user-based filtering`)
  } else if (content.includes('requireAuth')) {
    securityIssues.push({
      file: fileName,
      issue: 'No user-based filtering',
      severity: 'HIGH',
      matches: 1,
      details: 'Authenticated route but no user-based data filtering'
    })
    log('yellow', `  ⚠️  HIGH: No user-based filtering detected`)
  }
  
  // Check for debug endpoints
  if (content.includes('/debug/') || content.includes('debug:')) {
    securityIssues.push({
      file: fileName,
      issue: 'Debug endpoints present',
      severity: 'MEDIUM',
      matches: 1,
      details: 'Debug endpoints should be removed in production'
    })
    log('yellow', `  ⚠️  MEDIUM: Debug endpoints found`)
  }
}

// Main audit function
function runSecurityAudit() {
  log('magenta', '🔒 SECURITY AUDIT STARTING...')
  log('magenta', '=====================================')
  
  const routesDir = path.join(__dirname, 'src', 'routes')
  
  if (!fs.existsSync(routesDir)) {
    log('red', '❌ Routes directory not found!')
    process.exit(1)
  }
  
  // Get all route files
  const routeFiles = []
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir)
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath)
      } else if (item.endsWith('.ts') || item.endsWith('.js')) {
        routeFiles.push(fullPath)
      }
    }
  }
  
  scanDirectory(routesDir)
  
  log('blue', `Found ${routeFiles.length} route files to audit`)
  
  // Audit each file
  for (const file of routeFiles) {
    auditRouteFile(file)
  }
  
  // Summary
  log('magenta', '\n=====================================')
  log('magenta', '🔒 SECURITY AUDIT SUMMARY')
  log('magenta', '=====================================')
  
  if (securityIssues.length === 0) {
    log('green', '✅ No security issues found!')
  } else {
    log('red', `❌ Found ${securityIssues.length} security issues:`)
    
    // Group by severity
    const critical = securityIssues.filter(i => i.severity === 'CRITICAL')
    const high = securityIssues.filter(i => i.severity === 'HIGH')
    const medium = securityIssues.filter(i => i.severity === 'MEDIUM')
    
    if (critical.length > 0) {
      log('red', `\n🚨 CRITICAL ISSUES (${critical.length}):`)
      critical.forEach(issue => {
        log('red', `  • ${issue.file}: ${issue.issue}`)
        log('white', `    ${issue.details}`)
      })
    }
    
    if (high.length > 0) {
      log('yellow', `\n⚠️  HIGH PRIORITY ISSUES (${high.length}):`)
      high.forEach(issue => {
        log('yellow', `  • ${issue.file}: ${issue.issue}`)
        log('white', `    ${issue.details}`)
      })
    }
    
    if (medium.length > 0) {
      log('blue', `\nℹ️  MEDIUM PRIORITY ISSUES (${medium.length}):`)
      medium.forEach(issue => {
        log('blue', `  • ${issue.file}: ${issue.issue}`)
        log('white', `    ${issue.details}`)
      })
    }
    
    log('red', '\n🚨 IMMEDIATE ACTION REQUIRED!')
    log('red', 'These security issues must be fixed before production deployment.')
  }
  
  // Save report
  const reportPath = path.join(__dirname, 'security-audit-report.json')
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalFiles: routeFiles.length,
    issuesFound: securityIssues.length,
    issues: securityIssues
  }, null, 2))
  
  log('cyan', `\n📄 Detailed report saved to: ${reportPath}`)
  
  // Exit with error code if critical issues found
  if (critical.length > 0) {
    process.exit(1)
  }
}

// Run the audit
runSecurityAudit()
