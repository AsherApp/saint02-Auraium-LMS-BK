# Use a base Node.js image
FROM node:20-alpine

# Set a build argument so the Dockerfile works whether the context is the repo root or Endubackend/
# Default to Endubackend since Railway builds from repo root
ARG PROJECT_ROOT=Endubackend

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Copy package.json and package-lock.json from the backend project directory
COPY ${PROJECT_ROOT}/package*.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm ci

# Copy configuration and source code
COPY ${PROJECT_ROOT}/tsconfig.json ./
COPY ${PROJECT_ROOT}/post-build.js ./
COPY ${PROJECT_ROOT}/src ./src

# Debug: Verify critical files are copied
RUN echo "=== Verifying copied files ===" && \
    echo "Services directory:" && \
    ls -la src/services/ | head -20 && \
    echo "Checking for discussion.service.ts:" && \
    test -f src/services/discussion.service.ts && echo "✓ discussion.service.ts exists" || echo "✗ discussion.service.ts MISSING" && \
    echo "Checking for forum.service.ts:" && \
    test -f src/services/forum.service.ts && echo "✓ forum.service.ts exists" || echo "✗ forum.service.ts MISSING" && \
    echo "Checking for notes.service.ts:" && \
    test -f src/services/notes.service.ts && echo "✓ notes.service.ts exists" || echo "✗ notes.service.ts MISSING" && \
    echo "Checking for recording.service.ts:" && \
    test -f src/services/recording.service.ts && echo "✓ recording.service.ts exists" || echo "✗ recording.service.ts MISSING" && \
    echo "Validation directory:" && \
    ls -la src/validation/ 2>&1 || echo "Validation directory not found"

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