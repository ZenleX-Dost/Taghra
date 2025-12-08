// TAGHRA Backend - Main Entry Point
// Express server with Socket.io for real-time features

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');
require('./config/firebase');

// Import routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const placesRoutes = require('./routes/places');
const ordersRoutes = require('./routes/orders');
const healthRoutes = require('./routes/health');
const appointmentsRoutes = require('./routes/appointments');
const adminRoutes = require('./routes/admin');
const subsRoutes = require('./routes/subs');
const notificationsRoutes = require('./routes/notifications');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
    },
});

// Make io accessible to routes
app.set('io', io);

// ============================================
// Middleware
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter);

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// ============================================
// Routes
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subs', subsRoutes);
app.use('/api/notifications', notificationsRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
    });
});

// Error handler
app.use(errorHandler);

// ============================================
// Socket.io Events
// ============================================

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // User joins with their ID
    socket.on('user:join', (userId) => {
        connectedUsers.set(userId, socket.id);
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined`);
    });

    // Place owner joins for real-time updates
    socket.on('place:join', (placeId) => {
        socket.join(`place:${placeId}`);
        console.log(`Socket joined place room: ${placeId}`);
    });

    // Real-time location update from food trucks
    socket.on('location:update', (data) => {
        const { placeId, latitude, longitude } = data;
        // Broadcast to all clients in the area
        io.emit('location:updated', {
            placeId,
            latitude,
            longitude,
            timestamp: new Date().toISOString(),
        });
    });

    // Order status update
    socket.on('order:statusUpdate', (data) => {
        const { orderId, userId, status } = data;
        io.to(`user:${userId}`).emit('order:updated', {
            orderId,
            status,
            timestamp: new Date().toISOString(),
        });
    });

    // Disconnect
    socket.on('disconnect', () => {
        // Remove user from connected users
        for (const [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(userId);
                break;
            }
        }
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// ============================================
// Start Server
// ============================================

const os = require('os');

// Get local IP address (non-loopback IPv4)
// Prioritizes WiFi and common network interfaces
const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    
    // Prioritize common WiFi interface names
    const preferredNames = ['WiFi', 'Ethernet', 'eth0', 'en0', 'wlan0'];
    
    // First try preferred interfaces
    for (const ifName of preferredNames) {
        if (interfaces[ifName]) {
            for (const iface of interfaces[ifName]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
    }
    
    // If not found, search all interfaces (skip virtual adapters)
    for (const name of Object.keys(interfaces)) {
        if (name.includes('Loopback') || name.includes('Virtual')) {
            continue;
        }
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    
    return 'localhost';
};

const PORT = process.env.PORT || 3000;
const localIP = getLocalIP();

server.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════╗
  ║                                           ║
  ║   🍔 TAGHRA API Server                 ║
  ║                                           ║
  ║   Running on: http://localhost:${PORT}       ║
  ║   Network:   http://${localIP}:${PORT}         ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}             ║
  ║                                           ║
  ║   📱 For mobile (Expo):                    ║
  ║   http://${localIP}:${PORT}/api                 ║
  ║                                           ║
  ╚═══════════════════════════════════════════╝
  `);
    
    // Write IP to a file for the setup script to read
    const fs = require('fs');
    const path = require('path');
    const ipFile = path.join(__dirname, '..', '..', '.server-ip');
    fs.writeFileSync(ipFile, localIP, 'utf8');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = { app, io };
