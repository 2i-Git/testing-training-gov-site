# Alcohol License Training Application

A comprehensive training application that simulates a government alcohol license application system. This application is designed for tester training and includes a complete form flow, API endpoints, and database functionality.

## Features

### Frontend
- **GOV.UK Design System**: Authentic government styling and components
- **Multi-step Form**: Personal details → Business details → License details → Summary → Confirmation
- **Form Validation**: Client-side and server-side validation
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Accessibility**: Follows GOV.UK accessibility standards

### Backend API
- **RESTful API**: Complete CRUD operations for applications
- **Data Validation**: Comprehensive input validation using express-validator
- **Error Handling**: Proper HTTP status codes and error messages
- **Health Check**: System status monitoring endpoint

### Database
- **SQLite Database**: Lightweight, file-based database
- **Structured Data**: Proper normalization and data types
- **CRUD Operations**: Create, read, update, delete functionality

## API Endpoints

### Health Check
- `GET /api/health` - Check API health status

### Applications
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
   npm run init-db
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
│   ├── database.js          # Database class and operations
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
