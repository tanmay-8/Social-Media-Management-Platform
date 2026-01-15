# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for sharp (image processing)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create tmp directory for file uploads
RUN mkdir -p tmp

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "app.js"]
