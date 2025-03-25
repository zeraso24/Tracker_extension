// Main application initialization for the extension
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    utils.modal.init();
    
    // Update date in header
    const dateDisplay = document.querySelector('.date');
    if (dateDisplay) {
        const today = new Date();
        dateDisplay.textContent = utils.formatDate(today);
    }

    // Request notification permissions if not granted
    if (chrome && chrome.permissions) {
        chrome.permissions.contains({
            permissions: ['notifications']
        }, (result) => {
            if (!result) {
                chrome.permissions.request({
                    permissions: ['notifications']
                });
            }
        });
    }

    // Handle modal close buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                utils.modal.close(modal.id);
            }
        });
    });

    // Handle settings
    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            // Create settings modal if it doesn't exist
            if (!document.getElementById('settings-modal')) {
                createSettingsModal();
            }
            utils.modal.open('settings-modal');
        });
    }

    // Check for extension updates
    chrome.runtime.onInstalled.addListener((details) => {
        if (details.reason === 'update') {
            utils.notify('Task Tracker has been updated to the latest version!', 'success');
        }
    });
});

// Create settings modal dynamically
function createSettingsModal() {
    const modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.className = 'modal hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg p-6 w-96';
    
    const title = document.createElement('h2');
    title.className = 'text-xl font-semibold mb-4';
    title.textContent = 'Settings';
    
    const form = document.createElement('form');
    form.id = 'settings-form';
    
    // Pomodoro length setting
    const pomodoroLengthGroup = document.createElement('div');
    pomodoroLengthGroup.className = 'mb-4';
    
    const pomodoroLengthLabel = document.createElement('label');
    pomodoroLengthLabel.htmlFor = 'pomodoro-length';
    pomodoroLengthLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    pomodoroLengthLabel.textContent = 'Pomodoro Length (minutes)';
    
    const pomodoroLengthInput = document.createElement('input');
    pomodoroLengthInput.type = 'number';
    pomodoroLengthInput.id = 'pomodoro-length';
    pomodoroLengthInput.name = 'pomodoro-length';
    pomodoroLengthInput.min = '1';
    pomodoroLengthInput.max = '60';
    pomodoroLengthInput.value = '25';
    pomodoroLengthInput.className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#bcfa97]';
    
    pomodoroLengthGroup.appendChild(pomodoroLengthLabel);
    pomodoroLengthGroup.appendChild(pomodoroLengthInput);
    
    // Short break length setting
    const shortBreakLengthGroup = document.createElement('div');
    shortBreakLengthGroup.className = 'mb-4';
    
    const shortBreakLengthLabel = document.createElement('label');
    shortBreakLengthLabel.htmlFor = 'short-break-length';
    shortBreakLengthLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    shortBreakLengthLabel.textContent = 'Short Break Length (minutes)';
    
    const shortBreakLengthInput = document.createElement('input');
    shortBreakLengthInput.type = 'number';
    shortBreakLengthInput.id = 'short-break-length';
    shortBreakLengthInput.name = 'short-break-length';
    shortBreakLengthInput.min = '1';
    shortBreakLengthInput.max = '30';
    shortBreakLengthInput.value = '5';
    shortBreakLengthInput.className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#bcfa97]';
    
    shortBreakLengthGroup.appendChild(shortBreakLengthLabel);
    shortBreakLengthGroup.appendChild(shortBreakLengthInput);
    
    // Notifications setting
    const notificationsGroup = document.createElement('div');
    notificationsGroup.className = 'mb-4';
    
    const notificationsLabel = document.createElement('label');
    notificationsLabel.className = 'flex items-center';
    
    const notificationsInput = document.createElement('input');
    notificationsInput.type = 'checkbox';
    notificationsInput.id = 'notifications-enabled';
    notificationsInput.name = 'notifications-enabled';
    notificationsInput.className = 'mr-2';
    notificationsInput.checked = true;
    
    const notificationsText = document.createElement('span');
    notificationsText.className = 'text-sm font-medium text-gray-700';
    notificationsText.textContent = 'Enable Notifications';
    
    notificationsLabel.appendChild(notificationsInput);
    notificationsLabel.appendChild(notificationsText);
    notificationsGroup.appendChild(notificationsLabel);
    
    // Form actions
    const formActions = document.createElement('div');
    formActions.className = 'flex justify-end gap-3';
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'close-modal px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300';
    cancelButton.textContent = 'Cancel';
    
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.className = 'px-4 py-2 bg-[#bcfa97] text-[#272f35] rounded-md hover:bg-[#a8e584]';
    saveButton.textContent = 'Save';
    
    formActions.appendChild(cancelButton);
    formActions.appendChild(saveButton);
    
    // Assemble form
    form.appendChild(pomodoroLengthGroup);
    form.appendChild(shortBreakLengthGroup);
    form.appendChild(notificationsGroup);
    form.appendChild(formActions);
    
    // Add event listener to form
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const settings = {
            pomodoroLength: parseInt(pomodoroLengthInput.value) || 25,
            shortBreakLength: parseInt(shortBreakLengthInput.value) || 5,
            notificationsEnabled: notificationsInput.checked
        };
        
        chrome.storage.local.set({ settings }, () => {
            utils.modal.close('settings-modal');
            utils.notify('Settings saved successfully!', 'success');
        });
    });
    
    // Load existing settings
    chrome.storage.local.get(['settings'], (data) => {
        const settings = data.settings || {
            pomodoroLength: 25,
            shortBreakLength: 5,
            notificationsEnabled: true
        };
        
        pomodoroLengthInput.value = settings.pomodoroLength;
        shortBreakLengthInput.value = settings.shortBreakLength;
        notificationsInput.checked = settings.notificationsEnabled;
    });
    
    // Assemble modal
    modalContent.appendChild(title);
    modalContent.appendChild(form);
    modal.appendChild(modalContent);
    
    // Add to DOM
    document.body.appendChild(modal);
    
    // Add event listener to close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            utils.modal.close('settings-modal');
        }
    });
}
