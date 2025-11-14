#!/bin/bash
# Test build script

cd "/Users/tosinojo/Desktop/AuraiumLMS Mplace/lms-auth-starter/Endubackend"

echo "========================================" > build-test.log
echo "Build Test - $(date)" >> build-test.log
echo "========================================" >> build-test.log
echo "" >> build-test.log

echo "=== Testing TypeScript Build ===" >> build-test.log
npm run build >> build-test.log 2>&1
BUILD_EXIT_CODE=$?

echo "" >> build-test.log
echo "Build exit code: $BUILD_EXIT_CODE" >> build-test.log

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "" >> build-test.log
    echo "✅ TypeScript build SUCCESSFUL" >> build-test.log
    echo "" >> build-test.log
    echo "=== Testing Docker Build ===" >> build-test.log
    docker build -t auraium-backend-test . >> build-test.log 2>&1
    DOCKER_EXIT_CODE=$?
    echo "" >> build-test.log
    echo "Docker build exit code: $DOCKER_EXIT_CODE" >> build-test.log
    
    if [ $DOCKER_EXIT_CODE -eq 0 ]; then
        echo "✅ Docker build SUCCESSFUL" >> build-test.log
    else
        echo "❌ Docker build FAILED" >> build-test.log
    fi
else
    echo "❌ TypeScript build FAILED" >> build-test.log
    echo "Skipping Docker build test" >> build-test.log
fi

echo "" >> build-test.log
echo "========================================" >> build-test.log
echo "Test complete. Check build-test.log for details." >> build-test.log
echo "========================================" >> build-test.log

cat build-test.log

