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

# Install production dependencies; install build tools temporarily for any native modules
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ libsqlite3-dev nginx \
  && npm ci --only=production \
  && apt-get purge -y --auto-remove python3 make g++ libsqlite3-dev \
  && rm -rf /var/lib/apt/lists/*


# Copy the rest of the application code
COPY . .

# Copy GOV.UK Frontend assets to public for production
RUN mkdir -p public/govuk/assets/stylesheets public/govuk/assets/fonts public/govuk/assets/images \
  && cp node_modules/govuk-frontend/dist/govuk/govuk-frontend.min.css public/govuk/assets/stylesheets/ \
  && cp -r node_modules/govuk-frontend/dist/govuk/assets/fonts public/govuk/assets/ \
  && cp -r node_modules/govuk-frontend/dist/govuk/assets/images public/govuk/assets/

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Create necessary directories and set permissions
RUN mkdir -p logs database \
  && chown -R node:node /app

# Expose HTTP port
EXPOSE 80

# Health check for Nginx
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start both Node.js and Nginx
CMD ["sh", "-c", "npm start & nginx -g 'daemon off;'"]
