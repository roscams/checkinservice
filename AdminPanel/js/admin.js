/**
 * Admin Panel JavaScript
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const eventsTableBody = document.getElementById('events-table-body');
    const eventsLoading = document.getElementById('events-loading');
    const eventsEmpty = document.getElementById('events-empty');
    const createEventForm = document.getElementById('create-event-form');
    const eventSearch = document.getElementById('event-search');
    const refreshEventsBtn = document.getElementById('refresh-events');
    const backToEventsBtn = document.getElementById('back-to-events');
    const uploadCsvForm = document.getElementById('upload-csv-form');
    const attendeesTableBody = document.getElementById('attendees-table-body');
    const toastNotification = document.getElementById('toast-notification');

    // State
    let currentPage = 'events';
    let currentEventId = null;
    let currentEvent = null;
    let events = [];
    let attendeeFilter = 'all'; // Track the current filter state: 'all', 'checked-in', or 'not-checked-in'
    let refreshInterval = null; // Variable to store the interval ID

    // Initialize
    loadEvents();
    setupEventListeners();
    startAutoRefresh(); // Start auto-refresh when page loads

    function setupEventListeners() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(e.target.getAttribute('data-page'));
            });
        });

        createEventForm.addEventListener('submit', handleCreateEvent);
        eventSearch.addEventListener('input', renderEvents);
        refreshEventsBtn.addEventListener('click', loadEvents);
        backToEventsBtn.addEventListener('click', () => navigateTo('events'));
        uploadCsvForm.addEventListener('submit', handleUploadCsv);
        
        // Add event listeners for attendee filtering
        document.getElementById('show-all-attendees').addEventListener('click', () => {
            setAttendeeFilter('all');
        });
        
        document.getElementById('show-checked-in').addEventListener('click', () => {
            setAttendeeFilter('checked-in');
        });
        
        document.getElementById('show-not-checked-in').addEventListener('click', () => {
            setAttendeeFilter('not-checked-in');
        });
    }
    
    function setAttendeeFilter(filter) {
        // Update the filter state
        attendeeFilter = filter;
        
        // Update active button state
        document.getElementById('show-all-attendees').classList.remove('active');
        document.getElementById('show-checked-in').classList.remove('active');
        document.getElementById('show-not-checked-in').classList.remove('active');
        
        document.getElementById(`show-${filter === 'all' ? 'all-attendees' : filter}`).classList.add('active');
        
        // Re-render attendees with the new filter
        renderAttendees();
    }

    function navigateTo(page, eventId = null) {
        document.querySelectorAll('.page').forEach(p => p.classList.add('d-none'));
        
        // Clear any existing refresh interval when navigating
        stopAutoRefresh();
        
        if (page === 'events') {
            document.getElementById('events-page').classList.remove('d-none');
            currentPage = 'events';
            loadEvents();
            startAutoRefresh(); // Start auto-refresh when on events page
        } else if (page === 'create-event') {
            document.getElementById('create-event-page').classList.remove('d-none');
            currentPage = 'create-event';
        } else if (page === 'event-details' && eventId) {
            document.getElementById('event-details-page').classList.remove('d-none');
            currentPage = 'event-details';
            currentEventId = eventId;
            loadEventDetails(eventId);
            startEventDetailsAutoRefresh(); // Start auto-refresh for event details
        }
    }

    async function loadEvents() {
        try {
            eventsLoading.classList.remove('d-none');
            events = await apiService.getAllEvents();
            renderEvents();
        } catch (error) {
            console.error(error);
        } finally {
            eventsLoading.classList.add('d-none');
        }
    }

    function renderEvents() {
        eventsTableBody.innerHTML = '';
        
        if (events.length === 0) {
            eventsEmpty.classList.remove('d-none');
            return;
        }
        
        eventsEmpty.classList.add('d-none');
        
        const searchTerm = eventSearch.value.toLowerCase().trim();
        const filteredEvents = searchTerm 
            ? events.filter(event => event.name.toLowerCase().includes(searchTerm))
            : events;
        
        filteredEvents.forEach(event => {
            const checkedInCount = event.people.filter(p => p.checkedIn).length;
            const row = document.createElement('tr');

            // Format date in a more compact way for mobile
            const eventDate = new Date(event.date);
            const dateString = eventDate.toLocaleString(undefined, CONFIG.DATE_FORMAT_OPTIONS);

            // Truncate description for better display
            const truncatedDesc = event.description && event.description.length > 50
                ? event.description.substring(0, 50) + '...'
                : event.description || '';

            // Create cells with textContent to prevent XSS
            const nameCell = document.createElement('td');
            nameCell.textContent = event.name;

            const dateCell = document.createElement('td');
            dateCell.textContent = dateString;

            const descCell = document.createElement('td');
            descCell.className = 'can-wrap d-none d-md-table-cell';
            descCell.textContent = truncatedDesc;

            const countCell = document.createElement('td');
            countCell.textContent = event.people.length;

            const checkinCell = document.createElement('td');
            checkinCell.textContent = `${checkedInCount} / ${event.people.length}`;

            const actionsCell = document.createElement('td');
            actionsCell.innerHTML = `
                <button class="btn btn-sm btn-primary view-event" data-id="${escapeHtml(event.id)}">
                    <i class="bi bi-eye"></i><span class="d-none d-md-inline"> View</span>
                </button>
                <button class="btn btn-sm btn-danger delete-event" data-id="${escapeHtml(event.id)}">
                    <i class="bi bi-trash"></i><span class="d-none d-md-inline"> Delete</span>
                </button>
            `;

            row.appendChild(nameCell);
            row.appendChild(dateCell);
            row.appendChild(descCell);
            row.appendChild(countCell);
            row.appendChild(checkinCell);
            row.appendChild(actionsCell);

            eventsTableBody.appendChild(row);
        });
        
        document.querySelectorAll('.view-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                navigateTo('event-details', e.currentTarget.getAttribute('data-id'));
            });
        });
        
        document.querySelectorAll('.delete-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('Delete this event?')) {
                    deleteEvent(e.currentTarget.getAttribute('data-id'));
                }
            });
        });
    }

    async function handleCreateEvent(e) {
        e.preventDefault();
        try {
            // Get the date value from the input
            const dateValue = document.getElementById('event-date').value;
            let dateObj;
            
            try {
                // Check for the specific invalid format "20/02/50615, 10:00"
                if (dateValue.includes('/') && dateValue.includes(',')) {
                    // Extract the time part
                    const timePart = dateValue.split(',')[1].trim();
                    // Create a valid date with the time
                    const today = new Date();
                    const [hours, minutes] = timePart.split(':');
                    today.setHours(parseInt(hours, 10));
                    today.setMinutes(parseInt(minutes, 10));
                    dateObj = today;
                    console.log('Converted invalid date format to:', dateObj);
                } else {
                    // Try to parse the date value normally
                    dateObj = new Date(dateValue);
                    
                    // Check if the date is valid
                    if (isNaN(dateObj.getTime())) {
                        throw new Error('Invalid date format');
                    }
                }
            } catch (err) {
                // If there's an error, use the current date
                console.error('Error parsing date:', err);
                dateObj = new Date();
                alert('There was an issue with the date format. Using current date instead.');
            }
            
            const eventData = {
                name: document.getElementById('event-name').value,
                date: dateObj.toISOString(),
                description: document.getElementById('event-description').value
            };
            
            console.log('Submitting event data:', eventData);
            const createdEvent = await apiService.createEvent(eventData);
            
            // Check if a CSV file was uploaded
            const csvFile = document.getElementById('create-csv-file').files[0];
            if (csvFile) {
                console.log('CSV file uploaded, uploading to event:', createdEvent.id);
                try {
                    await apiService.uploadCsv(createdEvent.id, csvFile);
                    console.log('CSV file uploaded successfully');
                } catch (csvError) {
                    console.error('Error uploading CSV:', csvError);
                    alert('Event was created, but there was an error uploading the CSV file.');
                }
            }
            
            createEventForm.reset();
            navigateTo('event-details', createdEvent.id);
        } catch (error) {
            console.error(error);
            alert('Failed to create event: ' + error.message);
        }
    }

    async function deleteEvent(eventId) {
        try {
            await apiService.deleteEvent(eventId);
            await loadEvents();
        } catch (error) {
            console.error(error);
        }
    }

    async function loadEventDetails(eventId) {
        try {
            // Show the attendees loading spinner
            document.getElementById('attendees-loading').classList.remove('d-none');
            
            currentEvent = await apiService.getEventById(eventId);
            document.getElementById('event-details-title').textContent = `Event: ${currentEvent.name}`;
            document.getElementById('detail-event-name').textContent = currentEvent.name;
            document.getElementById('detail-event-date').textContent = new Date(currentEvent.date).toLocaleString();
            document.getElementById('detail-event-description').textContent = currentEvent.description;
            document.getElementById('detail-event-attendees').textContent = currentEvent.people.length;
            renderAttendees();
        } catch (error) {
            console.error(error);
            navigateTo('events');
        } finally {
            // Hide the attendees loading spinner
            document.getElementById('attendees-loading').classList.add('d-none');
        }
    }

    function renderAttendees() {
        attendeesTableBody.innerHTML = '';
        if (!currentEvent || !currentEvent.people.length) {
            document.getElementById('attendees-empty').classList.remove('d-none');
            return;
        }
        
        document.getElementById('attendees-empty').classList.add('d-none');
        
        // Filter attendees based on the current filter
        let filteredAttendees = currentEvent.people;
        
        if (attendeeFilter === 'checked-in') {
            filteredAttendees = currentEvent.people.filter(person => person.checkedIn);
        } else if (attendeeFilter === 'not-checked-in') {
            filteredAttendees = currentEvent.people.filter(person => !person.checkedIn);
        }
        
        // Show empty message if no attendees match the filter
        if (filteredAttendees.length === 0) {
            const emptyMessage = document.getElementById('attendees-empty');
            emptyMessage.textContent = `No ${attendeeFilter === 'checked-in' ? 'checked-in' : 'non-checked-in'} attendees found.`;
            emptyMessage.classList.remove('d-none');
            return;
        }
        
        filteredAttendees.forEach(person => {
            const row = document.createElement('tr');

            // Format check-in time in a more compact way
            let checkInTimeDisplay = '-';
            if (person.checkedIn && person.checkInTime) {
                const checkInTime = new Date(person.checkInTime);
                checkInTimeDisplay = checkInTime.toLocaleString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    month: 'short',
                    day: 'numeric'
                });
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
            timeCell.textContent = checkInTimeDisplay;

            const actionsCell = document.createElement('td');
            actionsCell.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-sm btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="bi bi-gear"></i> Actions
                    </button>
                    <ul class="dropdown-menu">
                        <li>
                            <a class="dropdown-item toggle-checkin" href="#" data-id="${escapeHtml(person.id)}">
                                <i class="bi bi-${person.checkedIn ? 'x-circle' : 'check-circle'}"></i>
                                ${person.checkedIn ? 'Uncheck' : 'Check In'}
                            </a>
                        </li>
                        <li>
                            <a class="dropdown-item remove-person" href="#" data-id="${escapeHtml(person.id)}">
                                <i class="bi bi-trash"></i> Remove
                            </a>
                        </li>
                    </ul>
                </div>
            `;

            row.appendChild(nameCell);
            row.appendChild(emailCell);
            row.appendChild(statusCell);
            row.appendChild(timeCell);
            row.appendChild(actionsCell);

            attendeesTableBody.appendChild(row);
        });
        
        // Add event listeners for the toggle check-in dropdown items
        document.querySelectorAll('.toggle-checkin').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault(); // Prevent the default link behavior
                const personId = e.currentTarget.getAttribute('data-id');
                try {
                    await apiService.toggleCheckInStatus(currentEventId, personId);
                    showToast('Check-in status updated successfully');
                    await loadEventDetails(currentEventId);
                } catch (error) {
                    console.error('Error toggling check-in status:', error);
                    showToast('Failed to update check-in status', 'error');
                }
            });
        });
        
        // Add event listeners for the remove person dropdown items
        document.querySelectorAll('.remove-person').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault(); // Prevent the default link behavior
                const personId = e.currentTarget.getAttribute('data-id');
                if (confirm('Are you sure you want to remove this person?')) {
                    try {
                        await apiService.removePerson(currentEventId, personId);
                        showToast('Person removed successfully');
                        await loadEventDetails(currentEventId);
                    } catch (error) {
                        console.error('Error removing person:', error);
                        showToast('Failed to remove person', 'error');
                    }
                }
            });
        });
    }
    
    // Helper function to show toast notifications
    function showToast(message, type = 'success') {
        const toast = toastNotification;
        const toastMessage = document.getElementById('toast-message');
        const toastTitle = document.getElementById('toast-title');
        
        // Set the message and title
        toastMessage.textContent = message;
        toastTitle.textContent = type === 'error' ? 'Error' : 'Success';
        
        // Remove any existing background classes
        toast.classList.remove('bg-success', 'bg-danger', 'text-white');
        
        // Add appropriate styling based on type
        if (type === 'error') {
            toast.classList.add('bg-danger', 'text-white');
        } else {
            toast.classList.add('bg-success', 'text-white');
        }
        
        // Show the toast
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }

    async function handleUploadCsv(e) {
        e.preventDefault();
        const file = document.getElementById('csv-file').files[0];
        if (!file) return;
        
        try {
            await apiService.uploadCsv(currentEventId, file);
            uploadCsvForm.reset();
            await loadEventDetails(currentEventId);
        } catch (error) {
            console.error(error);
        }
    }
    
    // Function to start auto-refresh for events table
    function startAutoRefresh() {
        // Clear any existing interval first
        stopAutoRefresh();
        
        // Set new interval to refresh events every 5 seconds
        refreshInterval = setInterval(() => {
            if (currentPage === 'events') {
                console.log('Auto-refreshing events table...');
                loadEvents();
            }
        }, 5000); // 5000 ms = 5 seconds
    }
    
    // Function to start auto-refresh for event details
    function startEventDetailsAutoRefresh() {
        // Clear any existing interval first
        stopAutoRefresh();
        
        // Set new interval to refresh event details every 5 seconds
        refreshInterval = setInterval(() => {
            if (currentPage === 'event-details' && currentEventId) {
                console.log('Auto-refreshing event details...');
                loadEventDetails(currentEventId);
            }
        }, 5000); // 5000 ms = 5 seconds
    }
    
    // Function to stop auto-refresh
    function stopAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    }
});
