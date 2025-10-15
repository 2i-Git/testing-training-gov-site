const knexConfig = require('../knexfile');
const createKnex = require('knex');

class DatabaseError extends Error {
  constructor(message, code = 'DATABASE_ERROR') {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
  }
}

class Database {
  constructor() {
    this.knex = createKnex(knexConfig);
    this.isConnected = true; // Knex lazily connects
  }

  async connect() {
    // Simple connectivity check
    await this.knex.raw('select 1 as ok');
    return true;
  }

  async getAllApplications(limit = 50, offset = 0, status = null) {
    try {
      let q = this.knex('applications')
        .select(
          'application_id',
          'personal_details',
          'business_details',
          'license_details',
          'status',
          'submitted_at',
          'updated_at',
          'created_at'
        )
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);
      if (status) q = q.where({ status });
      const rows = await q;
      return rows.map(r => this.transformApplicationRow(r));
    } catch (err) {
      throw new DatabaseError(
        `Failed to get applications: ${err.message}`,
        'GET_APPLICATIONS_ERROR'
      );
    }
  }

  async getApplicationById(applicationId) {
    try {
      if (!applicationId) throw new DatabaseError('Application ID is required', 'INVALID_INPUT');
      const row = await this.knex('applications')
        .first(
          'application_id',
          'personal_details',
          'business_details',
          'license_details',
          'declaration',
          'status',
          'submitted_at',
          'updated_at',
          'created_at'
        )
        .where({ application_id: applicationId });
      return row ? this.transformApplicationRow(row) : null;
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError(`Failed to get application: ${err.message}`, 'GET_APPLICATION_ERROR');
    }
  }

  async createApplication(applicationData) {
    try {
      // Basic JSON validation
      JSON.stringify(applicationData.personalDetails);
      JSON.stringify(applicationData.businessDetails);
      JSON.stringify(applicationData.licenseDetails);

      await this.knex('applications').insert({
        application_id: applicationData.applicationId,
        personal_details: JSON.stringify(applicationData.personalDetails),
        business_details: JSON.stringify(applicationData.businessDetails),
        license_details: JSON.stringify(applicationData.licenseDetails),
        declaration: applicationData.declaration || 'yes',
        status: applicationData.status || 'submitted',
        submitted_at: applicationData.submittedAt || new Date().toISOString()
      });

      return { id: null, applicationId: applicationData.applicationId };
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT' || err.code === '23505') {
        throw new DatabaseError('Duplicate application_id', 'UNIQUE_VIOLATION');
      }
      throw new DatabaseError(
        `Failed to create application: ${err.message}`,
        'CREATE_APPLICATION_ERROR'
      );
    }
  }

  async updateApplicationStatus(applicationId, status) {
    try {
      const result = await this.knex('applications')
        .where({ application_id: applicationId })
        .update({ status, updated_at: this.knex.fn.now() });
      return { changes: result, applicationId };
    } catch (err) {
      throw new DatabaseError(
        `Failed to update application status: ${err.message}`,
        'UPDATE_STATUS_ERROR'
      );
    }
  }

  async deleteApplication(applicationId) {
    try {
      const changes = await this.knex('applications')
        .where({ application_id: applicationId })
        .del();
      return { changes, applicationId };
    } catch (err) {
      throw new DatabaseError(
        `Failed to delete application: ${err.message}`,
        'DELETE_APPLICATION_ERROR'
      );
    }
  }

  transformApplicationRow(row) {
    return {
      applicationId: row.application_id,
      personalDetails: JSON.parse(row.personal_details),
      businessDetails: JSON.parse(row.business_details),
      licenseDetails: JSON.parse(row.license_details),
      declaration: row.declaration,
      status: row.status,
      submittedAt: row.submitted_at,
      updatedAt: row.updated_at,
      createdAt: row.created_at
    };
  }

  async close() {
    await this.knex.destroy();
  }
}

module.exports = { Database, DatabaseError };
