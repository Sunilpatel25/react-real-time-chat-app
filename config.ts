// Configuration for network access
// Change this to your computer's IP address when accessing from phone
// Use 'localhost' when testing on the same computer

const USE_NETWORK_IP = false; // Set to true when using on phone
const NETWORK_IP = '10.99.20.153'; // Your computer's IP address
const PORT = 8900;

// Check if running in production (deployed) or development (local)
const isProduction = import.meta.env.PROD;

// IMPORTANT: After deploying backend, update this URL
const PRODUCTION_BACKEND_URL = 'https://smart-chat-5mmr.onrender.com/'; // UPDATE THIS AFTER BACKEND DEPLOY!

const LOCAL_BACKEND_URL = USE_NETWORK_IP 
    ? `http://${NETWORK_IP}:${PORT}`
    : `http://localhost:${PORT}`;

// Export configuration based on environment
export const API_BASE_URL = isProduction
    ? `${PRODUCTION_BACKEND_URL}/api`
    : `${LOCAL_BACKEND_URL}/api`;

export const SOCKET_URL = isProduction
    ? PRODUCTION_BACKEND_URL
    : LOCAL_BACKEND_URL;
