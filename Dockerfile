# Use Debian-based Node.js 18 slim image
FROM node:18-slim AS base

# Install curl for health checks (and certs) - slim images are minimal
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Development stage - includes devDependencies for nodemon, etc.
FROM base AS development

ENV NODE_ENV=development

# Install ALL dependencies (production + dev) for development mode
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ libsqlite3-dev \
  && npm ci \
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

ENV PORT=3000

CMD ["npm", "run", "dev"]


# Production stage - production dependencies only
FROM base AS production

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ libsqlite3-dev \
  && npm ci --only=production \
  && apt-get purge -y --auto-remove python3 make g++ libsqlite3-dev \
  && rm -rf /var/lib/apt/lists/*


COPY . .

# Run asset setup script to copy GOV.UK Frontend assets and logo
RUN bash scripts/setup-assets.sh

# Create necessary directories and set permissions
RUN mkdir -p logs database \
  && chown -R node:node /app

# Expose app port
EXPOSE 3000

# Start Node.js app only
CMD ["npm", "start"]
