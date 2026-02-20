// app.js - Main application entry point

import state from './state.js';
import ui from './ui.js';
import searchManager from './search.js';
import * as validators from './validators.js';
import * as utils from './utils.js';

class App {
    constructor() {
        this.init();
    }

    async init() {
        console.log('Initializing Student Finance Tracker...');
        
        // Initialize state
        await state.init();
        
        // Load settings into UI
        ui.loadSettings();
        
        // Set up global error handler
        window.addEventListener('error', this.handleError.bind(this));
        
        // Set up unhandled promise rejection handler
        window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
        
        // Set up beforeunload handler for unsaved changes
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        
        // Register service worker for offline support (optional)
        this.registerServiceWorker();
        
        console.log('App initialized successfully');
    }

    handleError(event) {
        console.error('Global error:', event.error);
        ui.showMessage('An unexpected error occurred', 'error');
    }

    handlePromiseRejection(event) {
        console.error('Unhandled promise rejection:', event.reason);
        ui.showMessage('An asynchronous error occurred', 'error');
    }

    handleBeforeUnload(event) {
        // Check if there are unsaved changes
        if (this.hasUnsavedChanges()) {
            event.preventDefault();
            event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    }

    hasUnsavedChanges() {
        // Implement unsaved changes detection
        return false;
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(error => {
                console.log('Service worker registration failed:', error);
            });
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new App();
    });
} else {
    new App();
}

// Export for testing
export default App;