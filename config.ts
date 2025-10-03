// Configuration for network access
// Change this to your computer's IP address when accessing from phone
// Use 'localhost' when testing on the same computer

// const USE_NETWORK_IP = true; // Set to true when using on phone
// const NETWORK_IP = '10.99.20.153'; // Your computer's IP address
// const PORT = 8900;

// export const API_BASE_URL = USE_NETWORK_IP 
//     ? `http://${NETWORK_IP}:${PORT}/api`
//     : `http://localhost:${PORT}/api`;

// export const SOCKET_URL = USE_NETWORK_IP
//     ? `http://${NETWORK_IP}:${PORT}`
//     : `http://localhost:${PORT}`;

const isProduction = import.meta.env.PROD;

export const config = {
  // Backend API URL - UPDATE THIS WITH YOUR ACTUAL BACKEND URL
  apiUrl: isProduction 
    ? 'https://react-chat-backend.onrender.com' // Replace with your actual backend URL
    : 'http://localhost:5000',
  
  // Socket.IO URL
  socketUrl: isProduction
    ? 'https://react-chat-backend.onrender.com' // Replace with your actual backend URL
    : 'http://localhost:5000',
};
