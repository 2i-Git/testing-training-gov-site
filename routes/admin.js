const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
// Use the initialized applicationService from server.js
let applicationService;
let authService;

// Admin users are stored in the database (users.role = 'admin')

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  return res.redirect('/admin/login');
}

router.get('/login', (req, res) => {
  res.render('admin-login', { csrfToken: res.locals.csrfToken });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await authService.findUserByEmail(email);
    if (
      admin &&
      admin.role === 'admin' &&
      (await authService.verifyPassword(password, admin.password_hash))
    ) {
      req.session.admin = { id: admin.id, email: admin.email };
      return req.session.save(() => res.redirect('/admin/applications'));
    }
  } catch {
    // fallthrough
  }
  res.render('admin-login', {
    error: 'Invalid email or password',
    csrfToken: res.locals.csrfToken
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

router.get(
  '/applications',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await applicationService.getApplications({ limit: 100, offset: 0 });
    res.render('admin-applications', {
      applications: result.applications,
      csrfToken: res.locals.csrfToken,
      error: req.query.error || null,
      success: req.query.success || null
    });
  })
);

router.post(
  '/applications/:id/status',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const applicationId = req.params.id;

    console.log('Status update request:', {
      applicationId,
      newStatus: status,
      validStatuses: ['approved', 'rejected']
    });

    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      console.log('Invalid status provided:', status);
      return res.status(400).send('Invalid status');
    }

    try {
      const result = await applicationService.updateApplicationStatus(applicationId, status);
      console.log('Status update result:', result);

      // Add success message
      const successMessage =
        status === 'approved'
          ? 'Application approved successfully'
          : 'Application rejected successfully';
      res.redirect('/admin/applications?success=' + encodeURIComponent(successMessage));
    } catch (error) {
      console.error('Error updating application status:', error);
      res.redirect(
        '/admin/applications?error=' + encodeURIComponent('Failed to update application status')
      );
    }
  })
);

// Export a function to inject dependencies
module.exports = deps => {
  applicationService = deps.applicationService;
  authService = deps.authService;
  return router;
};
