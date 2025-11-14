#!/bin/bash
cd "/Users/tosinojo/Desktop/AuraiumLMS Mplace/lms-auth-starter/Endubackend"

echo "=== Adding all files ==="
git add -A

echo "=== Committing changes ==="
git commit -m "Push all backend code to new repository" || echo "Nothing to commit"

echo "=== Removing old remote if exists ==="
git remote remove new-repo 2>/dev/null || true

echo "=== Adding new remote ==="
git remote add new-repo https://github.com/AsherApp/AuraiumLMS-BK-v2.git

echo "=== Pushing all branches ==="
git push new-repo master
git push new-repo new-backend-branch 2>/dev/null || echo "new-backend-branch may not exist"

echo "=== Done! Check https://github.com/AsherApp/AuraiumLMS-BK-v2 ==="

