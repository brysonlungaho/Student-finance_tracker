// storage.js - Handles all data persistence operations

const STORAGE_KEY = 'finance_tracker:data';
const SETTINGS_KEY = 'finance_tracker:settings';

// Default settings
const DEFAULT_SETTINGS = {
    baseCurrency: 'USD',
    conversionRates: {
        EUR: 0.85,
        GBP: 0.75
    },
    monthlyBudget: 500,
    categories: ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other']
};

// Load transactions from localStorage
export function loadTransactions() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading transactions:', error);
        return [];
    }
}

// Save transactions to localStorage
export function saveTransactions(transactions) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        return true;
    } catch (error) {
        console.error('Error saving transactions:', error);
        return false;
    }
}

// Load settings from localStorage
export function loadSettings() {
    try {
        const data = localStorage.getItem(SETTINGS_KEY);
        return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (error) {
        console.error('Error loading settings:', error);
        return DEFAULT_SETTINGS;
    }
}

// Save settings to localStorage
export function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
}

// Export data to JSON file
export function exportToJSON(transactions, settings) {
    const data = {
        transactions,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Export data to CSV file
export function exportToCSV(transactions) {
    if (!transactions.length) {
        alert('No transactions to export');
        return;
    }
    
    // Define CSV headers
    const headers = ['ID', 'Description', 'Amount', 'Category', 'Date', 'Created At', 'Updated At'];
    
    // Convert transactions to CSV rows
    const rows = transactions.map(t => [
        t.id,
        t.description,
        t.amount,
        t.category,
        t.date,
        t.createdAt,
        t.updatedAt
    ]);
    
    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-tracker-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// Import data from JSON file
export function importFromJSON(file, validateCallback) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate data structure
                if (!data.transactions || !Array.isArray(data.transactions)) {
                    throw new Error('Invalid data format: missing transactions array');
                }
                
                // Validate each transaction
                const validTransactions = data.transactions.filter(t => validateCallback(t));
                
                resolve({
                    transactions: validTransactions,
                    settings: data.settings || null,
                    invalidCount: data.transactions.length - validTransactions.length
                });
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsText(file);
    });
}

// Clear all data
export function clearAllData() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SETTINGS_KEY);
}

// Generate unique ID
export function generateId() {
    return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get current timestamp