const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { rateLimiters } = require('../middleware/security');

module.exports = function createApiRouter(deps = {}) {
  const router = express.Router();
  const applicationService =
    deps.applicationService || new (require('../services/ApplicationService'))();

  // Health check endpoint
  router.get('/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: require('../config/config').app.version
    });
  });

  // Get all applications
  router.get(
    '/applications',
    rateLimiters.api,
    asyncHandler(async (req, res) => {
      const { limit, offset, status } = req.query;
      const result = await applicationService.getApplications({
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        status
      });
      res.json({ success: true, data: result.applications, pagination: result.pagination });
    })
  );

  // Get application by ID
  router.get(
    '/applications/:id',
    rateLimiters.api,
    asyncHandler(async (req, res) => {
      const application = await applicationService.getApplication(req.params.id);
      res.json({ success: true, data: application });
    })
  );

  // Create new application
  router.post(
    '/applications',
    rateLimiters.api,
    asyncHandler(async (req, res) => {
      const result = await applicationService.createApplication(req.body);
      res.status(201).json({ success: true, data: result });
    })
  );

  // Update status
  router.patch(
    '/applications/:id/status',
    rateLimiters.api,
    asyncHandler(async (req, res) => {
      await applicationService.updateApplicationStatus(req.params.id, req.body.status);
      res.json({ success: true, message: 'Application status updated successfully' });
    })
  );

  // Delete application
  router.delete(
    '/applications/:id',
    rateLimiters.api,
    asyncHandler(async (req, res) => {
      await applicationService.deleteApplication(req.params.id);
      res.json({ success: true, message: 'Application deleted successfully' });
    })
  );

  return router;
};
