/**
 * API Service for the User Frontend
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
     * Search for people in an event by name or email
     * This is a client-side search function that filters the event's people array
     * @param {Object} event - The event object containing people array
     * @param {string} searchTerm - The search term to filter by
     * @returns {Array} Array of matching people
     */
    searchPeopleInEvent(event, searchTerm) {
        if (!event || !event.people || !Array.isArray(event.people)) {
            return [];
        }
        
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            return [];
        }
        
        return event.people.filter(person => 
            person.name.toLowerCase().includes(term) || 
            person.email.toLowerCase().includes(term)
        );
    }
}

// Create a singleton instance of the API service
const apiService = new ApiService();