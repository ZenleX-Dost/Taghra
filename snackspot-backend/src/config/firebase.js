// Taghra - Firebase Configuration
// Initialize Firebase Admin SDK

const admin = require('firebase-admin');

let firebaseInitialized = false;

try {
    // Check if environment variables are set and valid
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_PRIVATE_KEY && 
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {

        // Format private key (handle newlines)
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });

        firebaseInitialized = true;
        console.log('🔥 Firebase Admin initialized successfully');
    } else {
        console.log('ℹ️  Firebase not configured. Push notifications disabled (optional feature).');
    }
} catch (error) {
    console.log('ℹ️  Firebase initialization skipped:', error.message);
    console.log('   Push notifications will be disabled (optional feature).');
}

const messaging = firebaseInitialized && admin.apps.length ? admin.messaging() : null;

/**
 * Send a push notification to a specific device
 * @param {string} token - Device token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Optional data payload
 */
const sendPushNotification = async (token, title, body, data = {}) => {
    if (!messaging) {
        console.warn('Cannot send notification: Firebase not initialized');
        return false;
    }

    try {
        const message = {
            notification: {
                title,
                body,
            },
            data: {
                ...data,
                // Ensure all data values are strings
                ...Object.keys(data).reduce((acc, key) => {
                    acc[key] = String(data[key]);
                    return acc;
                }, {}),
            },
            token,
        };

        const response = await messaging.send(message);
        console.log('Successfully sent message:', response);
        return true;
    } catch (error) {
        console.error('Error sending message:', error);
        return false;
    }
};

/**
 * Send a push notification to multiple devices
 * @param {Array<string>} tokens - Array of device tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Optional data payload
 */
const sendMulticastNotification = async (tokens, title, body, data = {}) => {
    if (!messaging || !tokens.length) {
        return { successCount: 0, failureCount: 0 };
    }

    try {
        const message = {
            notification: {
                title,
                body,
            },
            data: {
                ...data,
                ...Object.keys(data).reduce((acc, key) => {
                    acc[key] = String(data[key]);
                    return acc;
                }, {}),
            },
            tokens,
        };

        const response = await messaging.sendMulticast(message);
        console.log(`${response.successCount} messages were sent successfully`);
        return response;
    } catch (error) {
        console.error('Error sending multicast message:', error);
        return { successCount: 0, failureCount: tokens.length };
    }
};

module.exports = {
    admin,
    messaging,
    sendPushNotification,
    sendMulticastNotification,
};
