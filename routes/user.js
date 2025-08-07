const express = require('express');
const router = express.Router();
const { personalDetailsValidation, businessDetailsValidation, licenseDetailsValidation, declarationValidation } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
// Use the initialized applicationService from server.js
let applicationService;
const { rateLimiters } = require('../middleware/security');
const { logger, logApplicationEvent } = require('../utils/logger');

// applicationService will be injected by server.js
// Export a function to inject dependencies
module.exports = (deps) => {
  applicationService = deps.applicationService;
  return router;
};

const users = [
  { email: 'user@example.com', password: 'password123' }
];

function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/login');
}

router.get('/login', (req, res) => {
  res.render('login', { csrfToken: res.locals.csrfToken });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    req.session.user = { email: user.email };
    return res.redirect('/personal-details');
  }
  res.render('login', { error: 'Invalid email or password', csrfToken: res.locals.csrfToken });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

router.get('/', (req, res) => {
  logApplicationEvent('homepage_visited', { ip: req.ip });
  res.render('index', { csrfToken: res.locals.csrfToken });
});

router.get('/personal-details', requireAuth, (req, res) => {
  res.render('personal-details', { 
    errors: [], 
    data: req.session.data || {},
    csrfToken: res.locals.csrfToken
  });
});

router.post('/personal-details', requireAuth,
  rateLimiters.forms,
  personalDetailsValidation,
  asyncHandler(async (req, res) => {
    if (req.validationErrors) {
      return res.render('personal-details', {
        errors: req.validationErrors,
        data: req.body,
        csrfToken: res.locals.csrfToken
      });
    }
    let activities = req.body.activities;
    if (activities && !Array.isArray(activities)) {
      activities = [activities];
    }
    req.session.data = { ...req.session.data, ...req.body, activities };
    logApplicationEvent('personal_details_submitted', { sessionId: req.sessionID, ip: req.ip });
    res.redirect('/business-details');
  })
);

router.get('/business-details', requireAuth, (req, res) => {
  res.render('business-details', { 
    errors: [], 
    data: req.session.data || {},
    csrfToken: res.locals.csrfToken
  });
});

router.post('/business-details', requireAuth,
  rateLimiters.forms,
  businessDetailsValidation,
  asyncHandler(async (req, res) => {
    if (req.validationErrors) {
      return res.render('business-details', {
        errors: req.validationErrors,
        data: req.body,
        csrfToken: res.locals.csrfToken
      });
    }
    req.session.data = { ...req.session.data, ...req.body };
    logApplicationEvent('business_details_submitted', { sessionId: req.sessionID, ip: req.ip });
    res.redirect('/license-details');
  })
);

router.get('/license-details', requireAuth, (req, res) => {
  res.render('license-details', { 
    errors: [], 
    data: req.session.data || {},
    csrfToken: res.locals.csrfToken
  });
});

router.post('/license-details', requireAuth,
  rateLimiters.forms,
  licenseDetailsValidation,
  asyncHandler(async (req, res) => {
    if (req.validationErrors) {
      return res.render('license-details', {
        errors: req.validationErrors,
        data: req.body,
        csrfToken: res.locals.csrfToken
      });
    }
    // Ensure activities is always an array
    let activities = req.body.activities;
    if (activities && !Array.isArray(activities)) {
      activities = [activities];
    }
    req.session.data = { ...req.session.data, ...req.body, activities };
    logApplicationEvent('license_details_submitted', { sessionId: req.sessionID, ip: req.ip });
    res.redirect('/summary');
  })
);

router.get('/summary', requireAuth, (req, res) => {
  // Debug log to see session data
  logger.info('Summary page data', {
    sessionData: req.session.data,
    activities: req.session.data?.activities,
    activitiesType: typeof req.session.data?.activities,
    sessionId: req.sessionID
  });
  
  res.render('summary', {
    data: req.session.data || {},
    errors: [],
    csrfToken: res.locals.csrfToken
  });
});

router.post('/summary', requireAuth,
  rateLimiters.forms,
  declarationValidation,
  asyncHandler(async (req, res) => {
    if (req.validationErrors) {
      return res.render('summary', {
        errors: req.validationErrors,
        data: req.session.data || {},
        csrfToken: res.locals.csrfToken
      });
    }
    try {
      logger.error('DEBUG SUBMISSION', {
        sessionData: req.session.data,
        declaration: req.body.declaration
      });
      const result = await applicationService.processApplicationFromFormData(
        req.session.data,
        req.body.declaration
      );
      req.session.applicationId = result.applicationId;
      logApplicationEvent('application_submitted', {
        applicationId: result.applicationId,
        sessionId: req.sessionID,
        ip: req.ip
      });
      res.redirect('/confirmation');
    } catch (error) {
      logger.error('Application submission failed', { 
        error: error.message,
        stack: error.stack,
        sessionData: req.session.data,
        declaration: req.body.declaration,
        sessionId: req.sessionID,
        ip: req.ip 
      });
      return res.status(500).render('summary', {
        errors: [{ msg: 'An error occurred while submitting your application. Please try again.' }],
        data: req.session.data || {},
        csrfToken: res.locals.csrfToken
      });
    }
  })
);

router.get('/confirmation', (req, res) => {
  res.render('confirmation', {
    applicationId: req.session.applicationId || null
  });
});

// Remove default export; only use dependency-injected export above
