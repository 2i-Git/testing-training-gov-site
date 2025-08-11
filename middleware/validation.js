const { body, validationResult } = require('express-validator');

// Custom validation helpers
const validators = {
  ukPostcode: value => {
    const postcodeRegex = /^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][A-Z]{2}$/i;
    return postcodeRegex.test(value.trim());
  },

  ukPhone: value => {
    // Enhanced UK phone validation
    const cleanPhone = value.replace(/\s/g, '');
    return /^(\+44|0)[1-9]\d{8,9}$/.test(cleanPhone);
  },

  dateOfBirth: (day, month, year) => {
    const date = new Date(year, month - 1, day);
    const now = new Date();

    // Check if date is valid
    if (date.getDate() != day || date.getMonth() != month - 1 || date.getFullYear() != year) {
      return false;
    }

    // Check age requirements (must be 18+)
    const age = now.getFullYear() - date.getFullYear();
    const monthDiff = now.getMonth() - date.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
      return age - 1 >= 18;
    }

    return age >= 18;
  },

  businessType: value => {
    const validTypes = [
      'pub',
      'restaurant',
      'bar',
      'nightclub',
      'hotel',
      'off-licence',
      'supermarket',
      'other'
    ];
    return validTypes.includes(value);
  },

  licenseType: value => {
    const validTypes = ['premises', 'club', 'personal'];
    return validTypes.includes(value);
  },

  premisesType: value => {
    const validTypes = [
      'pub',
      'restaurant',
      'bar',
      'nightclub',
      'hotel',
      'off-licence',
      'supermarket',
      'other'
    ];
    return validTypes.includes(value);
  },

  companyNumber: value => {
    // UK company number validation (8 digits)
    return /^\d{8}$/.test(value);
  }
};

// Validation rules for each form step
const personalDetailsValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .matches(/^[A-Za-z\s\-'.]+$/)
    .withMessage('First name contains invalid characters'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .matches(/^[A-Za-z\s\-'.]+$/)
    .withMessage('Last name contains invalid characters'),

  body('dobDay').isInt({ min: 1, max: 31 }).withMessage('Enter a valid day'),

  body('dobMonth').isInt({ min: 1, max: 12 }).withMessage('Enter a valid month'),

  body('dobYear')
    .isInt({ min: 1900, max: new Date().getFullYear() - 18 })
    .withMessage('Enter a valid year'),

  // Custom validation for date of birth
  body('dobDay').custom((day, { req }) => {
    const { dobMonth, dobYear } = req.body;
    if (!validators.dateOfBirth(parseInt(day), parseInt(dobMonth), parseInt(dobYear))) {
      throw new Error('You must be at least 18 years old and provide a valid date of birth');
    }
    return true;
  }),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Enter a valid email address')
    .normalizeEmail(),

  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .custom(value => {
      if (!validators.ukPhone(value)) {
        throw new Error('Enter a valid UK phone number');
      }
      return true;
    }),

  body('addressLine1')
    .trim()
    .notEmpty()
    .withMessage('Address line 1 is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Address line 1 must be between 1 and 100 characters'),

  body('addressLine2')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Address line 2 must not exceed 100 characters'),

  body('addressTown')
    .trim()
    .notEmpty()
    .withMessage('Town or city is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Town or city must be between 1 and 50 characters'),

  body('addressCounty')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('County must not exceed 50 characters'),

  body('addressPostcode')
    .trim()
    .notEmpty()
    .withMessage('Postcode is required')
    .custom(value => {
      if (!validators.ukPostcode(value)) {
        throw new Error('Enter a valid UK postcode');
      }
      return true;
    })
];

const businessDetailsValidation = [
  body('businessName')
    .trim()
    .notEmpty()
    .withMessage('Business name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),

  body('companyNumber')
    .optional({ checkFalsy: true })
    .trim()
    .custom(value => {
      if (value && !validators.companyNumber(value)) {
        throw new Error('Company registration number must be 8 digits');
      }
      return true;
    }),

  body('businessType')
    .notEmpty()
    .withMessage('Business type is required')
    .custom(value => {
      if (!validators.businessType(value)) {
        throw new Error('Select a valid business type');
      }
      return true;
    }),

  body('businessAddressLine1')
    .trim()
    .notEmpty()
    .withMessage('Business address line 1 is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Business address line 1 must be between 1 and 100 characters'),

  body('businessAddressLine2')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Business address line 2 must not exceed 100 characters'),

  body('businessAddressTown')
    .trim()
    .notEmpty()
    .withMessage('Business town or city is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Business town or city must be between 1 and 50 characters'),

  body('businessAddressCounty')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Business county must not exceed 50 characters'),

  body('businessAddressPostcode')
    .trim()
    .notEmpty()
    .withMessage('Business postcode is required')
    .custom(value => {
      if (!validators.ukPostcode(value)) {
        throw new Error('Enter a valid UK postcode for business address');
      }
      return true;
    }),

  body('businessPhone')
    .trim()
    .notEmpty()
    .withMessage('Business phone number is required')
    .custom(value => {
      if (!validators.ukPhone(value)) {
        throw new Error('Enter a valid UK business phone number');
      }
      return true;
    }),

  body('businessEmail')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Enter a valid business email address')
    .normalizeEmail()
];

const licenseDetailsValidation = [
  body('licenseType')
    .notEmpty()
    .withMessage('License type is required')
    .custom(value => {
      if (!validators.licenseType(value)) {
        throw new Error('Select a valid license type');
      }
      return true;
    }),

  body('premisesType')
    .notEmpty()
    .withMessage('Premises type is required')
    .custom(value => {
      if (!validators.premisesType(value)) {
        throw new Error('Select a valid premises type');
      }
      return true;
    }),

  body('premisesAddressLine1')
    .trim()
    .notEmpty()
    .withMessage('Premises address line 1 is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Premises address line 1 must be between 1 and 100 characters'),

  body('premisesAddressLine2')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Premises address line 2 must not exceed 100 characters'),

  body('premisesAddressTown')
    .trim()
    .notEmpty()
    .withMessage('Premises town or city is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Premises town or city must be between 1 and 50 characters'),

  body('premisesAddressCounty')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Premises county must not exceed 50 characters'),

  body('premisesAddressPostcode')
    .trim()
    .notEmpty()
    .withMessage('Premises postcode is required')
    .custom(value => {
      if (!validators.ukPostcode(value)) {
        throw new Error('Enter a valid UK postcode for premises address');
      }
      return true;
    }),

  body('activities').custom((value, { req }) => {
    if (
      !req.body.activities ||
      (Array.isArray(req.body.activities) && req.body.activities.length === 0)
    ) {
      throw new Error('Select at least one activity');
    }

    const validActivities = [
      'sale-on',
      'sale-off',
      'regulated-entertainment',
      'late-night-refreshment',
      'live-music',
      'recorded-music'
    ];

    const activities = Array.isArray(req.body.activities)
      ? req.body.activities
      : [req.body.activities];

    for (const activity of activities) {
      if (!validActivities.includes(activity)) {
        throw new Error('Invalid activity selected');
      }
    }

    return true;
  })

  // No validation for operating hours fields
];

const declarationValidation = [
  body('declaration')
    .notEmpty()
    .withMessage('You must confirm that the information you have provided is correct')
    .equals('yes')
    .withMessage('You must confirm the declaration to continue')
];

// Validation middleware factory
const createValidationMiddleware = validationRules => {
  return [
    ...validationRules,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Format errors for template rendering
        const formattedErrors = errors.array().map(error => ({
          msg: error.msg,
          path: error.path,
          value: error.value
        }));

        // Return JSON for API endpoints
        if (req.path.startsWith('/api/')) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: formattedErrors
          });
        }

        // Store errors in flash messages for form endpoints
        req.validationErrors = formattedErrors;
        return next();
      }
      next();
    }
  ];
};

module.exports = {
  validators,
  personalDetailsValidation: createValidationMiddleware(personalDetailsValidation),
  businessDetailsValidation: createValidationMiddleware(businessDetailsValidation),
  licenseDetailsValidation: createValidationMiddleware(licenseDetailsValidation),
  declarationValidation: createValidationMiddleware(declarationValidation),

  // Export raw validation rules for API use
  rawValidation: {
    personalDetailsValidation,
    businessDetailsValidation,
    licenseDetailsValidation,
    declarationValidation
  }
};
