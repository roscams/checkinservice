/**
 * User Frontend JavaScript
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    
    // DOM Elements - We'll get these when needed to ensure they exist
    let eventsContainer, eventsLoading, eventsEmpty, eventSearch, refreshEventsBtn,
        backToEventsBtn, attendeeSearch, searchAttendeeBtn, searchResults,
        searchResultsBody, noResults, viewAllAttendeesBtn, backToCheckinBtn,
        attendeesListSearch, refreshAttendeesBtn, attendeesListBody,
        attendeesLoading, attendeesEmpty, checkinSuccessModal, toastNotification;
    
    // Initialize DOM elements
    function initDOMElements() {
        eventsContainer = document.getElementById('events-container');
        eventsLoading = document.getElementById('events-loading');
        eventsEmpty = document.getElementById('events-empty');
        eventSearch = document.getElementById('event-search');
        refreshEventsBtn = document.getElementById('refresh-events');
        backToEventsBtn = document.getElementById('back-to-events');
        attendeeSearch = document.getElementById('attendee-search');
        searchAttendeeBtn = document.getElementById('search-attendee');
        searchResults = document.getElementById('search-results');
        searchResultsBody = document.getElementById('search-results-body');
        noResults = document.getElementById('no-results');
        viewAllAttendeesBtn = document.getElementById('view-all-attendees');
        backToCheckinBtn = document.getElementById('back-to-checkin');
        attendeesListSearch = document.getElementById('attendees-list-search');
        refreshAttendeesBtn = document.getElementById('refresh-attendees');
        attendeesListBody = document.getElementById('attendees-list-body');
        attendeesLoading = document.getElementById('attendees-loading');
        attendeesEmpty = document.getElementById('attendees-empty');
        
        if (document.getElementById('checkin-success-modal')) {
            checkinSuccessModal = new bootstrap.Modal(document.getElementById('checkin-success-modal'));
        }
        
        toastNotification = document.getElementById('toast-notification');
        
        console.log('DOM elements initialized');
        if (viewAllAttendeesBtn) {
            console.log('View All Attendees button found during initialization');
        } else {
            console.error('View All Attendees button not found during initialization');
        }
    }

    // State
    let currentPage = 'events';
    let currentEventId = null;
    let currentEvent = null;
    let events = [];
    let filteredAttendees = [];

    // Initialize
    initDOMElements();
    loadEvents();
    setupEventListeners();

    function setupEventListeners() {
        // Events page listeners
        if (eventSearch) eventSearch.addEventListener('input', renderEvents);
        if (refreshEventsBtn) refreshEventsBtn.addEventListener('click', loadEvents);
        
        // Check-in page listeners
        if (backToEventsBtn) backToEventsBtn.addEventListener('click', () => navigateTo('events'));
        if (searchAttendeeBtn) searchAttendeeBtn.addEventListener('click', searchAttendee);
        if (attendeeSearch) {
            attendeeSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchAttendee();
                }
            });
        }
        
        // View All Attendees button
        if (viewAllAttendeesBtn) {
            console.log('Setting up click handler for View All Attendees button');
            viewAllAttendeesBtn.onclick = function() {
                console.log('View All Attendees button clicked');
                console.log('Current Event ID:', currentEventId);
                navigateTo('attendees', currentEventId);
            };
        } else {
            console.error('View All Attendees button not found during event setup');
        }
        
        // Attendees page listeners
        if (backToCheckinBtn) backToCheckinBtn.addEventListener('click', () => navigateTo('checkin', currentEventId));
        if (attendeesListSearch) attendeesListSearch.addEventListener('input', filterAttendeesList);
        if (refreshAttendeesBtn) refreshAttendeesBtn.addEventListener('click', () => loadAttendeesList(currentEventId));
    }

    function navigateTo(page, eventId = null) {
        console.log(`Navigating to page: ${page}, eventId: ${eventId}`);
        
        // Re-initialize DOM elements to ensure we have the latest references
        initDOMElements();
        
        document.querySelectorAll('.page').forEach(p => p.classList.add('d-none'));
        
        if (page === 'events') {
            const eventsPage = document.getElementById('events-page');
            if (eventsPage) {
                eventsPage.classList.remove('d-none');
                currentPage = 'events';
                loadEvents();
            } else {
                console.error('Events page element not found');
            }
        } else if (page === 'checkin' && eventId) {
            const checkinPage = document.getElementById('checkin-page');
            if (checkinPage) {
                checkinPage.classList.remove('d-none');
                currentPage = 'checkin';
                currentEventId = eventId;
                // Set the global currentEventId for direct links
                if (window.updateCurrentEventId) {
                    window.updateCurrentEventId(eventId);
                }
                loadEventDetails(eventId);
            } else {
                console.error('Check-in page element not found');
            }
        } else if (page === 'attendees' && eventId) {
            console.log('Attempting to show attendees page');
            const attendeesPage = document.getElementById('attendees-page');
            if (attendeesPage) {
                console.log('Attendees page found, making visible');
                attendeesPage.classList.remove('d-none');
                currentPage = 'attendees';
                currentEventId = eventId;
                // Set the global currentEventId for direct links
                if (window.updateCurrentEventId) {
                    window.updateCurrentEventId(eventId);
                }
                loadAttendeesList(eventId);
            } else {
                console.error('Attendees page element not found in the DOM');
                alert('Error: Could not find the attendees page. Please try again.');
            }
        }
    }

    async function loadEvents() {
        try {
            eventsLoading.classList.remove('d-none');
            eventsContainer.innerHTML = '';
            eventsEmpty.classList.add('d-none');
            
            events = await apiService.getAllEvents();
            renderEvents();
        } catch (error) {
            console.error('Error loading events:', error);
            showToast('Error', 'Failed to load events. Please try again.');
        } finally {
            eventsLoading.classList.add('d-none');
        }
    }

    function renderEvents() {
        eventsContainer.innerHTML = '';
        
        if (events.length === 0) {
            eventsEmpty.classList.remove('d-none');
            return;
        }
        
        eventsEmpty.classList.add('d-none');
        
        // Filter events based on search
        const searchTerm = eventSearch.value.toLowerCase().trim();
        const filteredEvents = searchTerm 
            ? events.filter(event => 
                event.name.toLowerCase().includes(searchTerm) || 
                event.description.toLowerCase().includes(searchTerm))
            : events;
        
        // Sort events by date (upcoming first)
        filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Render events as cards
        filteredEvents.forEach(event => {
            const col = document.createElement('div');
            col.className = 'col mb-4'; // Using the col class for the row-cols system

            const card = document.createElement('div');
            card.className = 'card event-card h-100';

            const eventDate = new Date(event.date);
            const isUpcoming = eventDate > new Date();

            // Format date in a more compact way for mobile
            const dateFormatOptions = {
                weekday: window.innerWidth < 576 ? 'short' : 'long',
                year: 'numeric',
                month: window.innerWidth < 576 ? 'short' : 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };

            // Truncate description for better display on mobile
            let description = event.description || '';
            if (window.innerWidth < 576 && description.length > 80) {
                description = description.substring(0, 80) + '...';
            }

            // Create elements safely without XSS
            const cardHeader = document.createElement('div');
            cardHeader.className = 'card-header';

            const cardTitle = document.createElement('h5');
            cardTitle.className = 'card-title mb-0';
            cardTitle.textContent = event.name;
            cardHeader.appendChild(cardTitle);

            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';

            const eventDatePara = document.createElement('p');
            eventDatePara.className = 'event-date mb-2';
            eventDatePara.innerHTML = `<i class="bi bi-calendar-event"></i> ${eventDate.toLocaleString(undefined, dateFormatOptions)}`;

            const descriptionPara = document.createElement('p');
            descriptionPara.className = 'card-text';
            descriptionPara.textContent = description;

            const checkinButton = document.createElement('button');
            checkinButton.className = 'btn btn-success btn-checkin';
            checkinButton.setAttribute('data-id', event.id);
            checkinButton.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Check-in';

            cardBody.appendChild(eventDatePara);
            cardBody.appendChild(descriptionPara);
            cardBody.appendChild(checkinButton);

            card.appendChild(cardHeader);
            card.appendChild(cardBody);
            col.appendChild(card);
            eventsContainer.appendChild(col);
        });
        
        // Add event listeners to check-in buttons
        document.querySelectorAll('.btn-checkin').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.currentTarget.getAttribute('data-id');
                navigateTo('checkin', eventId);
            });
        });
    }

    async function loadEventDetails(eventId) {
        try {
            currentEvent = await apiService.getEventById(eventId);
            
            // Re-initialize DOM elements to ensure we have the latest references
            initDOMElements();
            
            // Update event details
            const checkinEventTitle = document.getElementById('checkin-event-title');
            const detailEventName = document.getElementById('detail-event-name');
            
            if (checkinEventTitle) checkinEventTitle.textContent = `Check-in: ${currentEvent.name}`;
            if (detailEventName) detailEventName.textContent = currentEvent.name;
            
            // Format date in a more compact way for mobile
            const eventDate = new Date(currentEvent.date);
            const dateFormatOptions = {
                weekday: window.innerWidth < 576 ? 'short' : 'long',
                year: 'numeric',
                month: window.innerWidth < 576 ? 'short' : 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            document.getElementById('detail-event-date').textContent = eventDate.toLocaleString(undefined, dateFormatOptions);
            document.getElementById('detail-event-description').textContent = currentEvent.description;
            
            // Reset search
            attendeeSearch.value = '';
            searchResults.classList.add('d-none');
            noResults.classList.add('d-none');
            
            // Update attendees page title
            document.getElementById('attendees-event-title').textContent = `Attendees: ${currentEvent.name}`;
        } catch (error) {
            console.error('Error loading event details:', error);
            showToast('Error', 'Failed to load event details. Please try again.');
            navigateTo('events');
        }
    }

    function searchAttendee() {
        const searchTerm = attendeeSearch.value.trim();
        
        if (!searchTerm) {
            showToast('Warning', 'Please enter a name or email to search');
            return;
        }
        
        if (!currentEvent || !currentEvent.people || currentEvent.people.length === 0) {
            noResults.classList.remove('d-none');
            searchResults.classList.add('d-none');
            return;
        }
        
        const results = apiService.searchPeopleInEvent(currentEvent, searchTerm);
        
        if (results.length === 0) {
            noResults.classList.remove('d-none');
            searchResults.classList.add('d-none');
            return;
        }
        
        renderSearchResults(results);
    }

    function renderSearchResults(people) {
        searchResultsBody.innerHTML = '';
        noResults.classList.add('d-none');
        searchResults.classList.remove('d-none');

        people.forEach(person => {
            const row = document.createElement('tr');

            // Create cells with textContent to prevent XSS
            const nameCell = document.createElement('td');
            nameCell.className = 'can-wrap';
            nameCell.textContent = person.name;

            const emailCell = document.createElement('td');
            emailCell.className = 'can-wrap d-none d-md-table-cell';
            emailCell.textContent = person.email;

            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = person.checkedIn ? 'badge bg-success' : 'badge bg-warning text-dark';
            statusBadge.textContent = person.checkedIn ? 'Checked In' : 'Not Checked In';
            statusCell.appendChild(statusBadge);

            const actionCell = document.createElement('td');
            if (person.checkedIn) {
                actionCell.innerHTML = `<button class="btn btn-sm btn-secondary" disabled>
                    <i class="bi bi-check-circle"></i><span class="d-none d-md-inline"> Already Checked In</span>
                </button>`;
            } else {
                actionCell.innerHTML = `<button class="btn btn-sm btn-success checkin-person" data-id="${escapeHtml(person.id)}">
                    <i class="bi bi-box-arrow-in-right"></i><span class="d-none d-md-inline"> Check In</span>
                </button>`;
            }

            row.appendChild(nameCell);
            row.appendChild(emailCell);
            row.appendChild(statusCell);
            row.appendChild(actionCell);

            searchResultsBody.appendChild(row);
        });

        // Add event listeners to check-in buttons
        document.querySelectorAll('.checkin-person').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const personId = e.currentTarget.getAttribute('data-id');
                await checkInPerson(personId);
            });
        });
    }

    async function checkInPerson(personId) {
        try {
            await apiService.checkInPerson(currentEventId, personId);
            
            // Reload event to get updated data
            await loadEventDetails(currentEventId);
            
            // Find the person in the event
            const person = currentEvent.people.find(p => p.id === personId);
            
            if (person) {
                // Show success modal
                document.getElementById('success-attendee-name').textContent = person.name;
                document.getElementById('success-attendee-email').textContent = person.email;
                
                // Format time in a more compact way
                const now = new Date();
                const timeFormatOptions = {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                };
                document.getElementById('success-checkin-time').textContent = now.toLocaleTimeString(undefined, timeFormatOptions);
                
                checkinSuccessModal.show();
            }
            
            // Clear search
            attendeeSearch.value = '';
            searchResults.classList.add('d-none');
            
            showToast('Success', 'Check-in successful!');
        } catch (error) {
            console.error('Error checking in person:', error);
            showToast('Error', 'Failed to check in. Please try again.');
        }
    }

    function showToast(title, message) {
        const toastTitle = document.getElementById('toast-title');
        const toastMessage = document.getElementById('toast-message');
        
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        
        const toast = new bootstrap.Toast(toastNotification);
        toast.show();
    }
    
    async function loadAttendeesList(eventId) {
        console.log('Loading attendees list for event:', eventId);
        
        // Re-initialize DOM elements to ensure we have the latest references
        initDOMElements();
        
        try {
            // Show loading indicator
            if (attendeesLoading) {
                attendeesLoading.classList.remove('d-none');
            } else {
                console.error('Attendees loading element not found');
            }
            
            if (attendeesListBody) {
                attendeesListBody.innerHTML = '';
            } else {
                console.error('Attendees list body element not found');
            }
            
            if (attendeesEmpty) {
                attendeesEmpty.classList.add('d-none');
            } else {
                console.error('Attendees empty element not found');
            }
            
            // If we don't have the current event data or it's for a different event, load it
            if (!currentEvent || currentEvent.id !== eventId) {
                console.log('Fetching event data for ID:', eventId);
                currentEvent = await apiService.getEventById(eventId);
                console.log('Event data received:', currentEvent);
            }
            
            // Update filtered attendees
            if (currentEvent && currentEvent.people) {
                console.log(`Found ${currentEvent.people.length} attendees for the event`);
                filteredAttendees = [...currentEvent.people];
                
                // Apply any existing filter
                filterAttendeesList();
            } else {
                console.error('No people found in the event data');
                if (attendeesEmpty) {
                    attendeesEmpty.classList.remove('d-none');
                }
            }
            
        } catch (error) {
            console.error('Error loading attendees list:', error);
            showToast('Error', 'Failed to load attendees list. Please try again.');
        } finally {
            if (attendeesLoading) {
                attendeesLoading.classList.add('d-none');
            }
        }
    }
    
    function filterAttendeesList() {
        const searchTerm = attendeesListSearch.value.toLowerCase().trim();
        
        // Filter the attendees based on search term
        const filtered = searchTerm
            ? filteredAttendees.filter(person =>
                person.name.toLowerCase().includes(searchTerm) ||
                person.email.toLowerCase().includes(searchTerm))
            : filteredAttendees;
        
        renderAttendeesList(filtered);
    }
    
    function renderAttendeesList(people) {
        if (!attendeesListBody) {
            console.error('Attendees list body element not found during rendering');
            return;
        }
        
        attendeesListBody.innerHTML = '';
        
        if (!people || people.length === 0) {
            if (attendeesEmpty) {
                attendeesEmpty.classList.remove('d-none');
            }
            return;
        }
        
        if (attendeesEmpty) {
            attendeesEmpty.classList.add('d-none');
        }
        
        // Sort people by check-in status (checked-in first) and then by name
        people.sort((a, b) => {
            if (a.checkedIn !== b.checkedIn) {
                return b.checkedIn ? 1 : -1; // Checked-in people first
            }
            return a.name.localeCompare(b.name); // Then alphabetically by name
        });
        
        people.forEach(person => {
            const row = document.createElement('tr');

            // Format check-in time if available
            let checkInTimeDisplay = '';
            if (person.checkedIn && person.checkInTime) {
                const checkInTime = new Date(person.checkInTime);
                const timeFormatOptions = {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                };
                checkInTimeDisplay = checkInTime.toLocaleTimeString(undefined, timeFormatOptions);
            }

            // Create cells with textContent to prevent XSS
            const nameCell = document.createElement('td');
            nameCell.className = 'can-wrap';
            nameCell.textContent = person.name;

            const emailCell = document.createElement('td');
            emailCell.className = 'can-wrap d-none d-md-table-cell';
            emailCell.textContent = person.email;

            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = person.checkedIn ? 'badge bg-success' : 'badge bg-warning text-dark';
            statusBadge.textContent = person.checkedIn ? 'Checked In' : 'Not Checked In';
            statusCell.appendChild(statusBadge);

            const timeCell = document.createElement('td');
            timeCell.className = 'd-none d-md-table-cell';
            timeCell.textContent = person.checkedIn ? checkInTimeDisplay : '-';

            row.appendChild(nameCell);
            row.appendChild(emailCell);
            row.appendChild(statusCell);
            row.appendChild(timeCell);

            attendeesListBody.appendChild(row);
        });
    }
});