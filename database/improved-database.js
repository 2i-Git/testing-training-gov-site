const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const config = require('../config/config');

class DatabaseError extends Error {
  constructor(message, code = 'DATABASE_ERROR') {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
  }
}

class Database {
  constructor() {
    this.dbPath = config.database.path;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(new DatabaseError(`Failed to connect to database: ${err.message}`, 'CONNECTION_ERROR'));
        } else {
          console.log('Connected to SQLite database');
          this.isConnected = true;
          this.init().then(resolve).catch(reject);
        }
      });
    });
  }

  async init() {
    try {
      // Enable foreign keys
      await this.run('PRAGMA foreign_keys = ON');

      // Create applications table with better schema
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS applications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          application_id TEXT UNIQUE NOT NULL,
          personal_details TEXT NOT NULL,
          business_details TEXT NOT NULL,
          license_details TEXT NOT NULL,
          declaration TEXT,
          status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted', 'under-review', 'approved', 'rejected')),
          submitted_at TEXT NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT valid_json_personal CHECK(json_valid(personal_details)),
          CONSTRAINT valid_json_business CHECK(json_valid(business_details)),
          CONSTRAINT valid_json_license CHECK(json_valid(license_details))
        )
      `;
      await this.run(createTableQuery);

      // Ensure all required columns exist (auto-migrate)
      const requiredColumns = [
        { name: 'declaration', type: 'TEXT' },
        { name: 'status', type: "TEXT DEFAULT 'submitted'" },
        { name: 'submitted_at', type: 'TEXT' },
        { name: 'updated_at', type: 'TEXT DEFAULT CURRENT_TIMESTAMP' },
        { name: 'created_at', type: 'TEXT DEFAULT CURRENT_TIMESTAMP' }
      ];
      const pragma = await new Promise((resolve, reject) => {
        this.db.all('PRAGMA table_info(applications)', [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      const existingColumns = pragma.map(col => col.name);
      for (const col of requiredColumns) {
        if (!existingColumns.includes(col.name)) {
          await this.run(`ALTER TABLE applications ADD COLUMN ${col.name} ${col.type}`);
          console.log(`Added missing column '${col.name}' to applications table.`);
        }
      }

      // Create indexes for better performance
      await this.run('CREATE INDEX IF NOT EXISTS idx_application_id ON applications(application_id)');
      await this.run('CREATE INDEX IF NOT EXISTS idx_status ON applications(status)');
      await this.run('CREATE INDEX IF NOT EXISTS idx_submitted_at ON applications(submitted_at)');

      console.log('Database table initialized and migrated successfully');
    } catch (error) {
      throw new DatabaseError(`Failed to initialize database: ${error.message}`, 'INIT_ERROR');
    }
  }

  // Promisified database operations
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new DatabaseError('Database not connected', 'NOT_CONNECTED'));
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(new DatabaseError(`Query failed: ${err.message}`, 'QUERY_ERROR'));
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new DatabaseError('Database not connected', 'NOT_CONNECTED'));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(new DatabaseError(`Query failed: ${err.message}`, 'QUERY_ERROR'));
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new DatabaseError('Database not connected', 'NOT_CONNECTED'));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(new DatabaseError(`Query failed: ${err.message}`, 'QUERY_ERROR'));
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Improved application methods with better error handling and validation
  async getAllApplications(limit = 50, offset = 0, status = null) {
    try {
      let query = `
        SELECT 
          application_id,
          personal_details,
          business_details,
          license_details,
          status,
          submitted_at,
          updated_at,
          created_at
        FROM applications
      `;
      
      const params = [];
      
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const rows = await this.all(query, params);
      
      return rows.map(row => this.transformApplicationRow(row));
    } catch (error) {
      throw new DatabaseError(`Failed to get applications: ${error.message}`, 'GET_APPLICATIONS_ERROR');
    }
  }

  async getApplicationById(applicationId) {
    try {
      if (!applicationId) {
        throw new DatabaseError('Application ID is required', 'INVALID_INPUT');
      }

      const query = `
        SELECT 
          application_id,
          personal_details,
          business_details,
          license_details,
          declaration,
          status,
          submitted_at,
          updated_at,
          created_at
        FROM applications 
        WHERE application_id = ?
      `;

      const row = await this.get(query, [applicationId]);
      
      return row ? this.transformApplicationRow(row) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to get application: ${error.message}`, 'GET_APPLICATION_ERROR');
    }
  }

  async createApplication(applicationData) {
    try {
      // Validate required fields
      const requiredFields = ['applicationId', 'personalDetails', 'businessDetails', 'licenseDetails'];
      for (const field of requiredFields) {
        if (!applicationData[field]) {
          throw new DatabaseError(`Missing required field: ${field}`, 'VALIDATION_ERROR');
        }
      }

      // Validate JSON data
      try {
        JSON.stringify(applicationData.personalDetails);
        JSON.stringify(applicationData.businessDetails);
        JSON.stringify(applicationData.licenseDetails);
      } catch (jsonError) {
        throw new DatabaseError('Invalid JSON data in application details', 'INVALID_JSON');
      }

      const query = `
        INSERT INTO applications (
          application_id,
          personal_details,
          business_details,
          license_details,
          declaration,
          status,
          submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        applicationData.applicationId,
        JSON.stringify(applicationData.personalDetails),
        JSON.stringify(applicationData.businessDetails),
        JSON.stringify(applicationData.licenseDetails),
        applicationData.declaration || null,
        applicationData.status || 'submitted',
        applicationData.submittedAt || new Date().toISOString()
      ];

      const result = await this.run(query, values);
      
      return {
        id: result.id,
        applicationId: applicationData.applicationId
      };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to create application: ${error.message}`, 'CREATE_APPLICATION_ERROR');
    }
  }

  async updateApplicationStatus(applicationId, status) {
    try {
      const validStatuses = ['submitted', 'under-review', 'approved', 'rejected'];
      if (!validStatuses.includes(status)) {
        throw new DatabaseError(`Invalid status: ${status}`, 'INVALID_STATUS');
      }

      const query = `
        UPDATE applications 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE application_id = ?
      `;

      const result = await this.run(query, [status, applicationId]);
      
      return {
        changes: result.changes,
        applicationId: applicationId
      };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update application status: ${error.message}`, 'UPDATE_STATUS_ERROR');
    }
  }

  async deleteApplication(applicationId) {
    try {
      const result = await this.run('DELETE FROM applications WHERE application_id = ?', [applicationId]);
      
      return {
        changes: result.changes,
        applicationId: applicationId
      };
    } catch (error) {
      throw new DatabaseError(`Failed to delete application: ${error.message}`, 'DELETE_APPLICATION_ERROR');
    }
  }

  // Helper method to transform database rows
  transformApplicationRow(row) {
    try {
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
    } catch (error) {
      throw new DatabaseError(`Failed to parse application data: ${error.message}`, 'PARSE_ERROR');
    }
  }

  // Database backup
  async backup(backupPath) {
    try {
      await fs.copyFile(this.dbPath, backupPath);
      console.log(`Database backed up to: ${backupPath}`);
    } catch (error) {
      throw new DatabaseError(`Failed to backup database: ${error.message}`, 'BACKUP_ERROR');
    }
  }

  async close() {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed');
        }
        this.isConnected = false;
        resolve();
      });
    });
  }
}

module.exports = { Database, DatabaseError };
