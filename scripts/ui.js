// ui.js - Handles all DOM updates and UI interactions

import state from './state.js';
import { compileRegex, highlightMatches, validateTransaction } from './validators.js';
import { exportToJSON, exportToCSV, importFromJSON } from './storage.js';

class UIManager {
    constructor() {
        this.elements = {};
        this.initElements();
        this.initEventListeners();
        this.initStateSubscription();
    }

    // Cache DOM elements
    initElements() {
        this.elements = {
            // Navigation
            navMenu: document.querySelector('.nav-menu'),
            mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
            navLinks: document.querySelectorAll('.nav-menu a'),
            sections: document.querySelectorAll('main section'),
            
            // Forms
            transactionForm: document.getElementById('transaction-form'),
            description: document.getElementById('description'),
            amount: document.getElementById('amount'),
            category: document.getElementById('category'),
            date: document.getElementById('date'),
            saveBtn: document.getElementById('save-btn'),
            cancelEdit: document.getElementById('cancel-edit'),
            
            // Search
            searchInput: document.getElementById('search-input'),
            searchBtn: document.getElementById('search-btn'),
            clearSearch: document.getElementById('clear-search'),
            caseSensitive: document.getElementById('case-sensitive'),
            searchError: document.getElementById('search-error'),
            
            // Sort
            sortSelect: document.getElementById('sort-by'),
            
            // Table
            transactionsBody: document.getElementById('transactions-body'),
            
            // Stats
            totalTransactions: document.getElementById('total-transactions'),
            totalAmount: document.getElementById('total-amount'),
            topCategory: document.getElementById('top-category'),
            budgetStatus: document.getElementById('budget-status'),
            budgetProgress: document.getElementById('budget-progress'),
            budgetMessage: document.getElementById('budget-message'),
            trendChart: document.getElementById('trend-chart'),
            
            // Settings
            baseCurrency: document.getElementById('base-currency'),
            rate1: document.getElementById('rate-1'),
            rate2: document.getElementById('rate-2'),
            monthlyBudget: document.getElementById('monthly-budget'),
            exportJson: document.getElementById('export-json'),
            exportCsv: document.getElementById('export-csv'),
            importFile: document.getElementById('import-file'),
            seedData: document.getElementById('seed-data'),
            
            // Templates
            rowTemplate: document.getElementById('transaction-row-template')
        };
    }

    // Initialize event listeners
    initEventListeners() {
        // Mobile menu
        this.elements.mobileMenuBtn?.addEventListener('click', () => this.toggleMobileMenu());
        
        // Navigation
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Form submission
        this.elements.transactionForm?.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.elements.cancelEdit?.addEventListener('click', () => this.cancelEdit());

        // Real-time validation
        this.elements.description?.addEventListener('input', () => this.validateField('description'));
        this.elements.amount?.addEventListener('input', () => this.validateField('amount'));
        this.elements.category?.addEventListener('input', () => this.validateField('category'));
        this.elements.date?.addEventListener('input', () => this.validateField('date'));

        // Search
        this.elements.searchBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSearch();
        });
        this.elements.clearSearch?.addEventListener('click', () => this.clearSearch());
        this.elements.searchInput?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // Sort
        this.elements.sortSelect?.addEventListener('change', (e) => {
            state.setSort(e.target.value);
        });

        // Settings
        this.elements.baseCurrency?.addEventListener('change', () => this.saveSettings());
        this.elements.rate1?.addEventListener('input', () => this.saveSettings());
        this.elements.rate2?.addEventListener('input', () => this.saveSettings());
        this.elements.monthlyBudget?.addEventListener('input', () => this.saveSettings());
        
        this.elements.exportJson?.addEventListener('click', () => this.handleExport());
        this.elements.exportCsv?.addEventListener('click', () => this.handleExportCSV());
        this.elements.importFile?.addEventListener('change', (e) => this.handleImport(e));
        this.elements.seedData?.addEventListener('click', () => this.loadSeedData());

        // Handle hash change for navigation
        window.addEventListener('hashchange', () => this.handleHashChange());
        window.addEventListener('load', () => this.handleHashChange());
    }

    // Subscribe to state changes
    initStateSubscription() {
        state.subscribe(() => {
            this.render();
            this.updateStats();
            this.updateBudgetMessage();
            this.renderTrendChart();
        });
    }

    // Toggle mobile menu
    toggleMobileMenu() {
        const isExpanded = this.elements.mobileMenuBtn?.getAttribute('aria-expanded') === 'true';
        this.elements.mobileMenuBtn?.setAttribute('aria-expanded', !isExpanded);
        this.elements.navMenu?.classList.toggle('active');
    }

    // Handle navigation
    handleNavigation(e) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href');
        
        // Update active state
        this.elements.navLinks.forEach(link => link.classList.remove('active'));
        e.target.classList.add('active');
        
        // Hide mobile menu
        this.elements.mobileMenuBtn?.setAttribute('aria-expanded', 'false');
        this.elements.navMenu?.classList.remove('active');
        
        // Scroll to section
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Handle hash change for direct navigation
    handleHashChange() {
        const hash = window.location.hash || '#dashboard';
        this.elements.navLinks.forEach(link => {
            const isActive = link.getAttribute('href') === hash;
            link.classList.toggle('active', isActive);
        });
    }

    // Handle form submit
    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            description: this.elements.description.value,
            amount: this.elements.amount.value,
            category: this.elements.category.value,
            date: this.elements.date.value
        };

        try {
            if (state.editingId) {
                state.updateTransaction(state.editingId, formData);
                this.showMessage('Transaction updated successfully', 'success');
            } else {
                state.addTransaction(formData);
                this.showMessage('Transaction added successfully', 'success');
            }
            
            this.resetForm();
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    // Validate individual field
    validateField(fieldName) {
        const input = this.elements[fieldName];
        const errorDiv = document.getElementById(`${fieldName}-error`);
        
        if (!input || !errorDiv) return;

        const value = input.value;
        let validation;

        switch (fieldName) {
            case 'description':
                validation = validateDescription(value);
                break;
            case 'amount':
                validation = validateAmount(value);
                break;
            case 'category':
                validation = validateCategory(value);
                break;
            case 'date':
                validation = validateDate(value);
                break;
            default:
                return;
        }

        if (!validation.valid) {
            errorDiv.textContent = validation.message;
            input.setAttribute('aria-invalid', 'true');
        } else {
            errorDiv.textContent = '';
            input.setAttribute('aria-invalid', 'false');
            
            if (validation.warning) {
                this.showMessage(validation.warning, 'warning');
            }
        }
    }

    // Handle search
    handleSearch() {
        const pattern = this.elements.searchInput.value;
        const caseSensitive = this.elements.caseSensitive.checked;
        
        const regex = compileRegex(pattern, caseSensitive ? 'g' : 'gi');
        
        if (regex && regex.error) {
            this.elements.searchError.textContent = `Invalid regex: ${regex.error}`;
            return;
        }
        
        this.elements.searchError.textContent = '';
        state.setSearch(pattern, caseSensitive);
    }

    // Clear search
    clearSearch() {
        this.elements.searchInput.value = '';
        this.elements.caseSensitive.checked = false;
        this.elements.searchError.textContent = '';
        state.setSearch('', false);
    }

    // Cancel editing
    cancelEdit() {
        state.clearEditing();
        this.resetForm();
    }

    // Reset form
    resetForm() {
        this.elements.transactionForm.reset();
        this.elements.saveBtn.textContent = 'Save Transaction';
        state.clearEditing();
        
        // Clear validation errors
        ['description', 'amount', 'category', 'date'].forEach(field => {
            const errorDiv = document.getElementById(`${field}-error`);
            if (errorDiv) errorDiv.textContent = '';
        });
    }

    // Populate form for editing
    populateFormForEdit(id) {
        const transaction = state.getTransaction(id);
        if (!transaction) return;

        this.elements.description.value = transaction.description;
        this.elements.amount.value = transaction.amount;
        this.elements.category.value = transaction.category;
        this.elements.date.value = transaction.date;
        
        this.elements.saveBtn.textContent = 'Update Transaction';
        
        // Scroll to form
        document.getElementById('add').scrollIntoView({ behavior: 'smooth' });
    }

    // Render transactions table
    render() {
        const transactions = state.filteredTransactions;
        const tbody = this.elements.transactionsBody;
        
        if (!tbody) return;

        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No transactions found</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        
        transactions.forEach(transaction => {
            const row = this.createTransactionRow(transaction);
            tbody.appendChild(row);
        });
    }

    // Create transaction row
    createTransactionRow(transaction) {
        const template = this.elements.rowTemplate.content.cloneNode(true);
        const row = template.querySelector('.transaction-row');
        
        const cells = row.querySelectorAll('td');
        const descriptionCell = cells[0];
        const amountCell = cells[1];
        const categoryCell = cells[2];
        const dateCell = cells[3];
        const actionsCell = cells[4];
        
        // Apply search highlighting if needed
        if (state.currentSearch.regex && !state.currentSearch.regex.error) {
            descriptionCell.innerHTML = highlightMatches(transaction.description, state.currentSearch.regex);
            amountCell.innerHTML = highlightMatches(`$${transaction.amount.toFixed(2)}`, state.currentSearch.regex);
            categoryCell.innerHTML = highlightMatches(transaction.category, state.currentSearch.regex);
            dateCell.innerHTML = highlightMatches(transaction.date, state.currentSearch.regex);
        } else {
            descriptionCell.textContent = transaction.description;
            amountCell.textContent = `$${transaction.amount.toFixed(2)}`;
            categoryCell.textContent = transaction.category;
            dateCell.textContent = transaction.date;
        }
        
        // Add edit button
        const editBtn = actionsCell.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => {
            state.setEditing(transaction.id);
            this.populateFormForEdit(transaction.id);
        });
        
        // Add delete button
        const deleteBtn = actionsCell.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            if (state.deleteTransaction(transaction.id)) {
                this.showMessage('Transaction deleted', 'info');
            }
        });
        
        // Add animation class if new
        if (Date.now() - new Date(transaction.createdAt).getTime() < 5000) {
            row.classList.add('new');
            setTimeout(() => row.classList.remove('new'), 1000);
        }
        
        return row;
    }

    // Update stats display
    updateStats() {
        const stats = state.getStats();
        
        this.elements.totalTransactions.textContent = stats.total;
        this.elements.totalAmount.textContent = this.formatCurrency(stats.totalAmount);
        this.elements.topCategory.textContent = stats.topCategory;
        
        const budgetStatus = `${this.formatCurrency(stats.budget.used)} / ${this.formatCurrency(stats.budget.total)}`;
        this.elements.budgetStatus.textContent = budgetStatus;
        
        const percentage = stats.budget.percentage;
        this.elements.budgetProgress.style.width = `${percentage}%`;
        this.elements.budgetProgress.setAttribute('aria-valuenow', percentage);
    }

    // Update budget message
    updateBudgetMessage() {
        const stats = state.getStats();
        const message = this.elements.budgetMessage;
        
        if (stats.budget.isOverBudget) {
            message.textContent = `⚠️ Alert: You've exceeded your budget by ${this.formatCurrency(stats.budget.overspent)}`;
            message.setAttribute('aria-live', 'assertive');
            message.classList.add('warning');
        } else {
            message.textContent = `You have ${this.formatCurrency(stats.budget.remaining)} remaining in your budget`;
            message.setAttribute('aria-live', 'polite');
            message.classList.remove('warning');
        }
    }

    // Render trend chart
    renderTrendChart() {
        const stats = state.getStats();
        const chart = this.elements.trendChart;
        
        if (!chart) return;
        
        chart.innerHTML = '';
        
        const maxAmount = Math.max(...stats.last7Days.map(d => d.amount), 1);
        
        stats.last7Days.forEach(day => {
            const height = (day.amount / maxAmount) * 100;
            
            const container = document.createElement('div');
            container.className = 'chart-bar-container';
            container.setAttribute('aria-label', `${day.day}: $${day.amount.toFixed(2)}`);
            
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.height = `${height}%`;
            
            const label = document.createElement('span');
            label.className = 'chart-label';
            label.textContent = day.day;
            
            container.appendChild(bar);
            container.appendChild(label);
            chart.appendChild(container);
        });
    }

    // Save settings
    saveSettings() {
        const settings = {
            baseCurrency: this.elements.baseCurrency.value,
            conversionRates: {
                EUR: parseFloat(this.elements.rate1.value) || 0.85,
                GBP: parseFloat(this.elements.rate2.value) || 0.75
            },
            monthlyBudget: parseFloat(this.elements.monthlyBudget.value) || 500
        };
        
        state.updateSettings(settings);
        this.showMessage('Settings saved', 'success');
    }

    // Load settings into form
    loadSettings() {
        const settings = state.settings;
        
        this.elements.baseCurrency.value = settings.baseCurrency;
        this.elements.rate1.value = settings.conversionRates.EUR;
        this.elements.rate2.value = settings.conversionRates.GBP;
        this.elements.monthlyBudget.value = settings.monthlyBudget;
    }

    // Handle export
    handleExport() {
        exportToJSON(state.transactions, state.settings);
    }

    // Handle CSV export
    handleExportCSV() {
        exportToCSV(state.transactions);
    }

    // Handle import
    async handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const result = await importFromJSON(file, (transaction) => {
                // Validate transaction structure
                return transaction.id && 
                       transaction.description && 
                       typeof transaction.amount === 'number' &&
                       transaction.category &&
                       transaction.date;
            });

            if (result.transactions.length > 0) {
                state.importTransactions(result.transactions);
                this.showMessage(`Imported ${result.transactions.length} transactions successfully`, 'success');
                
                if (result.invalidCount > 0) {
                    this.showMessage(`${result.invalidCount} invalid transactions were skipped`, 'warning');
                }
            } else {
                this.showMessage('No valid transactions found in file', 'error');
            }
        } catch (error) {
            this.showMessage(`Import failed: ${error.message}`, 'error');
        }

        // Reset file input
        e.target.value = '';
    }

    // Load seed data
    loadSeedData() {
        const seedTransactions = [
            {
                id: 'txn_1',
                description: 'Lunch at cafeteria',
                amount: 12.50,
                category: 'Food',
                date: '2025-09-25',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'txn_2',
                description: 'Chemistry textbook',
                amount: 89.99,
                category: 'Books',
                date: '2025-09-23',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'txn_3',
                description: 'Bus pass',
                amount: 45.00,
                category: 'Transport',
                date: '2025-09-20',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'txn_4',
                description: 'Coffee coffee with friends',
                amount: 8.75,
                category: 'Entertainment',
                date: '2025-09-28',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'txn_5',
                description: 'Tuition fee payment',
                amount: 500.00,
                category: 'Fees',
                date: '2025-09-01',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'txn_6',
                description: 'Gym membership',
                amount: 30.00,
                category: 'Fees',
                date: '2025-09-15',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'txn_7',
                description: 'Late night pizza',
                amount: 15.50,
                category: 'Food',
                date: '2025-09-27',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'txn_8',
                description: 'Spotify premium',
                amount: 9.99,
                category: 'Entertainment',
                date: '2025-09-18',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'txn_9',
                description: 'Notebooks and pens',
                amount: 12.75,
                category: 'Books',
                date: '2025-09-22',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'txn_10',
                description: 'Uber to campus',
                amount: 18.25,
                category: 'Transport',
                date: '2025-09-26',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];

        state.importTransactions(seedTransactions);
        this.showMessage('Seed data loaded successfully', 'success');
    }

    // Show message to user
    showMessage(text, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = text;
        messageDiv.setAttribute('role', type === 'error' ? 'alert' : 'status');
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // Format currency
    formatCurrency(amount) {
        const currencySymbols = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            KES: 'KSh'
        };
        
        const symbol = currencySymbols[state.settings.baseCurrency] || '$';
        return `${symbol}${amount.toFixed(2)}`;
    }
}

// Initialize UI manager
const ui = new UIManager();
export default ui;