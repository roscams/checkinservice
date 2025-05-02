/**
 * API Service for the Admin Panel
 * Handles all communication with the backend API
 */
class ApiService {
    /**
     * Get all events
     * @returns {Promise<Array>} Promise resolving to an array of events
     */
    async getAllEvents() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/event`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    }

    /**
     * Get a specific event by ID
     * @param {string} eventId - The ID of the event to retrieve
     * @returns {Promise<Object>} Promise resolving to the event object
     */
    async getEventById(eventId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/event/${eventId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching event ${eventId}:`, error);
            throw error;
        }
    }

    /**
     * Create a new event
     * @param {Object} eventData - The event data to create
     * @returns {Promise<Object>} Promise resolving to the created event
     */
    async createEvent(eventData) {
        try {
            console.log('Making API request to create event:', eventData);
            console.log('API URL:', `${CONFIG.API_URL}/event`);
            
            const response = await fetch(`${CONFIG.API_URL}/event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
            
            console.log('API response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error response:', errorText);
                throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('API response data:', result);
            return result;
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event: ' + error.message);
            throw error;
        }
    }

    /**
     * Delete an event
     * @param {string} eventId - The ID of the event to delete
     * @returns {Promise<boolean>} Promise resolving to true if successful
     */
    async deleteEvent(eventId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/event/${eventId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return true;
        } catch (error) {
            console.error(`Error deleting event ${eventId}:`, error);
            throw error;
        }
    }

    /**
     * Upload a CSV file with attendees for an event
     * @param {string} eventId - The ID of the event
     * @param {File} file - The CSV file to upload
     * @returns {Promise<Object>} Promise resolving to the response data
     */
    async uploadCsv(eventId, file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`${CONFIG.API_URL}/event/${eventId}/upload-csv`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error uploading CSV for event ${eventId}:`, error);
            throw error;
        }
    }

    /**
     * Get checked-in people for an event
     * @param {string} eventId - The ID of the event
     * @returns {Promise<Array>} Promise resolving to an array of checked-in people
     */
    async getCheckedInPeople(eventId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/event/${eventId}/checked-in`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching checked-in people for event ${eventId}:`, error);
            throw error;
        }
    }

    /**
     * Get not checked-in people for an event
     * @param {string} eventId - The ID of the event
     * @returns {Promise<Array>} Promise resolving to an array of not checked-in people
     */
    async getNotCheckedInPeople(eventId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/event/${eventId}/not-checked-in`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching not checked-in people for event ${eventId}:`, error);
            throw error;
        }
    }

    /**
     * Get check-in status for an event
     * @param {string} eventId - The ID of the event
     * @returns {Promise<Object>} Promise resolving to the check-in status
     */
    async getCheckInStatus(eventId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/checkin/status/${eventId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching check-in status for event ${eventId}:`, error);
            throw error;
        }
    }

    /**
     * Check in a person to an event
     * @param {string} eventId - The ID of the event
     * @param {string} personId - The ID of the person
     * @returns {Promise<Object>} Promise resolving to the response data
     */
    async checkInPerson(eventId, personId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/checkin/${eventId}/person/${personId}`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error checking in person ${personId} for event ${eventId}:`, error);
            throw error;
        }
    }
    
    /**
     * Remove a person from an event
     * @param {string} eventId - The ID of the event
     * @param {string} personId - The ID of the person to remove
     * @returns {Promise<Object>} Promise resolving to the response data
     */
    async removePerson(eventId, personId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/event/${eventId}/person/${personId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error removing person ${personId} from event ${eventId}:`, error);
            throw error;
        }
    }
    
    /**
     * Toggle check-in status of a person
     * @param {string} eventId - The ID of the event
     * @param {string} personId - The ID of the person
     * @returns {Promise<Object>} Promise resolving to the response data
     */
    async toggleCheckInStatus(eventId, personId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/checkin/${eventId}/person/${personId}/toggle`, {
                method: 'PUT'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error toggling check-in status for person ${personId} in event ${eventId}:`, error);
            throw error;
        }
    }
}

// Create a singleton instance of the API service
const apiService = new ApiService();