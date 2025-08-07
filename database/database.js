const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'alcohol_license.db');
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.init();
            }
        });
    }

    init() {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                application_id TEXT UNIQUE NOT NULL,
                personal_details TEXT NOT NULL,
                business_details TEXT NOT NULL,
                license_details TEXT NOT NULL,
                status TEXT DEFAULT 'submitted',
                submitted_at TEXT NOT NULL,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `;

        this.db.run(createTableQuery, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            } else {
                console.log('Database table initialized successfully');
            }
        });
    }

    async getAllApplications() {
        return new Promise((resolve, reject) => {
            const query = `
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
                ORDER BY created_at DESC
            `;

            this.db.all(query, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const applications = rows.map(row => ({
                        applicationId: row.application_id,
                        personalDetails: JSON.parse(row.personal_details),
                        businessDetails: JSON.parse(row.business_details),
                        licenseDetails: JSON.parse(row.license_details),
                        status: row.status,
                        submittedAt: row.submitted_at,
                        updatedAt: row.updated_at,
                        createdAt: row.created_at
                    }));
                    resolve(applications);
                }
            });
        });
    }

    async getApplicationById(applicationId) {
        return new Promise((resolve, reject) => {
            const query = `
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
                WHERE application_id = ?
            `;

            this.db.get(query, [applicationId], (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve(null);
                } else {
                    const application = {
                        applicationId: row.application_id,
                        personalDetails: JSON.parse(row.personal_details),
                        businessDetails: JSON.parse(row.business_details),
                        licenseDetails: JSON.parse(row.license_details),
                        status: row.status,
                        submittedAt: row.submitted_at,
                        updatedAt: row.updated_at,
                        createdAt: row.created_at
                    };
                    resolve(application);
                }
            });
        });
    }

    async createApplication(applicationData) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO applications (
                    application_id,
                    personal_details,
                    business_details,
                    license_details,
                    status,
                    submitted_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            `;

            const values = [
                applicationData.applicationId,
                JSON.stringify(applicationData.personalDetails),
                JSON.stringify(applicationData.businessDetails),
                JSON.stringify(applicationData.licenseDetails),
                applicationData.status,
                applicationData.submittedAt
            ];

            this.db.run(query, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        applicationId: applicationData.applicationId
                    });
                }
            });
        });
    }

    async updateApplicationStatus(applicationId, status) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE applications 
                SET status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE application_id = ?
            `;

            this.db.run(query, [status, applicationId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        changes: this.changes,
                        applicationId: applicationId
                    });
                }
            });
        });
    }

    async deleteApplication(applicationId) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM applications WHERE application_id = ?';

            this.db.run(query, [applicationId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        changes: this.changes,
                        applicationId: applicationId
                    });
                }
            });
        });
    }

    close() {
        return new Promise((resolve) => {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed');
                }
                resolve();
            });
        });
    }
}

module.exports = Database;
