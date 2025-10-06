# Check-in Service

This project consists of a .NET Core API for managing events and check-ins, along with two frontend applications:

1. **Admin Panel**: For event management and attendee tracking
2. **User Frontend**: For attendee check-in

## Project Structure

- `CheckinService.Api/`: .NET Core API backend
- `AdminPanel/`: Admin frontend for event management
- `UserFrontend/`: User frontend for check-ins

## API Features

- Create, retrieve, and delete events
- Upload CSV files with attendees
- Check in attendees to events
- Get check-in status and lists of checked-in/not checked-in people

## Admin Panel Features

- View all events with check-in statistics
- Create new events
- Upload CSV files with attendees
- View detailed check-in status for each event
- Filter attendees by check-in status

## User Frontend Features

- View all available events
- Search for events
- Check in attendees by searching for their name or email

## Getting Started

### Running the Application

#### Option 1: Using the Startup Script (Recommended)

The easiest way to start all components of the application is to use the provided startup script:

```bash
# Make the script executable (first time only)
chmod +x start-app.sh

# Run the application
./start-app.sh
```

This script will:
- Start the .NET Core API on http://localhost:5141
- Start the AdminPanel on http://localhost:8080
- Start the UserFrontend on http://localhost:8081
- Create log files in the `logs` directory

To stop all services, you can either:
- Press `Ctrl+C` in the terminal where the script is running
- Run the stop script: `./stop-app.sh`

#### Option 2: Running Components Separately

##### Running the API

```bash
dotnet run --project CheckinService.Api
```

The API will be available at http://localhost:5141

##### Running the Frontends

Both frontends are static HTML/CSS/JavaScript applications that can be served using any web server.

###### Using Node.js http-server

```bash
# For Admin Panel
cd AdminPanel
npx http-server -p 8080

# For User Frontend
cd UserFrontend
npx http-server -p 8081
```

###### Using Live Server in VS Code

1. Install the Live Server extension
2. Right-click on `AdminPanel/index.html` or `UserFrontend/index.html`
3. Select "Open with Live Server"

###### Using Python's built-in HTTP server

```bash
# For Admin Panel
cd AdminPanel
python -m http.server 8080

# For User Frontend
cd UserFrontend
python -m http.server 8081
```

## CSV Format

The system expects CSV files with attendees to have the following format:

```
Name,Email
John Doe,john.doe@example.com
Jane Smith,jane.smith@example.com
```

## Configuration

### Authentication Configuration

The API now requires JWT authentication for all endpoints. You need to configure an authentication provider in `CheckinService.Api/appsettings.json`:

```json
{
  "Auth": {
    "Authority": "https://your-auth-provider.com",
    "Audience": "checkin-service-api"
  }
}
```

#### Supported Authentication Providers

- **Azure AD B2C** (recommended for Azure deployments)
- **Auth0**
- **IdentityServer**
- **Firebase Auth**
- Any other OAuth 2.0 / OpenID Connect provider

#### Authorization Policies

The API uses role-based authorization with two policies:

- **AdminOnly**: Required for event management endpoints (create, delete events, upload CSV)
  - Requires `Admin` role
- **CheckInStaff**: Required for check-in endpoints
  - Requires either `Admin` or `CheckInStaff` role

#### Frontend Configuration

Both frontends have a configuration file at `js/config.js` where you can set the API URL and other settings. You'll need to implement login functionality and include JWT tokens in API requests:

```javascript
// Example: Adding authentication to API calls
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');

    const response = await fetch(`${CONFIG.API_URL}/${endpoint}`, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (response.status === 401) {
        // Redirect to login
        window.location.href = '/login.html';
    }

    return response;
}
```

## Technologies Used

- Backend:
  - .NET Core
  - Entity Framework Core
  - SQL Server

- Frontend:
  - HTML5
  - CSS3
  - JavaScript (ES6+)
  - Bootstrap 5
  - Bootstrap Icons

## Development

### API Development

The API is built with .NET Core and uses Entity Framework Core for data access. The database is automatically created when the application starts.

### Frontend Development

Both frontends are built with HTML, CSS, and JavaScript. They use Bootstrap 5 for styling and Bootstrap Icons for icons.

## License

This project is licensed under the MIT License.