FROM node:20-alpine

WORKDIR /app

# Install build dependencies if needed
RUN apk add --no-cache curl

# Copy dependency manifests
COPY package*.json ./

# Install production and dev dependencies
RUN npm install

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD curl -f http://localhost:5000/api/v1/health || exit 1

# Start backend server
CMD ["node", "src/server.js"]
