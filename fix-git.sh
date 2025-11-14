#!/bin/bash
# Script to fix gitignore and re-add all TypeScript files

cd "/Users/tosinojo/Desktop/AuraiumLMS Mplace/lms-auth-starter/Endubackend"

echo "=== Current directory ==="
pwd

echo ""
echo "=== Removing src/ from git cache ==="
git rm -r --cached src/ 2>&1 || echo "No cached files to remove"

echo ""
echo "=== Re-adding all src/ files ==="
git add src/

echo ""
echo "=== Adding .gitignore changes ==="
git add .gitignore

echo ""
echo "=== Git status ==="
git status --short

echo ""
echo "=== Files to be committed ==="
git diff --cached --name-only | head -50

echo ""
echo "=== Creating commit ==="
git commit -m "Fix .gitignore and add all TypeScript source files"

echo ""
echo "=== Pushing to repository ==="
git push new-origin master --force
git push new-origin HEAD:main --force

echo ""
echo "=== Done! ==="

