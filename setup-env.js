#!/usr/bin/env node

/**
 * Dynamic Environment Setup Script
 * Automatically configures the Expo app's .env file with the current machine's IP address
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Get local IP address (non-loopback IPv4)
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
    
    // If not found, search all interfaces (skip Ethernet 2 which is virtual)
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

// Paths
const appEnvPath = path.join(__dirname, 'snackspot-app', '.env');
const appEnvExamplePath = path.join(__dirname, 'snackspot-app', '.env.example');
const backendEnvPath = path.join(__dirname, 'snackspot-backend', '.env');

// Get the local IP
const localIP = getLocalIP();
const backendPort = '3001';
const apiUrl = `http://${localIP}:${backendPort}/api`;
const socketUrl = `ws://${localIP}:${backendPort}`;

console.log(`\n📱 Configuring environment variables...`);
console.log(`🌐 Detected local IP: ${localIP}\n`);

// Function to update or create .env file
const setupEnvFile = (envPath, envExamplePath, localIP) => {
    try {
        // Read existing .env or use example as template
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        } else if (fs.existsSync(envExamplePath)) {
            envContent = fs.readFileSync(envExamplePath, 'utf8');
            console.log(`📄 Created from template: ${path.basename(envExamplePath)}`);
        }

        // Update or add API_URL
        if (envContent.includes('EXPO_PUBLIC_API_URL=')) {
            envContent = envContent.replace(
                /EXPO_PUBLIC_API_URL=.*/,
                `EXPO_PUBLIC_API_URL=${apiUrl}`
            );
        } else {
            // Add after Supabase config or at the end
            if (envContent.includes('EXPO_PUBLIC_SUPABASE_KEY=')) {
                envContent = envContent.replace(
                    /(EXPO_PUBLIC_SUPABASE_KEY=.*\n)/,
                    `$1\n# API Configuration (Backend server)\nEXPO_PUBLIC_API_URL=${apiUrl}\n`
                );
            } else {
                envContent += `\n# API Configuration (Backend server)\nEXPO_PUBLIC_API_URL=${apiUrl}\n`;
            }
        }

        // Update or add SOCKET_URL
        if (envContent.includes('EXPO_PUBLIC_SOCKET_URL=')) {
            envContent = envContent.replace(
                /EXPO_PUBLIC_SOCKET_URL=.*/,
                `EXPO_PUBLIC_SOCKET_URL=${socketUrl}`
            );
        } else {
            envContent += `EXPO_PUBLIC_SOCKET_URL=${socketUrl}\n`;
        }

        // Write the updated content
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log(`✅ ${path.relative(process.cwd(), envPath)}`);
        
        return true;
    } catch (error) {
        console.error(`❌ Error updating ${path.basename(envPath)}: ${error.message}`);
        return false;
    }
};

// Setup app environment
const appSuccess = setupEnvFile(appEnvPath, appEnvExamplePath, localIP);

console.log(`
╔════════════════════════════════════════════╗
║  Environment Configuration Complete ✨     ║
╚════════════════════════════════════════════╝

📱 Mobile App Settings:
   API URL:    ${apiUrl}
   Socket URL: ${socketUrl}

🚀 Next steps:
   1. Start the backend:  cd snackspot-backend && npm run dev
   2. Start Expo:         cd snackspot-app && npx expo start
   3. Scan the QR code with your phone

💡 Tips:
   • Make sure your phone is on the same WiFi network
   • If IP changes, run this script again: node setup-env.js
   • You can automate this by adding to package.json scripts
`);

process.exit(appSuccess ? 0 : 1);
