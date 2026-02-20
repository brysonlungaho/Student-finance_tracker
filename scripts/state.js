// state.js - Manages application state

import { loadTransactions, saveTransactions, loadSettings, saveSettings, generateId, getTimestamp } from './storage.js';
import { validateTransaction } from './validators.js';

class AppState {
    constructor() {
        this.transactions = [];
        this.settings = {};
        this.filteredTransactions = [];
        this.currentSearch = {
            pattern: '',
            regex: null,
            caseSensitive: false
        };
        this.currentSort = 'date-desc';
        this.editingId = null;
        this.listeners = [];
    }

    // Initialize state
    async init() {
        this.transactions = loadTransactions();
        this.settings = loadSettings();
        this.filteredTransactions = [...this.transactions];
        this.notify();
    }

    // Subscribe to state changes
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // Notify all listeners of state change
    notify() {
        this.listeners.forEach(listener => listener(this));
    }

    // Add new transaction
    addTransaction(formData) {
        const validation = validateTransaction(formData);
        
        if (!validation.isValid) {
            throw new Error('Invalid transaction data');
        }

        const now = getTimestamp();
        const transaction = {
            id: generateId(),
            description: validation.cleaned.description,
            amount: validation.cleaned.amount,
            category: validation.cleaned.category,
            date: validation.cleaned.date,
            createdAt: now,
            updatedAt: now
        };

        this.transactions = [transaction, ...this.transactions];
        this.applySearchAndSort();
        saveTransactions(this.transactions);
        this.notify();
        
        return transaction;
    }

    // Update existing transaction
    updateTransaction(id, formData) {
        const validation = validateTransaction(formData);
        
        if (!validation.isValid) {
            throw new Error('Invalid transaction data');
        }

        const index = this.transactions.findIndex(t => t.id === id);
        if (index === -1) {
            throw new Error('Transaction not found');
        }

        const updatedTransaction = {
            ...this.transactions[index],
            description: validation.cleaned.description,
            amount: validation.cleaned.amount,
            category: validation.cleaned.category,
            date: validation.cleaned.date,
            updatedAt: getTimestamp()
        };

        this.transactions[index] = updatedTransaction;
        this.applySearchAndSort();
        saveTransactions(this.transactions);
        this.notify();
        
        return updatedTransaction;
    }

    // Delete transaction
    deleteTransaction(id) {
        if (!confirm('Are you sure you want to delete this transaction?')) {
            return false;
        }

        this.transactions = this.transactions.filter(t => t.id !== id);
        this.applySearchAndSort();
        saveTransactions(this.transactions);
        this.notify();
        
        return true;
    }

    // Set search pattern
    setSearch(pattern, caseSensitive = false) {
        this.currentSearch.pattern = pattern;
        this.currentSearch.caseSensitive = caseSensitive;
        
        try {
            const flags = caseSensitive ? 'g' : 'gi';
            this.currentSearch.regex = pattern ? new RegExp(pattern, flags) : null;
        } catch (error) {
            this.currentSearch.regex = { error: error.message };
        }
        
        this.applySearchAndSort();
    }

    // Apply search filter
    applySearch() {
        const { regex } = this.currentSearch;
        
        if (!regex || regex.error) {
            this.filteredTransactions = [...this.transactions];
            return;
        }

        this.filteredTransactions = this.transactions.filter(t => {
            const searchable = `${t.description} ${t.amount} ${t.category} ${t.date}`;
            return regex.test(searchable);
        });
    }

    // Set sort method
    setSort(sortBy) {
        this.currentSort = sortBy;
        this.applySearchAndSort();
    }

    // Apply current sort
    applySort() {
        const [field, direction] = this.currentSort.split('-');
        
        this.filteredTransactions.sort((a, b) => {
            let comparison = 0;
            
            switch (field) {
                case 'date':
                    comparison = new Date(a.date) - new Date(b.date);
                    break;
                case 'amount':
                    comparison = a.amount - b.amount;
                    break;
                case 'description':
                    comparison = a.description.localeCompare(b.description);
                    break;
                default:
                    return 0;
            }
            
            return direction === 'asc' ? comparison : -comparison;
        });
    }

    // Apply both search and sort
    applySearchAndSort() {
        this.applySearch();
        this.applySort();
    }

    // Update settings
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        saveSettings(this.settings);
        this.notify();
    }

    // Get stats for dashboard
    getStats() {
        const total = this.transactions.length;
        const totalAmount = this.transactions.reduce((sum, t) => sum + t.amount, 0);
        
        // Get top category
        const categoryCount = {};
        this.transactions.forEach(t => {
            categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
        });
        
        let topCategory = '-';
        let maxCount = 0;
        
        for (const [category, count] of Object.entries(categoryCount)) {
            if (count > maxCount) {
                maxCount = count;
                topCategory = category;
            }
        }
        
        // Get last 7 days trend
        const last7Days = this.getLast7DaysTrend();
        
        // Budget status
        const budgetUsed = totalAmount;
        const budgetTotal = this.settings.monthlyBudget || 500;
        const budgetPercentage = Math.min((budgetUsed / budgetTotal) * 100, 100);
        const isOverBudget = budgetUsed > budgetTotal;
        
        return {
            total,
            totalAmount,
            topCategory,
            last7Days,
            budget: {
                used: budgetUsed,
                total: budgetTotal,
                percentage: budgetPercentage,
                isOverBudget,
                remaining: Math.max(budgetTotal - budgetUsed, 0),
                overspent: Math.max(budgetUsed - budgetTotal, 0)
            }
        };
    }

    // Get trend data for last 7 days
    getLast7DaysTrend() {
        const today = new Date();
        const trend = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayTotal = this.transactions
                .filter(t => t.date === dateStr)
                .reduce((sum, t) => sum + t.amount, 0);
            
            trend.push({
                date: dateStr,
                amount: dayTotal,
                day: date.toLocaleDateString('en-US', { weekday: 'short' })
            });
        }
        
        return trend;
    }

    // Set editing transaction
    setEditing(id) {
        this.editingId = id;
        this.notify();
    }

    // Clear editing
    clearEditing() {
        this.editingId = null;
        this.notify();
    }

    // Get transaction by ID
    getTransaction(id) {
        return this.transactions.find(t => t.id === id);
    }

    // Import transactions
    importTransactions(newTransactions) {
        this.transactions = [...newTransactions, ...this.transactions];
        this.applySearchAndSort();
        saveTransactions(this.transactions);
        this.notify();
    }

    // Clear all transactions
    clearAll() {
        if (confirm('Are you sure you want to delete all transactions?')) {
            this.transactions = [];
            this.filteredTransactions = [];
            saveTransactions(this.transactions);
            this.notify();
        }
    }
}

// Create singleton instance
const state = new AppState();
export default state;