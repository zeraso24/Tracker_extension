// Utility functions for the Task Tracker extension

const utils = {
  // Storage utilities adapted for Chrome extension storage
  storage: {
    get: function(key, callback) {
      if (callback) {
        // Asynchronous get
        chrome.storage.local.get([key], (result) => {
          callback(result[key]);
        });
      } else {
        // For compatibility with the original code, we'll return a promise
        // that resolves immediately with the stored value
        return new Promise((resolve) => {
          chrome.storage.local.get([key], (result) => {
            resolve(result[key]);
          });
        });
      }
    },
    
    set: function(key, value, callback) {
      const data = {};
      data[key] = value;
      
      chrome.storage.local.set(data, callback);
    },
    
    remove: function(key, callback) {
      chrome.storage.local.remove(key, callback);
    }
  },
  
  // Modal utilities
  modal: {
    init: function() {
      // Close modal when clicking outside
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
          this.closeAll();
        }
      });
      
      // Close modal when clicking close button
      document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
          this.closeAll();
        });
      });
      
      // Close modal when pressing Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeAll();
        }
      });
    },
    
    open: function(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('hidden');
        
        // Focus first input
        const firstInput = modal.querySelector('input');
        if (firstInput) {
          setTimeout(() => {
            firstInput.focus();
          }, 100);
        }
      }
    },
    
    close: function(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('hidden');
        
        // Reset form
        const form = modal.querySelector('form');
        if (form) {
          form.reset();
        }
      }
    },
    
    closeAll: function() {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
      });
    }
  },
  
  // Notification utilities
  notify: function(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
    
    // Also send browser notification when app is in background
    if (chrome.runtime) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '../icons/icon128.png',
        title: type === 'success' ? 'Success' : 'Error',
        message: message,
        priority: 1
      });
    }
  },
  
  // Date formatting
  formatDate: function(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },
  
  // ID generation
  generateId: function() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },
  
  // DOM utilities
  createElement: function(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.entries(value).forEach(([prop, val]) => {
          element.style[prop] = val;
        });
      } else if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.substring(2).toLowerCase(), value);
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Append children
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    });
    
    return element;
  },
  
  // Time formatting
  formatTime: function(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }
};

// Initialize utils when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  utils.modal.init();
});
