# Use Debian-based Node.js 18 slim image
FROM node:18-slim

# Install curl for health checks (and certs) - slim images are minimal
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Ensure production environment for dependency installation
ENV NODE_ENV=production

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install production dependencies; install build tools temporarily for any native modules
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ libsqlite3-dev \
  && npm ci --only=production \
  && apt-get purge -y --auto-remove python3 make g++ libsqlite3-dev \
  && rm -rf /var/lib/apt/lists/*

# Copy the rest of the application code
COPY . .

# Create necessary directories and set permissions
RUN mkdir -p logs database \
  && chown -R node:node /app

# Switch to non-root user
USER node

# Expose the port the app runs on
EXPOSE 3000

# Define environment variables
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
