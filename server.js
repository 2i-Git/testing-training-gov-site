
const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const nunjucks = require('nunjucks');
const session = require('express-session');
const bodyParser = require('body-parser');

const config = require('./config/config');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { securityHeaders, rateLimiters, sanitizeInput, csrfProtection } = require('./middleware/security');
const { logger, requestLogger, logApplicationEvent } = require('./utils/logger');
// Simple admin user store
const adminUsers = [
  { email: 'admin@example.com', password: 'admin123' }
];

nunjucks.configure(['views', 'node_modules/govuk-frontend/dist'], {
    autoescape: true,
    express: app
});

// Middleware setup
app.use(securityHeaders);
app.use(rateLimiters.general);
app.use(session(config.session));
app.use(requestLogger);
nunjucks.configure(['views', 'node_modules/govuk-frontend/dist'], {
    autoescape: true,
    express: app
});
app.set('view engine', 'njk');
app.use('/govuk/assets', express.static(path.join(__dirname, 'public/govuk/assets')));
app.use(cors({ origin: config.security.corsOrigin }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);
app.use(csrfProtection);
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Mount routes
// Do NOT mount any routes at top level; mount all inside startServer after initialization
// Do NOT mount user routes here; they will be mounted after initialization

// Error handling middleware will be added AFTER routes are mounted in startServer

// Application service initialization and server start

const ApplicationService = require('./services/ApplicationService');
const applicationService = new ApplicationService();
const port = config.port || 3000;

async function startServer() {
    try {
        await applicationService.initialize();


        // Mount all routes after initialization
        const userRoutes = require('./routes/user')({ applicationService });
        app.use('/', userRoutes);
        const adminRoutes = require('./routes/admin')({ applicationService });
        app.use('/admin', adminRoutes);
        app.use('/api', require('./routes/api'));

        // Error handling middleware (must be last)
        app.use(notFoundHandler);
        app.use(errorHandler);

        app.listen(port, () => {
            logger.info(`${config.app.name} started successfully`, {
                port,
                environment: config.NODE_ENV,
                version: config.app.version
            });
            console.log(`Alcohol License Training App running on http://localhost:${port}`);
            console.log('Available endpoints:');
            console.log('- GET  /api/health');
            console.log('- GET  /api/applications');
            console.log('- GET  /api/applications/:id');
            console.log('- POST /api/applications');
            console.log('- PATCH /api/applications/:id/status');
            console.log('- DELETE /api/applications/:id');
        });
    } catch (error) {
        logger.error('Failed to start server', { error: error.message });
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

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

startServer();



