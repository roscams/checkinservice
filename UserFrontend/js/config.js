/**
 * Configuration settings for the User Frontend
 */
const CONFIG = {
    // API base URL - change this to match your API deployment
    API_URL: 'http://localhost:5141/api',
    
    // Refresh interval for event data (in milliseconds)
    REFRESH_INTERVAL: 60000, // 1 minute
    
    // Date format options
    DATE_FORMAT_OPTIONS: {
        dateStyle: 'medium',
        timeStyle: 'short'
    },
    
    // Toast notification display duration (in milliseconds)
    TOAST_DURATION: 5000
};