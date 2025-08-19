# Commute Tracker

A web application for tracking commute times between addresses using Google Maps API. The application automatically fetches travel times at scheduled intervals and provides analytics to help you understand your commute patterns.

## Features

- **Trip Management**: Create, edit, and delete commute trips with custom schedules
- **Automatic Tracking**: Scheduled travel time checks using cron expressions
- **Real-time Data**: Manual travel time checks and real-time Google Maps integration
- **Analytics Dashboard**: Comprehensive analytics with charts and insights
- **Traffic Analysis**: Traffic level classification (low, medium, high, severe)
- **Responsive Design**: Modern, mobile-friendly interface built with React and Tailwind CSS
- **Heroku Ready**: Easy deployment to Heroku platform

## Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **node-cron** for scheduling
- **Google Maps Directions API** for travel times
- **Helmet** and **CORS** for security

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React Hook Form** for form handling
- **React Hot Toast** for notifications
- **Lucide React** for icons

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google Maps API key with Directions API enabled

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd commute-tracker
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/commute_tracker

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 4. Database Setup

1. Create a PostgreSQL database named `commute_tracker`
2. The application will automatically create the required tables on startup

### 5. Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Directions API**
4. Create credentials (API key)
5. Add the API key to your `.env` file

### 6. Run the Application

#### Development Mode

```bash
# Start the backend server
npm run dev

# In a new terminal, start the frontend
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

#### Production Mode

```bash
# Build the frontend
npm run build

# Start the production server
npm start
```

## Usage

### Creating a Trip

1. Navigate to the **Trips** page
2. Click **Add Trip**
3. Fill in the trip details:
   - **Trip Name**: A descriptive name for your commute
   - **Origin Address**: Your starting location
   - **Destination Address**: Your destination
   - **Schedule**: Choose from predefined schedules or use a custom cron expression
   - **Active Status**: Enable to start tracking immediately

### Schedule Options

- **Weekday mornings (8 AM)**: `0 8 * * 1-5`
- **Weekday evenings (5 PM)**: `0 17 * * 1-5`
- **Every 2 hours**: `0 */2 * * *`
- **Every 4 hours**: `0 */4 * * *`
- **Custom**: Enter your own cron expression

### Viewing Analytics

- **Dashboard**: Overview of all trips and recent activity
- **Trip Details**: Detailed analytics for a specific trip including charts
- **Analytics**: Comprehensive analytics across all trips

## API Endpoints

### Trips
- `GET /api/trips` - Get all trips
- `GET /api/trips/:id` - Get a specific trip
- `POST /api/trips` - Create a new trip
- `PUT /api/trips/:id` - Update a trip
- `DELETE /api/trips/:id` - Delete a trip
- `GET /api/trips/:id/travel-times` - Get travel times for a trip
- `POST /api/trips/:id/check-now` - Manually check travel time

### Analytics
- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/trip/:id` - Get detailed trip analytics
- `GET /api/analytics/traffic-trends` - Get traffic trends
- `GET /api/analytics/best-worst-times` - Get best and worst travel times

## Deployment to Heroku

### 1. Create Heroku App

```bash
heroku create your-app-name
```

### 2. Add PostgreSQL Addon

```bash
heroku addons:create heroku-postgresql:mini
```

### 3. Set Environment Variables

```bash
heroku config:set GOOGLE_MAPS_API_KEY=your_google_maps_api_key
heroku config:set NODE_ENV=production
```

### 4. Deploy

```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### 5. Run Database Migrations

```bash
heroku run npm start
```

The application will automatically create the database tables on first run.

## Cron Expression Examples

| Description | Cron Expression |
|-------------|----------------|
| Every weekday at 8 AM | `0 8 * * 1-5` |
| Every weekday at 5 PM | `0 17 * * 1-5` |
| Every 2 hours | `0 */2 * * *` |
| Every 4 hours | `0 */4 * * *` |
| Every hour on weekdays | `0 * * * 1-5` |
| Every 30 minutes | `*/30 * * * *` |
| Every 15 minutes | `*/15 * * * *` |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Changelog

### v1.0.0
- Initial release
- Trip management functionality
- Automatic scheduling with cron expressions
- Google Maps API integration
- Analytics dashboard with charts
- Responsive web interface
- Heroku deployment support
