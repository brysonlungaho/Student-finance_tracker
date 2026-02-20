// utils.js - Utility functions

// Debounce function for performance
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for performance
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Format date for display
export function formatDate(dateString, format = 'short') {
    const date = new Date(dateString);
    
    if (format === 'short') {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Calculate percentage
export function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return (value / total) * 100;
}

// Group transactions by category
export function groupByCategory(transactions) {
    return transactions.reduce((groups, transaction) => {
        const category = transaction.category;
        if (!groups[category]) {
            groups[category] = {
                total: 0,
                count: 0,
                transactions: []
            };
        }
        
        groups[category].total += transaction.amount;
        groups[category].count++;
        groups[category].transactions.push(transaction);
        
        return groups;
    }, {});
}

// Group transactions by month
export function groupByMonth(transactions) {
    return transactions.reduce((groups, transaction) => {
        const month = transaction.date.substring(0, 7); // YYYY-MM
        
        if (!groups[month]) {
            groups[month] = {
                total: 0,
                count: 0,
                transactions: []
            };
        }
        
        groups[month].total += transaction.amount;
        groups[month].count++;
        groups[month].transactions.push(transaction);
        
        return groups;
    }, {});
}

// Calculate moving average
export function movingAverage(transactions, days = 7) {
    const sorted = [...transactions].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );
    
    const averages = [];
    
    for (let i = 0; i < sorted.length; i++) {
        const start = Math.max(0, i - days + 1);
        const slice = sorted.slice(start, i + 1);
        const avg = slice.reduce((sum, t) => sum + t.amount, 0) / slice.length;
        
        averages.push({
            date: sorted[i].date,
            average: avg
        });
    }
    
    return averages;
}

// Validate JSON structure
export function validateJSON(json, schema) {
    try {
        const data = typeof json === 'string' ? JSON.parse(json) : json;
        
        for (const [key, type] of Object.entries(schema)) {
            if (!(key in data)) {
                return {
                    valid: false,
                    error: `Missing required field: ${key}`
                };
            }
            
            if (type === 'array' && !Array.isArray(data[key])) {
                return {
                    valid: false,
                    error: `${key} must be an array`
                };
            }
            
            if (typeof data[key] !== type && type !== 'array') {
                return {
                    valid: false,
                    error: `${key} must be of type ${type}`
                };
            }
        }
        
        return { valid: true, data };
    } catch (error) {
        return {
            valid: false,
            error: 'Invalid JSON format'
        };
    }
}

// Deep clone object
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Compare two objects for equality
export function isEqual(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}

// Generate color from string (for categories)
export function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
}

// Check if element is in viewport
export function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Smooth scroll to element
export function smoothScrollTo(element, offset = 0) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

// Copy to clipboard
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy text: ', err);
        return false;
    }
}

// Download data as file
export function downloadAsFile(data, filename, type = 'application/json') {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Parse CSV string
export function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header.trim()] = values[index]?.trim();
            return obj;
        }, {});
    });
}

// Convert array to CSV
export function toCSV(data, headers) {
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header] || '';
            return `"${value.toString().replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}