# SnackSpot Backend

Node.js + Express API server for the SnackSpot mobile application.

## Features

- 🔐 JWT Authentication with refresh tokens
- 📍 PostGIS geolocation queries for nearby places
- 🍔 Food ordering system with real-time updates
- 🏥 Doctor/Vet appointment booking
- 📄 Administrative document guide
- 🎮 Gamification with points and badges
- 🔔 Push notifications support
- 👥 Ambassador (Sub) place submissions

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with PostGIS
- **Real-time**: Socket.io
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **File Upload**: multer

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ with PostGIS extension
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd snackspot-backend
   npm install
   ```

3. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`

5. Create the database and enable PostGIS:
   ```sql
   CREATE DATABASE snackspot;
   \c snackspot
   CREATE EXTENSION postgis;
   CREATE EXTENSION "uuid-ossp";
   ```

6. Run the schema migration:
   ```bash
   psql -d snackspot -f src/db/schema.sql
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/leaderboard` - Get top users

### Places
- `GET /api/places/nearby` - Get nearby places
- `GET /api/places/search` - Search places
- `GET /api/places/:id` - Get place details
- `GET /api/places/:id/menu` - Get menu
- `GET /api/places/:id/reviews` - Get reviews
- `POST /api/places/:id/reviews` - Add review

### Orders
- `POST /api/orders/create` - Create order
- `GET /api/orders/my-orders` - Get user orders
- `PUT /api/orders/:id/cancel` - Cancel order

### Health
- `GET /api/health/doctors` - Get doctors
- `GET /api/health/doctors/:id/availability` - Get availability

### Appointments
- `POST /api/appointments/book` - Book appointment
- `GET /api/appointments/my-appointments` - Get appointments

### Subs (Ambassadors)
- `POST /api/subs/add-place` - Submit new place
- `GET /api/subs/my-submissions` - Get submissions
- `GET /api/subs/earnings` - Get earnings

## License

ISC
