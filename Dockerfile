# Use a base Node.js image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code transpile to JavaScript
RUN npm run build 

# Expose 
EXPOSE 4000

# Define the command to run your compiled JavaScript application
CMD [ "node", "dist/src/server.js" ]