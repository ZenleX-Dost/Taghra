# 🍔 TAGHRA - Premium Multi-Service Platform

> A revolutionary all-in-one platform connecting food delivery, healthcare services, and community engagement in Morocco.

## 🏆 Hackathon Achievement

**Hackactus 3rd Edition - ENSAM Meknes**  
🥈 **2nd Place Winner**

This project was developed during the Hackactus 3rd edition hackathon at ENSAM Meknes and earned the 2nd place award.

### Team Members
- **AMLLAL Amine**
- **KHALIL Abderezak**
- **Naim**
- **Wassim Azelmat**
- **EL HEND Amine**

---

## 📋 Project Overview

TAGHRA is a premium, modern multi-service platform designed to revolutionize how Moroccan users access food delivery, healthcare services, and community features. The platform combines luxury design with practical functionality, offering seamless integration across multiple services in a single application.

### Core Features

#### 🍕 Food Delivery Service
- **Browse Restaurants & Menus**: Discover premium restaurants with real-time availability
- **Smart Ordering**: Add items to cart with customization options
- **Order Tracking**: Track deliveries in real-time
- **Reviews & Ratings**: Share experiences and discover top-rated establishments
- **Favorites**: Save preferred restaurants and orders

#### 🏥 Healthcare Services
- **Doctor Appointments**: Book consultations with healthcare professionals
- **Service Categories**: 
  - General Health
  - Specialized Care
  - Veterinary Services (SubVet)
- **Appointment Management**: View, reschedule, and manage bookings
- **Real-time Notifications**: Get appointment reminders and updates

#### 🗺️ Location-Based Discovery
- **Interactive Maps**: Explore nearby services with radius-based filtering
- **Distance Tracking**: See how far services are from your location
- **Geolocation Services**: Automatic location detection for personalized recommendations
- **Expandable Radius**: Unlock larger search areas through gamification

#### 👥 Community & Gamification
- **Points System**: Earn points through various activities
- **Leaderboards**: Compete with other users and climb rankings
- **User Profiles**: Manage your account, preferences, and history
- **Social Features**: Connect with other users and share recommendations
- **Sub-Communities**: Join specialized communities (restaurants, doctors, vets)

#### 🔐 Authentication & Security
- **Secure Registration**: Email-based authentication with Supabase
- **Role-Based Access**: Different dashboards for users, restaurants, doctors, and admins
- **Session Management**: Secure token-based authentication
- **Data Privacy**: Enterprise-grade security with Supabase

---

## 🏗️ Architecture

### Tech Stack

**Frontend (Mobile)**
- **Framework**: React Native with Expo
- **State Management**: Context API
- **Navigation**: React Navigation (Bottom Tabs, Stack, Drawer)
- **Database**: Supabase (Real-time & Authentication)
- **UI Components**: Custom components with Linear Gradient effects
- **Maps**: React Native Maps with Google Maps integration
- **Notifications**: Expo Notifications
- **Storage**: AsyncStorage for local persistence

**Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase PostgreSQL
- **Real-time**: Socket.io for live updates
- **Authentication**: JWT + Supabase Auth
- **File Storage**: Local upload management
- **API**: RESTful architecture

**Infrastructure**
- **Database**: Supabase (PostgreSQL with PostGIS)
- **Authentication**: Supabase Auth
- **Real-time Features**: Socket.io
- **Maps API**: Google Maps Platform
- **Push Notifications**: Firebase Cloud Messaging

---

## 📁 Project Structure

```
taghra/
├── snackspot-app/                  # React Native/Expo Frontend
│   ├── src/
│   │   ├── screens/               # App screens by feature
│   │   │   ├── auth/              # Login, Register, Onboarding
│   │   │   ├── food/              # Menu, Cart, Checkout
│   │   │   ├── health/            # Appointments, Booking
│   │   │   ├── map/               # Map, Place Details
│   │   │   ├── profile/           # Profile, Leaderboard
│   │   │   ├── admin/             # Admin Dashboard
│   │   │   └── sub/               # Sub-communities
│   │   ├── components/            # Reusable UI components
│   │   ├── context/               # State management (Auth, Cart, Theme)
│   │   ├── navigation/            # Navigation configuration
│   │   ├── services/              # API & Supabase clients
│   │   ├── hooks/                 # Custom React hooks
│   │   └── utils/                 # Helpers, constants, validators
│   └── package.json
│
├── snackspot-backend/              # Node.js/Express Backend
│   ├── src/
│   │   ├── routes/                # API endpoints
│   │   │   ├── auth.js            # Authentication endpoints
│   │   │   ├── users.js           # User management
│   │   │   ├── places.js          # Restaurants & Services
│   │   │   ├── orders.js          # Order management
│   │   │   ├── appointments.js    # Healthcare bookings
│   │   │   ├── admin.js           # Admin operations
│   │   │   └── ...
│   │   ├── config/                # Configuration
│   │   │   ├── supabase.js        # Supabase client
│   │   │   ├── firebase.js        # Firebase setup
│   │   │   └── database.js        # Database config
│   │   ├── middleware/            # Express middleware
│   │   │   ├── auth.js            # JWT authentication
│   │   │   ├── errorHandler.js    # Error handling
│   │   │   └── rateLimiter.js     # Rate limiting
│   │   ├── utils/                 # Utility functions
│   │   └── index.js               # Server entry point
│   └── package.json
│
├── setup-env.js                    # Dynamic IP configuration
├── SETUP_GUIDE.md                  # Setup documentation
└── README.md                        # This file
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16+)
- **npm** or **yarn**
- **Expo Go** app (on your phone)
- **Windows PowerShell** or **Terminal**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ZenleX-Dost/Taghra.git
   cd Taghra
   ```

2. **Configure environment**
   ```bash
   node setup-env.js
   ```
   This automatically detects your IP and configures both apps.

3. **Install backend dependencies**
   ```bash
   cd snackspot-backend
   npm install
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../snackspot-app
   npm install
   ```

### Running the Application

**Terminal 1 - Start Backend Server**
```bash
cd snackspot-backend
npm run dev
```

The server will start on `http://localhost:3001` and display:
```
📱 For mobile (Expo):
http://192.168.x.x:3001/api
```

**Terminal 2 - Start Expo Development Server**
```bash
cd snackspot-app
npm start
```

Scan the QR code with:
- **Android**: Expo Go app
- **iOS**: Camera app (iOS 11+)

### Testing the App

1. **Create an account** during onboarding
2. **Browse restaurants** on the map
3. **Place an order** and track it in real-time
4. **Book healthcare appointments**
5. **Earn points** and climb the leaderboard

---

## 🔧 Configuration

### Dynamic IP Setup

The project automatically detects your machine's IP address for mobile development:

```bash
# Run from project root
node setup-env.js
```

This updates:
- `EXPO_PUBLIC_API_URL` - Backend API endpoint
- `EXPO_PUBLIC_SOCKET_URL` - WebSocket endpoint

**When WiFi changes**, simply re-run the setup script and reload the Expo app.

### Environment Variables

#### Frontend (`snackspot-app/.env`)
```env
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_KEY=ey...
EXPO_PUBLIC_API_URL=http://192.168.x.x:3001/api
EXPO_PUBLIC_SOCKET_URL=ws://192.168.x.x:3001
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AI...
```

#### Backend (`snackspot-backend/.env`)
```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=ey...
JWT_SECRET=your_jwt_secret
```

---

## 🎨 Design Philosophy

TAGHRA features a **premium, modern design** with:

- **Gold & Navy Color Scheme**: Luxurious primary colors with deep blue accents
- **Gradient Effects**: Smooth linear gradients for visual depth
- **Card-Based Layout**: Clean information hierarchy
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Accessibility**: High contrast ratios and readable typography
- **Dark Mode Support**: Full theme switching capability

---

## 📱 Key Screen Flows

### Authentication Flow
```
Onboarding → Register/Login → Home Dashboard
```

### Food Ordering Flow
```
Browse Restaurants → View Menu → Add to Cart → Checkout → Track Order
```

### Healthcare Booking Flow
```
Browse Doctors → Select Time Slot → Confirm Booking → Manage Appointments
```

### Discovery Flow
```
View Map → Filter by Category → Expand Search Radius → View Details
```

---

## 🔐 Security Features

- **Supabase Auth**: Secure email/password authentication
- **JWT Tokens**: Stateless authentication with refresh tokens
- **Row Level Security (RLS)**: Database-level access control
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Server-side validation on all endpoints
- **CORS Protection**: Cross-origin request validation
- **Secure Headers**: Helmet.js for HTTP security headers

---

## 📊 Database Schema

The project uses Supabase PostgreSQL with the following main tables:

- **users**: User profiles and authentication
- **restaurants**: Restaurant information and details
- **doctors**: Healthcare provider profiles
- **vets**: Veterinary service providers
- **orders**: Food delivery orders
- **appointments**: Healthcare appointments
- **reviews**: User reviews and ratings
- **notifications**: User notifications
- **points_history**: Gamification tracking

---

## 🚀 Deployment

### Backend Deployment
Suitable for:
- Azure App Service
- Heroku
- DigitalOcean
- AWS EC2

### Frontend Deployment
- **EAS Build** (Managed Expo Build Service)
- **APK/IPA Generation** for app stores
- **Web Version** (Expo Web)

---

## 🤝 Contributing

This is a hackathon project. For contributions or improvements:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed setup instructions
- **Inline Comments** - Code documentation throughout the project
- **API Routes** - RESTful endpoints in `/snackspot-backend/src/routes/`

---

## 🐛 Troubleshooting

### Phone Can't Connect to Backend
1. Ensure phone and computer are on the **same WiFi**
2. Re-run `node setup-env.js`
3. Reload Expo app (shake phone → Reload)
4. Check Windows Firewall allows port 3001

### IP Changes After WiFi Switch
```bash
node setup-env.js
```
Then reload the app.

### Supabase Connection Issues
- Verify credentials in `.env`
- Check Supabase project status
- Ensure database tables exist
- Review Supabase logs

---

## 📝 License

This project was developed for **Hackactus 3rd Edition** at ENSAM Meknes.

---

## 🙏 Acknowledgments

- **Hackactus 3rd Edition** - ENSAM Meknes for organizing the hackathon
- **Supabase** - For reliable database and authentication infrastructure
- **React Native & Expo** - For cross-platform mobile development
- **Google Maps** - For location services
- **Firebase** - For push notifications

---

## 📞 Contact

**Team**: TAGHRA Development Team  
**Project**: Premium Multi-Service Platform  
**Event**: Hackactus 3rd Edition - ENSAM Meknes  
**Result**: 🥈 **2nd Place**

---

**Last Updated**: December 2025  
**Status**: Active Development
