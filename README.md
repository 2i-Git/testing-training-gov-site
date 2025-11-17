# Alcohol License Training Application

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4+-blue.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3+-lightgrey.svg)](https://sqlite.org/)
[![Docker](https://img.shields.io/badge/Docker-Supported-blue.svg)](https://docker.com/)
[![GOV.UK Design System](https://img.shields.io/badge/GOV.UK-Design%20System-red.svg)](https://design-system.service.gov.uk/)

A comprehensive **training application** that simulates a government alcohol license application system. This application is specifically designed for **software tester training** and includes a complete user journey, admin panel, API endpoints, and database functionality.

## 🎯 Purpose

This application serves as a **realistic testing environment** for:

- **Manual Testers**: Practice testing web applications with real-world complexity
- **Test Automation**: Stable endpoints and elements for automation practice
- **API Testing**: Complete REST API with proper error handling
- **Database Testing**: SQLite database with realistic data structures
- **Security Testing**: CSRF protection, input validation, and session management

## ✨ Features

### 🎨 Frontend (User Interface)

- **GOV.UK Design System**: Authentic government styling and components
- **Multi-step Form Journey**:
  - Personal details collection
  - Business information capture
  - License requirements selection
  - Application summary and review
  - Confirmation and reference number
- **Form Validation**: Comprehensive client-side and server-side validation
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Accessibility**: Follows WCAG 2.1 AA standards and GOV.UK accessibility guidelines
- **Session Management**: Maintains user state throughout the application journey

### 👩‍💼 Admin Panel

- **Secure Authentication**: Admin login with session management
- **Application Dashboard**: View all submitted applications
- **Status Management**: Approve, reject, or update application status
- **Visual Indicators**: Clear status badges and action buttons
- **CSRF Protection**: Secure form submissions

### 🔌 Backend API

- **RESTful API**: Complete CRUD operations following REST principles
- **Data Validation**: Comprehensive input validation using custom middleware
- **Error Handling**: Proper HTTP status codes and structured error responses
- **Health Monitoring**: System status and dependency checking
- **Rate Limiting**: Protection against abuse and DoS attacks
- **Logging**: Comprehensive request and error logging with Winston

### 🗄️ Database

- **SQLite Database**: Lightweight, file-based database perfect for testing
- **Structured Schema**: Proper normalization and data types
- **CRUD Operations**: Full Create, Read, Update, Delete functionality
- **Transaction Support**: Data integrity and consistency
- **Migration Support**: Database initialization and updates

### 🔒 Security Features

- **CSRF Protection**: Cross-Site Request Forgery prevention
- **Input Sanitization**: XSS prevention and data cleaning
- **Rate Limiting**: API abuse prevention
- **Session Security**: HTTP-only cookies with secure settings
- **Error Handling**: Information disclosure prevention

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **Docker** (optional, for containerized deployment)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd testing-training-gov-site

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Initialize the database
Optional: run DB migrations

  npm run db:migrate

# Start the application
npm start
```

### Using Docker

```bash
# Quick setup with Docker
./docker-setup.sh

# Or manually
docker compose up -d
```

## Local Asset Setup

After running `npm install`, run:

```bash
npm run setup-assets
```

This will copy GOV.UK Frontend assets and your logo to the correct locations for local development.

## 📚 API Documentation

### Health Check

- **GET** `/api/health` - Check API and database health status

# Alcohol License Training App

A realistic government alcohol license application for tester training. Includes GOV.UK Design System UI, multi-step forms, admin/admin API, SQLite DB, security middleware, and full test coverage.

## Quick Start

### Local Development

```bash
git clone <repository-url>
cd testing-training-gov-site
npm install
cp .env.example .env
npm run setup-assets   # Copies GOV.UK assets and logo
npm run db:migrate    # Optional: run DB migrations
npm start            # Or npm run dev for hot reload
```

### Docker

```bash
docker build -t alcohol-license-app .
docker run -p 3000:3000 alcohol-license-app
```

## Main Scripts

- `npm start` / `npm run dev` — Start server
- `npm run setup-assets` — Copy GOV.UK assets and logo
- `npm run db:migrate` — Run DB migrations
- `npm test` / `npm run test:coverage` — Run tests
- `npm run lint` / `npm run lint:fix` — Lint code

## Asset Setup

After `npm install`, always run:

```bash
npm run setup-assets
```

## Docker Compose

```bash
docker compose up -d
docker compose logs -f
docker compose down
```

## Troubleshooting

- **Assets missing?** Run `npm run setup-assets` again.
- **DB errors?** Run `npm run db:migrate` or check `.env` DB path.
- **Port in use?** Change `PORT` in `.env` or kill process using it.
- **Tests failing?** Run `npm install` and `npm run setup-assets` before tests.

## License

MIT — Educational and training use only.

#### Development & Deployment

- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Jest** - Testing framework
- **nodemon** - Development hot reloading

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Environment Configuration
NODE_ENV=development
PORT=3000

# Database
DB_PATH=./database/alcohol_license.db

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-in-production
SESSION_NAME=alcohol_license_session
SESSION_MAX_AGE=86400000

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
CORS_ORIGIN=http://localhost:3000

# Application
APP_NAME=Alcohol License Training App
APP_VERSION=1.0.0

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# File Upload (if enabled)
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=pdf,jpg,png
```

### Configuration Categories

#### Security Settings

- **SESSION_SECRET**: Cryptographic key for session encryption (REQUIRED in production)
- **RATE*LIMIT*\***: API rate limiting configuration
- **CORS_ORIGIN**: Allowed cross-origin request sources

#### Database Settings

- **DB_PATH**: SQLite database file location
- **DB_CONNECTION_LIMIT**: Maximum concurrent database connections

#### Application Settings

- **PORT**: HTTP server port
- **NODE_ENV**: Environment mode (development/production)
- **LOG_LEVEL**: Minimum logging level (error/warn/info/debug)

## 💻 Development

### Development Setup

```bash
# Install dependencies
npm install

# Create development environment file
cp .env.example .env

# Initialize database with sample data
Run migrations (dev):

  npm run db:migrate

# Start development server with hot reloading
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Available Scripts

```bash
# Development
npm run dev              # Start with nodemon (hot reloading)
npm start               # Start production server

# Database
npm run db:migrate      # Apply DB migrations
npm run reset-db        # Reset database (WARNING: deletes all data)

# Testing
npm test               # Run test suite
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report

# Docker
npm run docker:build          # Build Docker image
npm run docker:run            # Run Docker container
npm run docker:compose:up     # Start with Docker Compose
npm run docker:compose:down   # Stop Docker Compose
npm run docker:compose:logs   # View Docker logs

# Maintenance
npm run lint           # Check code style
npm run lint:fix       # Fix code style issues
```

### Code Style and Standards

This project follows these coding standards:

- **ESLint** configuration for JavaScript linting
- **Prettier** for code formatting
- **JSDoc** comments for function documentation
- **Conventional Commits** for git commit messages

### Testing Strategy

The application includes comprehensive testing:

- **Unit Tests**: Individual function and component testing
- **Integration Tests**: API endpoint testing
- **Database Tests**: Data persistence and retrieval
- **Security Tests**: Authentication and authorization

## 🧪 Testing Scenarios

This application is designed to provide realistic testing scenarios for manual and automated testing practice.

### User Journey Testing

#### Happy Path

1. Navigate to application start page
2. Complete personal details form
3. Fill in business information
4. Select license requirements
5. Review application summary
6. Submit application
7. Receive confirmation with reference number

#### Error Scenarios

- **Validation Errors**: Missing required fields, invalid formats
- **Session Timeout**: Long form completion times
- **Network Issues**: Simulated API failures
- **Duplicate Submissions**: Handling repeat form submissions

### API Testing Scenarios

#### Success Cases

- GET requests with valid parameters
- POST requests with complete data
- PATCH requests for status updates
- Proper HTTP status codes

#### Error Cases

- Invalid request formats (400 Bad Request)
- Missing authentication (401 Unauthorized)
- Resource not found (404 Not Found)
- Rate limiting (429 Too Many Requests)
- Server errors (500 Internal Server Error)

### Admin Panel Testing

#### Authentication Testing

- Valid login credentials
- Invalid credentials handling
- Session management
- CSRF protection

#### Application Management

- View application lists
- Filter by status
- Update application status
- Visual feedback for actions

### Database Testing

#### Data Integrity

- Application creation and storage
- Status updates
- Data retrieval accuracy
- Concurrent access handling

#### Performance Testing

- Large dataset handling
- Query optimization
- Connection pooling
- Transaction handling

## 🔒 Security Features

### Authentication & Authorization

- **Session-based authentication** for admin users
- **Secure session configuration** with HTTP-only cookies
- **Session timeout** for inactive users

### Input Security

- **CSRF protection** on all forms
- **Input sanitization** to prevent XSS attacks
- **SQL injection prevention** through parameterized queries
- **Rate limiting** to prevent brute force attacks

### Data Protection

- **Sensitive data masking** in logs
- **Secure headers** via Helmet.js
- **Environment variable protection** for secrets
- **Production configuration validation**

## 📊 Monitoring & Logging

### Application Logging

- **Structured logging** with Winston
- **Request/response logging** for debugging
- **Error logging** with stack traces
- **Performance metrics** tracking

### Health Monitoring

- **Health check endpoint** (`/api/health`)
- **Database connectivity** verification
- **Service dependency** checking
- **Uptime monitoring** capability

### Log Levels

- **ERROR**: Critical errors requiring immediate attention
- **WARN**: Warning conditions that should be monitored
- **INFO**: General information about application flow
- **DEBUG**: Detailed debugging information (development only)

## 🐳 Docker Deployment

### Container Features

- **Multi-stage build** for optimized image size
- **Non-root user** for security
- **Health checks** for container monitoring
- **Volume persistence** for database and logs
- **Environment configuration** support

### Docker Compose

The application includes a complete Docker Compose setup:

- **Application container** with auto-restart
- **Volume mounts** for data persistence
- **Environment variable** configuration
- **Health checks** and monitoring
- **Development and production** configurations

### Deployment Commands

```bash
# Quick deployment
./docker-setup.sh

# Manual deployment
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Update application
docker compose build --no-cache
docker compose up -d
```

## 📝 API Examples

### Create Application

```bash
curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "personalDetails": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "01234567890",
      "dateOfBirth": "1985-06-15",
      "address": {
        "line1": "123 Main Street",
        "line2": "",
        "town": "London",
        "county": "Greater London",
        "postcode": "SW1A 1AA"
      }
    },
    "businessDetails": {
      "businessName": "The Red Lion Pub",
      "businessType": "pub",
      "address": {
        "line1": "456 High Street",
        "line2": "",
        "town": "London",
        "county": "Greater London",
        "postcode": "SW1A 2BB"
      }
    },
    "licenseDetails": {
      "licenseType": "premises",
      "activities": ["sale_of_alcohol", "live_music"],
      "hours": {
        "monday": { "open": "11:00", "close": "23:00" },
        "tuesday": { "open": "11:00", "close": "23:00" }
      }
    },
    "declaration": true
  }'
```

### Get Application Status

```bash
curl -X GET http://localhost:3000/api/applications/{applicationId}
```

### Update Application Status (Admin)

```bash
curl -X PATCH http://localhost:3000/api/applications/{applicationId}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add new feature'`)
7. Push to the branch (`git push origin feature/new-feature`)
8. Create a Pull Request

### Code Guidelines

- Follow existing code style and patterns
- Add JSDoc comments for new functions
- Include tests for new features
- Update documentation for API changes
- Ensure Docker build succeeds

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Check database file permissions
ls -la database/

# Reinitialize database
Run migrations in CI or first run:

  npm run db:migrate

# Check database path in .env file
```

#### Session/CSRF Errors

```bash
# Clear browser cookies and session data
# Check SESSION_SECRET in .env file
# Restart the application
npm run dev
```

#### Docker Issues

```bash
# Check Docker is running
docker --version

# View container logs
docker compose logs -f

# Rebuild containers
docker compose build --no-cache
docker compose up -d
```

#### Port Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

### Getting Help

- Check the application logs in `./logs/app.log`
- Review the health check endpoint: `http://localhost:3000/api/health`
- Ensure all environment variables are properly set
- Verify database initialization completed successfully

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **GOV.UK Design System** for providing excellent government design patterns
- **Express.js Community** for the robust web framework
- **Node.js** for the JavaScript runtime environment
- **SQLite** for the lightweight database solution

---

**Built for testing training and educational purposes.** This application simulates real-world government services for the purpose of teaching software testing skills and practices.

- `GET /api/applications` - Get all applications
- `GET /api/applications/:id` - Get specific application by ID
- `POST /api/applications` - Create new application
- `PATCH /api/applications/:id/status` - Update application status
- `DELETE /api/applications/:id` - Delete application

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd testing-training-gov-site
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the application**

   ```bash
   npm start
   ```

4. **For development (with auto-restart)**

   ```bash
   npm run dev
   ```

5. **Initialize the database** (optional - happens automatically)
   ```bash
   npm run db:migrate
   ```

## Usage

### Application Flow

1. Visit `http://localhost:3000`
2. Click "Start now" to begin the application
3. Complete each step:
   - Personal details (name, address, contact info)
   - Business details (business info and address)
   - License details (type, premises, operating hours)
   - Review and submit

### API Testing

Use tools like Postman, curl, or the built-in test suite to test API endpoints.

**Example API calls:**

**Health Check:**

```bash
curl http://localhost:3000/api/health
```

**Get All Applications:**

```bash
curl http://localhost:3000/api/applications
```

**Create Application:**

```bash
curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "personalDetails": {
      "firstName": "John",
      "lastName": "Smith",
      "dateOfBirth": "1985-03-15",
      "email": "john@example.com",
      "phoneNumber": "07123456789",
      "address": {
        "line1": "123 High Street",
        "town": "London",
        "postcode": "SW1A 1AA"
      }
    },
    "businessDetails": {
      "businessName": "The Red Lion",
      "businessType": "pub",
      "businessPhone": "020 1234 5678",
      "businessAddress": {
        "line1": "456 Pub Street",
        "town": "London",
        "postcode": "SW1A 2BB"
      }
    },
    "licenseDetails": {
      "licenseType": "premises",
      "premisesType": "pub",
      "premisesAddress": {
        "line1": "456 Pub Street",
        "town": "London",
        "postcode": "SW1A 2BB"
      },
      "activities": ["sale-on"],
      "operatingHours": {
        "monday": "10:00 - 23:00"
      }
    }
  }'
```

## Testing

Run the test suite:

```bash
npm test
```

The tests cover:

- API endpoint functionality
- Data validation
- Error handling
- CRUD operations
- HTTP status codes

## Training Scenarios

### For Testers

1. **Happy Path Testing**: Complete a full application successfully
2. **Validation Testing**: Try submitting incomplete or invalid data
3. **API Testing**: Use the API endpoints to create, read, update, and delete applications
4. **Status Updates**: Test changing application statuses
5. **Error Handling**: Test various error scenarios

### Test Data Examples

Use these data sets for consistent testing:

**Valid Application:**

- Name: John Smith
- DOB: 15/03/1985
- Email: john.smith@example.com
- Phone: 07123456789
- Business: The Red Lion (Pub)
- License Type: Premises licence

**Invalid Data Tests:**

- Missing required fields
- Invalid email formats
- Invalid date formats
- Invalid phone numbers
- Invalid postcodes

## File Structure

```
testing-training-gov-site/
├── server.js                 # Main server file
├── package.json             # Dependencies and scripts
├── database/
│   └── alcohol_license.db   # SQLite database file
├── public/                  # Frontend files
│   ├── index.html          # Start page
│   ├── personal-details.html
│   ├── business-details.html
│   ├── license-details.html
│   ├── summary.html
│   └── confirmation.html
└── tests/
    └── api.test.js         # API test suite
```

## Technical Details

### Technologies Used

- **Node.js**: Server runtime
- **Express.js**: Web framework
- **SQLite3**: Database
- **Express-validator**: Data validation
- **GOV.UK Frontend**: Styling and components
- **Jest**: Testing framework
- **Supertest**: API testing

### Data Structure

Applications are stored with the following structure:

- Personal Details (name, DOB, contact info, address)
- Business Details (business info, type, contact details)
- License Details (type, premises, activities, operating hours)
- Metadata (application ID, status, timestamps)

### Status Values

- `submitted`: Initial status when application is created
- `under-review`: Application is being processed
- `approved`: Application has been approved
- `rejected`: Application has been rejected

## Troubleshooting

### Common Issues

**Port already in use:**

- Change the port in `server.js` or set the `PORT` environment variable

**Database errors:**

- Delete `database/alcohol_license.db` and restart the server to recreate

**Missing dependencies:**

- Run `npm install` to install all required packages

**Form not submitting:**

- Check browser console for JavaScript errors
- Ensure all required fields are completed

## Contributing

This is a training application. Feel free to:

- Add more validation rules
- Create additional test scenarios
- Enhance the UI/UX
- Add more API endpoints
- Implement additional features

## License

This project is created for educational and training purposes only. It mimics government services but provides no real functionality.
