// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize map
    initMap();
    
    // Setup emergency modal
    setupEmergencyModal();
    
    // Setup blood donation
    setupBloodDonation();
    
    // Load initial data
    loadDashboardData();
    
    // Setup notifications
    setupNotifications();
});

// ===== MAP INITIALIZATION =====
function initMap() {
    const map = L.map('map').setView([20.5937, 78.9629], 5); // Center on India
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
    
    // Add sample hospital markers
    const hospitals = [
        { name: 'City General Hospital', lat: 28.6139, lng: 77.2090, type: 'hospital' },
        { name: 'Memorial Medical Center', lat: 19.0760, lng: 72.8777, type: 'hospital' },
        { name: 'Unity Health Center', lat: 13.0827, lng: 80.2707, type: 'hospital' }
    ];
    
    hospitals.forEach(hospital => {
        const marker = L.marker([hospital.lat, hospital.lng])
            .addTo(map)
            .bindPopup(`<strong>${hospital.name}</strong><br>ICU Beds: 12<br>Emergency: Available`);
        
        marker._icon.classList.add('hospital-marker');
    });
    
    // Add sample emergency markers
    const emergencies = [
        { type: 'critical', lat: 28.62, lng: 77.20, details: 'Cardiac Emergency' },
        { type: 'urgent', lat: 28.60, lng: 77.22, details: 'Road Accident' },
        { type: 'routine', lat: 28.58, lng: 77.25, details: 'Respiratory Distress' }
    ];
    
    emergencies.forEach(emergency => {
        const icon = L.divIcon({
            className: `emergency-marker ${emergency.type}`,
            html: '<i class="fas fa-cross"></i>',
            iconSize: [30, 30]
        });
        
        L.marker([emergency.lat, emergency.lng], { icon })
            .addTo(map)
            .bindPopup(`<strong>${emergency.details}</strong><br>Status: Active`);
    });
    
    // Add ambulance markers
    const ambulances = [
        { lat: 28.615, lng: 77.210, status: 'moving' },
        { lat: 28.605, lng: 77.215, status: 'idle' }
    ];
    
    ambulances.forEach(ambulance => {
        const icon = L.divIcon({
            className: 'ambulance-marker',
            html: '<i class="fas fa-ambulance"></i>',
            iconSize: [25, 25]
        });
        
        L.marker([ambulance.lat, ambulance.lng], { icon })
            .addTo(map)
            .bindPopup('Ambulance #MED-124<br>Status: En Route');
    });
    
    return map;
}

// ===== EMERGENCY MODAL =====
function setupEmergencyModal() {
    const emergencyBtn = document.getElementById('emergencyBtn');
    const emergencyModal = document.getElementById('emergencyModal');
    const closeModal = emergencyModal.querySelector('.close-modal');
    const prevStepBtn = document.getElementById('prevStep');
    const nextStepBtn = document.getElementById('nextStep');
    const submitEmergencyBtn = document.getElementById('submitEmergency');
    
    let currentStep = 1;
    const totalSteps = 4;
    let emergencyData = {
        location: null,
        phone: '',
        type: '',
        symptoms: [],
        additionalInfo: ''
    };
    
    // Symptoms data
    const symptoms = [
        'Chest pain', 'Difficulty breathing', 'Severe bleeding', 'Unconsciousness',
        'Seizure', 'Severe headache', 'Sudden weakness', 'High fever',
        'Severe pain', 'Confusion', 'Vomiting blood', 'Suicidal thoughts'
    ];
    
    // Open modal
    emergencyBtn.addEventListener('click', () => {
        emergencyModal.style.display = 'block';
        currentStep = 1;
        updateStep();
        loadSymptoms();
    });
    
    // Close modal
    closeModal.addEventListener('click', () => {
        emergencyModal.style.display = 'none';
        resetEmergencyForm();
    });
    
    // Click outside to close
    window.addEventListener('click', (e) => {
        if (e.target === emergencyModal) {
            emergencyModal.style.display = 'none';
            resetEmergencyForm();
        }
    });
    
    // Previous step
    prevStepBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateStep();
        }
    });
    
    // Next step
    nextStepBtn.addEventListener('click', () => {
        if (validateStep(currentStep)) {
            if (currentStep < totalSteps) {
                currentStep++;
                updateStep();
                if (currentStep === totalSteps) {
                    updateConfirmation();
                }
            }
        }
    });
    
    // Submit emergency
    submitEmergencyBtn.addEventListener('click', submitEmergency);
    
    // Get location
    document.getElementById('getLocation').addEventListener('click', getLocation);
    
    // Emergency type selection
    document.querySelectorAll('.emergency-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.emergency-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
            emergencyData.type = this.dataset.type;
        });
    });
    
    // Phone number input
    document.getElementById('emergencyPhone').addEventListener('input', function(e) {
        emergencyData.phone = e.target.value;
    });
    
    // Additional info
    document.getElementById('additionalDetails').addEventListener('input', function(e) {
        emergencyData.additionalInfo = e.target.value;
    });
    
    function updateStep() {
        // Update stepper
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.dataset.step) === currentStep) {
                step.classList.add('active');
            }
        });
        
        // Update step content
        document.querySelectorAll('.step-content').forEach(content => {
            content.classList.remove('active');
            if (parseInt(content.dataset.step) === currentStep) {
                content.classList.add('active');
            }
        });
        
        // Update buttons
        prevStepBtn.style.display = currentStep === 1 ? 'none' : 'inline-flex';
        nextStepBtn.style.display = currentStep === totalSteps ? 'none' : 'inline-flex';
        submitEmergencyBtn.style.display = currentStep === totalSteps ? 'inline-flex' : 'none';
    }
    
    function loadSymptoms() {
        const symptomsGrid = document.querySelector('.symptoms-grid');
        symptomsGrid.innerHTML = '';
        
        symptoms.forEach(symptom => {
            const chip = document.createElement('div');
            chip.className = 'symptom-chip';
            chip.textContent = symptom;
            chip.addEventListener('click', function() {
                this.classList.toggle('selected');
                if (this.classList.contains('selected')) {
                    emergencyData.symptoms.push(symptom);
                } else {
                    emergencyData.symptoms = emergencyData.symptoms.filter(s => s !== symptom);
                }
            });
            symptomsGrid.appendChild(chip);
        });
    }
    
    function getLocation() {
        const locationDisplay = document.getElementById('locationDisplay');
        const locationBtn = document.getElementById('getLocation');
        
        locationDisplay.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting location...';
        locationDisplay.classList.add('show');
        locationBtn.disabled = true;
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    // Reverse geocode to get address
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                        .then(response => response.json())
                        .then(data => {
                            emergencyData.location = {
                                lat: lat,
                                lng: lng,
                                address: data.display_name || 'Location obtained'
                            };
                            
                            locationDisplay.innerHTML = `
                                <i class="fas fa-check-circle" style="color: #4caf50;"></i>
                                <strong>Location obtained:</strong> ${emergencyData.location.address}<br>
                                <small>Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}</small>
                            `;
                            locationBtn.disabled = false;
                            locationBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Update Location';
                        })
                        .catch(error => {
                            locationDisplay.innerHTML = `
                                <i class="fas fa-exclamation-triangle" style="color: #ff9800;"></i>
                                Could not get address. Using coordinates.
                            `;
                            emergencyData.location = {
                                lat: lat,
                                lng: lng,
                                address: 'Coordinates only'
                            };
                            locationBtn.disabled = false;
                        });
                },
                function(error) {
                    locationDisplay.innerHTML = `
                        <i class="fas fa-exclamation-triangle" style="color: #f44336;"></i>
                        Unable to get location. Please enable location services.
                    `;
                    locationBtn.disabled = false;
                    console.error('Geolocation error:', error);
                }
            );
        } else {
            locationDisplay.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="color: #f44336;"></i>
                Geolocation is not supported by your browser.
            `;
            locationBtn.disabled = true;
        }
    }
    
    function validateStep(step) {
        switch(step) {
            case 1:
                if (!emergencyData.location) {
                    showAlert('Please share your location to continue.', 'danger');
                    return false;
                }
                if (!emergencyData.phone || emergencyData.phone.length < 10) {
                    showAlert('Please enter a valid phone number.', 'danger');
                    return false;
                }
                return true;
                
            case 2:
                if (!emergencyData.type) {
                    showAlert('Please select the type of emergency.', 'danger');
                    return false;
                }
                return true;
                
            case 3:
                if (emergencyData.symptoms.length === 0) {
                    showAlert('Please select at least one symptom.', 'danger');
                    return false;
                }
                return true;
                
            default:
                return true;
        }
    }
    
    function updateConfirmation() {
        const confirmationDiv = document.querySelector('.confirmation-details');
        
        let html = `
            <div class="confirmation-item">
                <div class="confirmation-label">Location</div>
                <div class="confirmation-value">${emergencyData.location.address}</div>
            </div>
            <div class="confirmation-item">
                <div class="confirmation-label">Phone Number</div>
                <div class="confirmation-value">${emergencyData.phone}</div>
            </div>
            <div class="confirmation-item">
                <div class="confirmation-label">Emergency Type</div>
                <div class="confirmation-value">${getEmergencyTypeName(emergencyData.type)}</div>
            </div>
            <div class="confirmation-item">
                <div class="confirmation-label">Symptoms</div>
                <div class="confirmation-value">${emergencyData.symptoms.join(', ')}</div>
            </div>
        `;
        
        if (emergencyData.additionalInfo) {
            html += `
                <div class="confirmation-item">
                    <div class="confirmation-label">Additional Information</div>
                    <div class="confirmation-value">${emergencyData.additionalInfo}</div>
                </div>
            `;
        }
        
        confirmationDiv.innerHTML = html;
    }
    
    function getEmergencyTypeName(type) {
        const types = {
            'cardiac': 'Cardiac Emergency',
            'stroke': 'Stroke',
            'trauma': 'Trauma/Accident',
            'respiratory': 'Breathing Difficulty',
            'burn': 'Severe Burns',
            'other': 'Other Emergency'
        };
        return types[type] || type;
    }
    
    function submitEmergency() {
        submitEmergencyBtn.disabled = true;
        submitEmergencyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        // Simulate API call
        setTimeout(() => {
            showAlert('Emergency reported successfully! Help is on the way.', 'success');
            
            // Add to emergency list
            addNewEmergency(emergencyData);
            
            // Close modal
            emergencyModal.style.display = 'none';
            resetEmergencyForm();
            
            // Re-enable button
            submitEmergencyBtn.disabled = false;
            submitEmergencyBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Emergency';
        }, 2000);
    }
    
    function resetEmergencyForm() {
        currentStep = 1;
        emergencyData = {
            location: null,
            phone: '',
            type: '',
            symptoms: [],
            additionalInfo: ''
        };
        
        document.getElementById('emergencyPhone').value = '';
        document.getElementById('additionalDetails').value = '';
        document.querySelectorAll('.emergency-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        document.querySelectorAll('.symptom-chip').forEach(chip => {
            chip.classList.remove('selected');
        });
        document.getElementById('locationDisplay').classList.remove('show');
        document.getElementById('getLocation').innerHTML = '<i class="fas fa-location-arrow"></i> Get My Location';
        document.getElementById('getLocation').disabled = false;
    }
}

// ===== BLOOD DONATION =====
function setupBloodDonation() {
    // Blood donation buttons
    document.querySelectorAll('.request-actions .btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const requestItem = this.closest('.request-item');
            const bloodType = requestItem.querySelector('.request-type span').textContent;
            const hospital = requestItem.querySelector('h4').textContent;
            
            if (confirm(`Are you sure you want to donate ${bloodType} blood to ${hospital}?`)) {
                this.disabled = true;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                
                setTimeout(() => {
                    showAlert(`Thank you! ${hospital} has been notified of your availability.`, 'success');
                    this.innerHTML = '<i class="fas fa-check"></i> Donated';
                    this.classList.remove('btn-danger');
                    this.classList.add('btn-success');
                    
                    // Update blood levels
                    updateBloodLevels(bloodType);
                }, 1500);
            }
        });
    });
}

function updateBloodLevels(bloodType) {
    const bloodItem = document.querySelector(`.${bloodType.toLowerCase().replace('+', '-positive').replace('-', '-negative')}`);
    if (bloodItem) {
        const levelBar = bloodItem.querySelector('.level-bar');
        const currentWidth = parseFloat(levelBar.style.width);
        const newWidth = Math.min(currentWidth + 5, 100);
        levelBar.style.width = `${newWidth}%`;
        
        const unitsSpan = bloodItem.querySelector('.blood-info span');
        const currentUnits = parseInt(unitsSpan.textContent);
        unitsSpan.textContent = `${currentUnits + 1} units`;
    }
}

// ===== DASHBOARD DATA =====
function loadDashboardData() {
    // Simulate loading data
    setTimeout(() => {
        updateStats();
        updateActivityFeed();
    }, 1000);
}

function updateStats() {
    // Simulate real-time updates
    const stats = document.querySelectorAll('.stat-card h3');
    stats.forEach(stat => {
        const current = parseInt(stat.textContent);
        const change = Math.floor(Math.random() * 5) - 2; // Random change between -2 and +2
        const newValue = Math.max(0, current + change);
        stat.textContent = newValue;
    });
}

function updateActivityFeed() {
    const activities = [
        { type: 'success', text: 'Emergency #2456 resolved', time: '2 minutes ago' },
        { type: 'info', text: 'Blood request fulfilled - O-', time: '15 minutes ago' },
        { type: 'warning', text: 'ICU bed shortage alert', time: '1 hour ago' },
        { type: 'info', text: 'New blood donation registered', time: '2 hours ago' },
        { type: 'success', text: 'Patient discharged successfully', time: '3 hours ago' }
    ];
    
    const timeline = document.querySelector('.activity-timeline');
    if (timeline) {
        // Keep only first 3 items, add new one
        const items = timeline.querySelectorAll('.activity-item');
        if (items.length >= 3) {
            timeline.removeChild(items[items.length - 1]);
        }
        
        // Add new activity
        const newActivity = activities[Math.floor(Math.random() * activities.length)];
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon ${newActivity.type}">
                <i class="fas fa-${newActivity.type === 'success' ? 'check-circle' : newActivity.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            </div>
            <div class="activity-details">
                <p>${newActivity.text}</p>
                <small>${newActivity.time}</small>
            </div>
        `;
        
        timeline.insertBefore(activityItem, timeline.firstChild);
    }
}

// ===== NOTIFICATIONS =====
function setupNotifications() {
    const notificationBtn = document.querySelector('.notifications');
    const notificationCount = document.querySelector('.notification-count');
    
    if (notificationBtn) {
        notificationBtn.addEventListener('click', showNotifications);
        
        // Simulate new notifications
        setInterval(() => {
            const count = parseInt(notificationCount.textContent);
            if (count < 99 && Math.random() > 0.7) {
                notificationCount.textContent = count + 1;
                notificationCount.style.animation = 'pulse 0.5s';
                setTimeout(() => {
                    notificationCount.style.animation = '';
                }, 500);
            }
        }, 30000); // Check every 30 seconds
    }
}

function showNotifications() {
    const notifications = [
        { type: 'emergency', text: 'New cardiac emergency reported nearby', time: '2 min ago', read: false },
        { type: 'blood', text: 'Critical need for O- blood at City General', time: '15 min ago', read: false },
        { type: 'system', text: 'System maintenance scheduled for tonight', time: '1 hour ago', read: true }
    ];
    
    // Create notification dropdown
    let dropdown = document.querySelector('.notification-dropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'notification-dropdown';
        document.querySelector('.nav-user').appendChild(dropdown);
    }
    
    dropdown.innerHTML = `
        <div class="notification-header">
            <h4>Notifications</h4>
            <button class="mark-all-read">Mark all as read</button>
        </div>
        <div class="notification-list">
            ${notifications.map(notif => `
                <div class="notification-item ${notif.read ? 'read' : 'unread'} ${notif.type}">
                    <div class="notification-icon">
                        <i class="fas fa-${notif.type === 'emergency' ? 'exclamation-triangle' : notif.type === 'blood' ? 'tint' : 'cog'}"></i>
                    </div>
                    <div class="notification-content">
                        <p>${notif.text}</p>
                        <small>${notif.time}</small>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="notification-footer">
            <a href="#">View all notifications</a>
        </div>
    `;
    
    dropdown.style.display = 'block';
    
    // Mark all as read
    dropdown.querySelector('.mark-all-read').addEventListener('click', function() {
        document.querySelectorAll('.notification-item').forEach(item => {
            item.classList.remove('unread');
            item.classList.add('read');
        });
        document.querySelector('.notification-count').textContent = '0';
    });
    
    // Close when clicking outside
    document.addEventListener('click', function closeNotifications(e) {
        if (!e.target.closest('.notifications') && !e.target.closest('.notification-dropdown')) {
            dropdown.style.display = 'none';
            document.removeEventListener('click', closeNotifications);
        }
    });
}

// ===== HELPER FUNCTIONS =====
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert-toast');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Create alert
    const alert = document.createElement('div');
    alert.className = `alert-toast alert-${type}`;
    alert.innerHTML = `
        <div class="alert-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'danger' ? 'times-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="alert-close">&times;</button>
    `;
    
    document.body.appendChild(alert);
    
    // Show alert
    setTimeout(() => {
        alert.classList.add('show');
    }, 10);
    
    // Auto remove
    setTimeout(() => {
        hideAlert(alert);
    }, 5000);
    
    // Close button
    alert.querySelector('.alert-close').addEventListener('click', () => {
        hideAlert(alert);
    });
}

function hideAlert(alert) {
    alert.classList.remove('show');
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 300);
}

function addNewEmergency(data) {
    const emergencyList = document.querySelector('.emergency-list');
    if (!emergencyList) return;
    
    const emergencyItem = document.createElement('div');
    emergencyItem.className = `emergency-item ${getSeverityClass(data.type)}`;
    
    const icon = getEmergencyIcon(data.type);
    const typeName = getEmergencyTypeName(data.type);
    
    emergencyItem.innerHTML = `
        <div class="emergency-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="emergency-details">
            <h4>${typeName}</h4>
            <p><i class="fas fa-map-marker-alt"></i> New emergency</p>
            <p><i class="fas fa-clock"></i> Just now</p>
        </div>
        <div class="emergency-status">
            <span class="status-badge dispatched">Ambulance Dispatched</span>
            <span class="time-remaining">ETA: 4min</span>
        </div>
    `;
    
    // Add to top of list
    emergencyList.insertBefore(emergencyItem, emergencyList.firstChild);
    
    // Update stats
    const emergencyStat = document.querySelector('.stat-card:nth-child(1) h3');
    if (emergencyStat) {
        const current = parseInt(emergencyStat.textContent);
        emergencyStat.textContent = current + 1;
    }
}

function getSeverityClass(type) {
    const severity = {
        'cardiac': 'critical',
        'stroke': 'critical',
        'trauma': 'urgent',
        'respiratory': 'urgent',
        'burn': 'urgent',
        'other': 'routine'
    };
    return severity[type] || 'routine';
}

function getEmergencyIcon(type) {
    const icons = {
        'cardiac': 'heartbeat',
        'stroke': 'brain',
        'trauma': 'car-crash',
        'respiratory': 'lungs',
        'burn': 'fire',
        'other': 'plus-circle'
    };
    return icons[type] || 'exclamation-triangle';
}

// ===== PERIODIC UPDATES =====
// Update dashboard every 30 seconds
setInterval(updateStats, 30000);
setInterval(updateActivityFeed, 60000); // Every minute

// ===== ADDITIONAL STYLES FOR DYNAMIC ELEMENTS =====
const style = document.createElement('style');
style.textContent = `
    /* Notification Dropdown */
    .notification-dropdown {
        position: absolute;
        top: 60px;
        right: 20px;
        width: 350px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 1000;
        display: none;
    }
    
    .notification-header {
        padding: 15px;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .notification-header h4 {
        margin: 0;
        font-size: 1rem;
    }
    
    .mark-all-read {
        background: none;
        border: none;
        color: #1976d2;
        cursor: pointer;
        font-size: 0.85rem;
    }
    
    .notification-list {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .notification-item {
        padding: 15px;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        gap: 12px;
        transition: background-color 0.2s;
    }
    
    .notification-item:hover {
        background-color: #f8f9fa;
    }
    
    .notification-item.unread {
        background-color: rgba(25, 118, 210, 0.05);
    }
    
    .notification-item.emergency {
        border-left: 4px solid #f44336;
    }
    
    .notification-item.blood {
        border-left: 4px solid #d32f2f;
    }
    
    .notification-item.system {
        border-left: 4px solid #6c757d;
    }
    
    .notification-icon {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: #e9ecef;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    
    .notification-icon i {
        color: #6c757d;
    }
    
    .notification-item.emergency .notification-icon {
        background: rgba(244, 67, 54, 0.1);
    }
    
    .notification-item.emergency .notification-icon i {
        color: #f44336;
    }
    
    .notification-item.blood .notification-icon {
        background: rgba(211, 47, 47, 0.1);
    }
    
    .notification-item.blood .notification-icon i {
        color: #d32f2f;
    }
    
    .notification-content {
        flex: 1;
    }
    
    .notification-content p {
        margin: 0 0 5px 0;
        font-size: 0.9rem;
        color: #212529;
    }
    
    .notification-content small {
        color: #6c757d;
        font-size: 0.8rem;
    }
    
    .notification-footer {
        padding: 15px;
        text-align: center;
        border-top: 1px solid #e9ecef;
    }
    
    .notification-footer a {
        color: #1976d2;
        text-decoration: none;
        font-size: 0.9rem;
    }
    
    /* Alert Toast */
    .alert-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        padding: 15px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 400px;
    }
    
    .alert-toast.show {
        transform: translateX(0);
    }
    
    .alert-success {
        border-left: 4px solid #4caf50;
    }
    
    .alert-warning {
        border-left: 4px solid #ff9800;
    }
    
    .alert-danger {
        border-left: 4px solid #f44336;
    }
    
    .alert-info {
        border-left: 4px solid #2196f3;
    }
    
    .alert-content {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
    }
    
    .alert-content i {
        font-size: 1.2rem;
    }
    
    .alert-success .alert-content i {
        color: #4caf50;
    }
    
    .alert-warning .alert-content i {
        color: #ff9800;
    }
    
    .alert-danger .alert-content i {
        color: #f44336;
    }
    
    .alert-info .alert-content i {
        color: #2196f3;
    }
    
    .alert-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #6c757d;
        cursor: pointer;
        line-height: 1;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    /* Map Markers */
    .hospital-marker {
        filter: hue-rotate(180deg);
    }
    
    .emergency-marker.critical {
        color: #f44336;
        text-shadow: 0 0 3px white;
    }
    
    .emergency-marker.urgent {
        color: #ff9800;
        text-shadow: 0 0 3px white;
    }
    
    .emergency-marker.routine {
        color: #2196f3;
        text-shadow: 0 0 3px white;
    }
    
    .ambulance-marker {
        color: #ff9800;
        text-shadow: 0 0 3px white;
    }
`;
document.head.appendChild(style);