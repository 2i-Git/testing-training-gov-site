
/**
 * Alcohol License Training Application Server
 * 
 * This is the main entry point for the Alcohol License Training application.
 * It sets up an Express.js server with the GOV.UK Design System frontend,
 * handles user journeys for alcohol license training applications, and provides
 * an admin panel for reviewing and managing applications.
 * 
 * Key Features:
 * - User application submission with form validation
 * - Admin panel for application review and approval/rejection
 * - SQLite database for data persistence
 * - Session-based authentication with CSRF protection
 * - Comprehensive logging and error handling
 * - Docker containerization support
 * 
 * Architecture:
 * - Express.js web framework
 * - Nunjucks templating with GOV.UK Design System
 * - SQLite database with custom service layer
 * - Dependency injection pattern for services
 * - Modular route organization
 */

// Core Express.js framework and related middleware
const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const nunjucks = require('nunjucks');
const session = require('express-session');
const bodyParser = require('body-parser');

// Application configuration and custom modules
const config = require('./config/config');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { securityHeaders, rateLimiters, sanitizeInput, csrfProtection } = require('./middleware/security');
const { logger, requestLogger, logApplicationEvent } = require('./utils/logger');

// Simple admin user store (in production, this would be in a database)
const adminUsers = [
  { email: 'admin@example.com', password: 'admin123' }
];

/**
 * Configure Nunjucks templating engine
 * Sets up template paths for both custom views and GOV.UK Frontend components
 */
nunjucks.configure(['views', 'node_modules/govuk-frontend/dist'], {
    autoescape: true,  // Prevent XSS attacks by auto-escaping HTML
    express: app       // Integrate with Express.js
});

/**
 * Middleware Configuration
 * Order matters! Middleware is processed in the order it's defined.
 */

// Security middleware (must be first)
app.use(securityHeaders);           // Add security headers (HSTS, CSP, etc.)
app.use(rateLimiters.general);      // Rate limiting to prevent abuse

// Session management for user state and CSRF protection
app.use(session(config.session));
app.use(requestLogger);             // Log all incoming requests

// Template engine setup
nunjucks.configure(['views', 'node_modules/govuk-frontend/dist'], {
    autoescape: true,
    express: app
});
app.set('view engine', 'njk');

// Static file serving for assets
app.use('/govuk/assets', express.static(path.join(__dirname, 'public/govuk/assets')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Request parsing and security
app.use(cors({ origin: config.security.corsOrigin }));  // Enable CORS with origin restrictions
app.use(bodyParser.json({ limit: '10mb' }));            // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' })); // Parse form data
app.use(sanitizeInput);                                  // Sanitize user input to prevent injection
app.use(csrfProtection);                                // CSRF token protection

/**
 * Route Mounting Strategy
 * 
 * Routes are mounted AFTER ApplicationService initialization to ensure
 * database connectivity and proper dependency injection. This prevents
 * "Database not connected" errors during startup.
 */

/**
 * Application Service and Server Initialization
 * 
 * The ApplicationService handles database operations and is injected into
 * route handlers using a dependency injection pattern. This ensures proper
 * initialization order and makes testing easier.
 */
const ApplicationService = require('./services/ApplicationService');
const applicationService = new ApplicationService();
const port = config.port || 3000;

/**
 * Start the server with proper initialization sequence
 * 
 * 1. Initialize ApplicationService (connects to database)
 * 2. Mount routes with service dependency injection
 * 3. Add error handling middleware (must be last)
 * 4. Start listening on the configured port
 */
async function startServer() {
    try {
        // Step 1: Initialize the application service (database connection, etc.)
        await applicationService.initialize();

        // Step 2: Mount all routes after successful initialization
        // User-facing routes (application submission, summary, etc.)
        const userRoutes = require('./routes/user')({ applicationService });
        app.use('/', userRoutes);
        
        // Admin routes (login, dashboard, application review)
        const adminRoutes = require('./routes/admin')({ applicationService });
        app.use('/admin', adminRoutes);
        
        // API routes (health checks, data endpoints)
        app.use('/api', require('./routes/api'));

        // Step 3: Error handling middleware (must be mounted last)
        app.use(notFoundHandler);  // Handle 404 errors
        app.use(errorHandler);     // Handle all other errors

        // Step 4: Start the HTTP server
        app.listen(port, () => {
            logger.info(`${config.app.name} started successfully`, {
                port,
                environment: config.NODE_ENV,
                version: config.app.version
            });
            
            // Console output for development
            console.log(`Alcohol License Training App running on http://localhost:${port}`);
            console.log('Available endpoints:');
            console.log('- GET  / (User application start)');
            console.log('- GET  /admin/login (Admin login)');
            console.log('- GET  /api/health (Health check)');
            console.log('- GET  /api/applications (All applications - API)');
            console.log('- POST /api/applications (Create application - API)');
            console.log('- PATCH /api/applications/:id/status (Update status - API)');
        });
    } catch (error) {
        logger.error('Failed to start server', { error: error.message });
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

/**
 * Graceful Shutdown Handlers
 * 
 * Handle SIGINT (Ctrl+C) and SIGTERM (Docker/process manager) signals
 * to ensure clean shutdown of database connections and resources.
 */
process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully');
    console.log('\nReceived SIGINT, shutting down gracefully...');
    try {
        await applicationService.close();
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown', { error: error.message });
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    try {
        await applicationService.close();
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown', { error: error.message });
        process.exit(1);
    }
});

// Initialize and start the server
startServer();