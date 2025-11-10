# Use a base Node.js image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Copy package.json and package-lock.json
COPY package*.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm ci

# Copy tsconfig.json
COPY tsconfig.json ./

# Copy the application code
COPY src/ ./src/

# COMPREHENSIVE DEBUGGING
RUN echo "=== Debugging File Structure ===" && \
    echo "1. Checking if services directory exists:" && \
    ls -la src/services/ && \
    echo "2. Checking specific missing service files:" && \
    find src/services/ -name "*discussion*" -o -name "*forum*" -o -name "*notes*" -o -name "*recording*" | sort && \
    echo "3. Checking validation directory:" && \
    ls -la src/validation/ && \
    echo "4. Checking routes directory:" && \
    ls -la src/routes/ | grep -E "(resource|poll|quiz|attendance|participant|recording|liveClasses|announcements|enrollments)" && \
    echo "5. All .ts files count:" && \
    find src/ -name "*.ts" | wc -l

# Check file contents of problematic files
RUN echo "=== Checking imports in problematic files ===" && \
    echo "discussions.routes.ts imports:" && \
    grep "from.*service" src/routes/discussions.routes.ts || echo "No service imports found" && \
    echo "forum.routes.ts imports:" && \
    grep "from.*service" src/routes/forum.routes.ts || echo "No service imports found" && \
    echo "recordings.routes.ts imports:" && \
    grep "from.*service\|from.*validation" src/routes/recordings.routes.ts || echo "No imports found"

# Build the TypeScript code
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

# Create uploads directory
RUN mkdir -p uploads

# Set NODE_ENV to production
ENV NODE_ENV=production

# Expose the port
EXPOSE 4000

# Health check with more lenient settings
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:4000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Define the command to run your compiled JavaScript application
CMD ["node", "dist/server.js"]