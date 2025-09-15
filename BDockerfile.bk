# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Ensure TypeScript compilation works
RUN npm run build

# Debug: Show the structure of the built files
RUN echo "=== Checking build output ===" && \
    ls -la dist/src/routes/ && \
    echo "=== Checking assignments directory ===" && \
    ls -la dist/src/routes/assignments/ && \
    echo "=== Checking if index.js exists ===" && \
    test -f dist/src/routes/assignments/index.js && echo "assignments/index.js exists" || echo "assignments/index.js MISSING" && \
    echo "=== Checking if password-reset.routes.js exists ===" && \
    test -f dist/src/routes/password-reset.routes.js && echo "password-reset.routes.js exists" || echo "password-reset.routes.js MISSING"

# Remove devDependencies to reduce image size
RUN npm prune --omit=dev

# Make startup script executable
RUN chmod +x start.sh

# Expose port
EXPOSE 4000

# Start the application
CMD ["./start.sh"]
