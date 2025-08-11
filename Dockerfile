# Use the official Node.js 18 LTS image
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies (using --omit=dev instead of deprecated --only=production)
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Create necessary directories
RUN mkdir -p logs database

# Set proper permissions
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Expose the port the app runs on
EXPOSE 3000

# Define environment variables
ENV NODE_ENV=local
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
