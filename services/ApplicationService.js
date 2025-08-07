const { v4: uuidv4 } = require('uuid');
const { Database, DatabaseError } = require('../database/improved-database');
const { ValidationError, NotFoundError, AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

class ApplicationService {
  constructor() {
    this.db = new Database();
  }

  async initialize() {
    try {
      await this.db.connect();
    } catch (error) {
      throw new AppError('Failed to initialize application service', 500, 'INIT_ERROR');
    }
  }

  // Create a new application
  async createApplication(applicationData) {
    try {
      // Validate required data structure
      try {
        this.validateApplicationData(applicationData);
      } catch (validationError) {
        console.error('VALIDATION ERROR:', validationError.message, applicationData);
        throw validationError;
      }

      // Generate application ID
      const applicationId = uuidv4();

      // Prepare application data
      const application = {
        applicationId,
        personalDetails: this.sanitizePersonalDetails(applicationData.personalDetails),
        businessDetails: this.sanitizeBusinessDetails(applicationData.businessDetails),
        licenseDetails: this.sanitizeLicenseDetails(applicationData.licenseDetails),
        declaration: applicationData.declaration,
        status: 'submitted',
        submittedAt: new Date().toISOString()
      };

      // Save to database
      const result = await this.db.createApplication(application);

      return {
        applicationId: application.applicationId,
        status: application.status,
        submittedAt: application.submittedAt
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new AppError('Failed to create application', 500, 'CREATE_APPLICATION_ERROR');
    }
  }

  // Get application by ID
  async getApplication(applicationId) {
    try {
      if (!applicationId) {
        throw new ValidationError('Application ID is required');
      }

      const application = await this.db.getApplicationById(applicationId);
      
      if (!application) {
        throw new NotFoundError('Application');
      }

      return application;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new AppError('Failed to retrieve application', 500, 'GET_APPLICATION_ERROR');
    }
  }

  // Get all applications with pagination
  async getApplications(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        status = null
      } = options;

      // Validate parameters
      if (limit < 1 || limit > 100) {
        throw new ValidationError('Limit must be between 1 and 100');
      }

      if (offset < 0) {
        throw new ValidationError('Offset must be non-negative');
      }

      const applications = await this.db.getAllApplications(limit, offset, status);

      return {
        applications,
        pagination: {
          limit,
          offset,
          count: applications.length
        }
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new AppError('Failed to retrieve applications', 500, 'GET_APPLICATIONS_ERROR');
    }
  }

  // Update application status
  async updateApplicationStatus(applicationId, status) {
    try {
      const validStatuses = ['submitted', 'under-review', 'approved', 'rejected'];
      
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      // Check if application exists
      await this.getApplication(applicationId);

      const result = await this.db.updateApplicationStatus(applicationId, status);

      if (result.changes === 0) {
        throw new NotFoundError('Application');
      }

      return result;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new AppError('Failed to update application status', 500, 'UPDATE_STATUS_ERROR');
    }
  }

  // Delete application
  async deleteApplication(applicationId) {
    try {
      // Check if application exists
      await this.getApplication(applicationId);

      const result = await this.db.deleteApplication(applicationId);

      if (result.changes === 0) {
        throw new NotFoundError('Application');
      }

      return result;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new AppError('Failed to delete application', 500, 'DELETE_APPLICATION_ERROR');
    }
  }

  // Process application from form data
  async processApplicationFromFormData(sessionData, declaration) {
    try {
      if (!sessionData) {
        logger.error('VALIDATION ERROR: No form data provided', { sessionData });
        throw new ValidationError('No form data provided');
      }

      if (!declaration || declaration !== 'yes') {
        logger.error('VALIDATION ERROR: Declaration must be confirmed', { declaration });
        throw new ValidationError('Declaration must be confirmed');
      }

      const applicationData = {
        personalDetails: this.extractPersonalDetails(sessionData),
        businessDetails: this.extractBusinessDetails(sessionData),
        licenseDetails: this.extractLicenseDetails(sessionData),
        declaration: declaration
      };

      try {
        this.validateApplicationData(applicationData);
      } catch (validationError) {
        logger.error('VALIDATION ERROR:', {
          error: validationError.message,
          applicationData
        });
        throw validationError;
      }

      return await this.createApplication(applicationData);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.error('PROCESS FORM VALIDATION ERROR:', { error: error.message });
        throw error;
      }
      logger.error('PROCESS FORM ERROR:', { error: error.message });
      throw new AppError('Failed to process form data', 500, 'PROCESS_FORM_ERROR');
    }
  }

  // Data validation helpers
  validateApplicationData(data) {
    const requiredFields = ['personalDetails', 'businessDetails', 'licenseDetails'];
    for (const field of requiredFields) {
      if (!data[field] || typeof data[field] !== 'object') {
        logger.error('VALIDATION ERROR: Missing or invalid field', { field, value: data[field] });
        throw new ValidationError(`${field} is required and must be an object`);
      }
    }

    // Validate personal details structure
    const personalRequired = ['firstName', 'lastName', 'email', 'phoneNumber'];
    for (const field of personalRequired) {
      if (!data.personalDetails[field]) {
        logger.error('VALIDATION ERROR: Missing personal detail', { field, value: data.personalDetails[field] });
        throw new ValidationError(`Personal details: ${field} is required`);
      }
    }

    // Validate business details structure
    const businessRequired = ['businessName', 'businessType'];
    for (const field of businessRequired) {
      if (!data.businessDetails[field]) {
        logger.error('VALIDATION ERROR: Missing business detail', { field, value: data.businessDetails[field] });
        throw new ValidationError(`Business details: ${field} is required`);
      }
    }

    // Validate license details structure
    const licenseRequired = ['licenseType', 'premisesType'];
    for (const field of licenseRequired) {
      if (!data.licenseDetails[field]) {
        logger.error('VALIDATION ERROR: Missing license detail', { field, value: data.licenseDetails[field] });
        throw new ValidationError(`License details: ${field} is required`);
      }
    }
  }

  // Data extraction helpers
  extractPersonalDetails(sessionData) {
    return {
      firstName: sessionData.firstName,
      lastName: sessionData.lastName,
      dobDay: sessionData.dobDay,
      dobMonth: sessionData.dobMonth,
      dobYear: sessionData.dobYear,
      email: sessionData.email,
      phoneNumber: sessionData.phoneNumber,
      addressLine1: sessionData.addressLine1,
      addressLine2: sessionData.addressLine2 || '',
      addressTown: sessionData.addressTown,
      addressCounty: sessionData.addressCounty || '',
      addressPostcode: sessionData.addressPostcode
    };
  }

  extractBusinessDetails(sessionData) {
    return {
      businessName: sessionData.businessName,
      companyNumber: sessionData.companyNumber || '',
      businessType: sessionData.businessType,
      businessAddressLine1: sessionData.businessAddressLine1,
      businessAddressLine2: sessionData.businessAddressLine2 || '',
      businessAddressTown: sessionData.businessAddressTown,
      businessAddressCounty: sessionData.businessAddressCounty || '',
      businessAddressPostcode: sessionData.businessAddressPostcode,
      businessPhone: sessionData.businessPhone,
      businessEmail: sessionData.businessEmail || ''
    };
  }

  extractLicenseDetails(sessionData) {
    return {
      licenseType: sessionData.licenseType,
      premisesType: sessionData.premisesType,
      premisesAddressLine1: sessionData.premisesAddressLine1,
      premisesAddressLine2: sessionData.premisesAddressLine2 || '',
      premisesAddressTown: sessionData.premisesAddressTown,
      premisesAddressCounty: sessionData.premisesAddressCounty || '',
      premisesAddressPostcode: sessionData.premisesAddressPostcode,
      activities: sessionData.activities || [],
      operatingHours: {
        monday: sessionData.mondayHours || '',
        tuesday: sessionData.tuesdayHours || '',
        wednesday: sessionData.wednesdayHours || '',
        thursday: sessionData.thursdayHours || '',
        friday: sessionData.fridayHours || '',
        saturday: sessionData.saturdayHours || '',
        sunday: sessionData.sundayHours || ''
      }
    };
  }

  // Data sanitization helpers
  sanitizePersonalDetails(details) {
    return {
      ...details,
      firstName: this.sanitizeString(details.firstName),
      lastName: this.sanitizeString(details.lastName),
      email: details.email.toLowerCase().trim(),
      phoneNumber: this.sanitizePhone(details.phoneNumber),
      addressLine1: this.sanitizeString(details.addressLine1),
      addressLine2: this.sanitizeString(details.addressLine2 || ''),
      addressTown: this.sanitizeString(details.addressTown),
      addressCounty: this.sanitizeString(details.addressCounty || ''),
      addressPostcode: this.sanitizePostcode(details.addressPostcode)
    };
  }

  sanitizeBusinessDetails(details) {
    return {
      ...details,
      businessName: this.sanitizeString(details.businessName),
      companyNumber: this.sanitizeString(details.companyNumber || ''),
      businessAddressLine1: this.sanitizeString(details.businessAddressLine1),
      businessAddressLine2: this.sanitizeString(details.businessAddressLine2 || ''),
      businessAddressTown: this.sanitizeString(details.businessAddressTown),
      businessAddressCounty: this.sanitizeString(details.businessAddressCounty || ''),
      businessAddressPostcode: this.sanitizePostcode(details.businessAddressPostcode),
      businessPhone: this.sanitizePhone(details.businessPhone),
      businessEmail: (details.businessEmail || '').toLowerCase().trim()
    };
  }

  sanitizeLicenseDetails(details) {
    let activities = details.activities;
    if (activities && !Array.isArray(activities)) {
      activities = [activities];
    }
    return {
      ...details,
      activities,
      premisesAddressLine1: this.sanitizeString(details.premisesAddressLine1),
      premisesAddressLine2: this.sanitizeString(details.premisesAddressLine2 || ''),
      premisesAddressTown: this.sanitizeString(details.premisesAddressTown),
      premisesAddressCounty: this.sanitizeString(details.premisesAddressCounty || ''),
      premisesAddressPostcode: this.sanitizePostcode(details.premisesAddressPostcode)
    };
  }

  // Utility sanitization methods
  sanitizeString(str) {
    return str ? str.trim().replace(/\s+/g, ' ') : '';
  }

  sanitizePhone(phone) {
    return phone ? phone.replace(/\s/g, '') : '';
  }

  sanitizePostcode(postcode) {
    return postcode ? postcode.toUpperCase().replace(/\s+/g, ' ').trim() : '';
  }

  // Cleanup
  async close() {
    await this.db.close();
  }
}

module.exports = ApplicationService;
