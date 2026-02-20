// validators.js - Handles all regex validation

// Safe regex compiler
export function compileRegex(pattern, flags = 'i') {
    try {
        return pattern ? new RegExp(pattern, flags) : null;
    } catch (error) {
        return { error: error.message };
    }
}

// Validation Rule 1: Description - no leading/trailing spaces, no double spaces
export function validateDescription(description) {
    const pattern = /^\S(?:.*\S)?$/;
    const hasDoubleSpaces = /\s{2,}/.test(description);
    
    if (!pattern.test(description)) {
        return {
            valid: false,
            message: 'Description cannot start or end with spaces'
        };
    }
    
    if (hasDoubleSpaces) {
        return {
            valid: false,
            message: 'Description cannot contain double spaces'
        };
    }
    
    return {
        valid: true,
        message: '',
        cleaned: description.replace(/\s+/g, ' ') // Collapse multiple spaces
    };
}

// Validation Rule 2: Amount - valid number with up to 2 decimals
export function validateAmount(amount) {
    const pattern = /^(0|[1-9]\d*)(\.\d{1,2})?$/;
    const numValue = parseFloat(amount);
    
    if (!pattern.test(amount)) {
        return {
            valid: false,
            message: 'Amount must be a positive number with up to 2 decimals (e.g., 10, 10.50)'
        };
    }
    
    if (numValue > 1000000) {
        return {
            valid: false,
            message: 'Amount cannot exceed 1,000,000'
        };
    }
    
    return {
        valid: true,
        message: '',
        value: numValue
    };
}

// Validation Rule 3: Date - valid YYYY-MM-DD format
export function validateDate(date) {
    const pattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    
    if (!pattern.test(date)) {
        return {
            valid: false,
            message: 'Date must be in YYYY-MM-DD format'
        };
    }
    
    // Check if it's a real date (e.g., not 2025-02-30)
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    if (dateObj.getFullYear() !== year || 
        dateObj.getMonth() !== month - 1 || 
        dateObj.getDate() !== day) {
        return {
            valid: false,
            message: 'Invalid date'
        };
    }
    
    // Optional: Warn about future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateObj > today) {
        return {
            valid: true,
            warning: 'Future date detected',
            message: ''
        };
    }
    
    return {
        valid: true,
        message: ''
    };
}

// Validation Rule 4: Category - letters, spaces, hyphens only
export function validateCategory(category) {
    const pattern = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;
    
    if (!pattern.test(category)) {
        return {
            valid: false,
            message: 'Category must contain only letters, spaces, and hyphens'
        };
    }
    
    if (category.length < 2) {
        return {
            valid: false,
            message: 'Category must be at least 2 characters long'
        };
    }
    
    return {
        valid: true,
        message: '',
        cleaned: category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
    };
}

// Advanced Regex 1: Check for duplicate words (back-reference)
export function hasDuplicateWords(text) {
    const pattern = /\b(\w+)\s+\1\b/i;
    return pattern.test(text);
}

// Advanced Regex 2: Check for amounts with cents
export function hasCents(amount) {
    const pattern = /\.\d{2}\b/;
    return pattern.test(amount.toString());
}

// Advanced Regex 3: Check for beverage-related keywords (lookahead example)
export function isBeverageTransaction(description) {
    const pattern = /(?=.*\b(coffee|tea|soda|juice|water)\b)/i;
    return pattern.test(description);
}

// Advanced Regex 4: Check for time format (HH:MM)
export function containsTimeFormat(text) {
    const pattern = /\b([01]?\d|2[0-3]):[0-5]\d\b/;
    return pattern.test(text);
}

// Validate entire transaction form
export function validateTransaction(formData) {
    const errors = {};
    const warnings = {};
    
    // Validate description
    const descValidation = validateDescription(formData.description);
    if (!descValidation.valid) {
        errors.description = descValidation.message;
    }
    
    // Validate amount
    const amountValidation = validateAmount(formData.amount);
    if (!amountValidation.valid) {
        errors.amount = amountValidation.message;
    }
    
    // Validate date
    const dateValidation = validateDate(formData.date);
    if (!dateValidation.valid) {
        errors.date = dateValidation.message;
    } else if (dateValidation.warning) {
        warnings.date = dateValidation.warning;
    }
    
    // Validate category
    const catValidation = validateCategory(formData.category);
    if (!catValidation.valid) {
        errors.category = catValidation.message;
    }
    
    // Advanced regex checks for information
    if (formData.description) {
        if (hasDuplicateWords(formData.description)) {
            warnings.description = 'Duplicate words detected';
        }
        
        if (isBeverageTransaction(formData.description)) {
            warnings.description = 'Beverage purchase detected';
        }
    }
    
    if (formData.amount && hasCents(formData.amount)) {
        warnings.amount = 'Amount includes cents';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings,
        cleaned: {
            description: descValidation.cleaned || formData.description,
            amount: amountValidation.value || parseFloat(formData.amount),
            date: formData.date,
            category: catValidation.cleaned || formData.category
        }
    };
}

// Search with regex highlighting
export function highlightMatches(text, regex) {
    if (!regex || !text) return text;
    
    try {
        return text.replace(regex, match => `<mark>${match}</mark>`);
    } catch (error) {
        console.error('Error highlighting matches:', error);
        return text;
    }
}

// Test patterns (for tests.html)
export const testPatterns = {
    description: [
        { input: 'Coffee', expected: true },
        { input: ' Coffee', expected: false },
        { input: 'Coffee ', expected: false },
        { input: 'Coffee  shop', expected: false },
        { input: 'Coffee shop', expected: true }
    ],
    amount: [
        { input: '0', expected: true },
        { input: '10', expected: true },
        { input: '10.50', expected: true },
        { input: '10.5', expected: false },
        { input: '10.500', expected: false },
        { input: '-10', expected: false }
    ],
    category: [
        { input: 'Food', expected: true },
        { input: 'Fast Food', expected: true },
        { input: 'High-Tech', expected: true },
        { input: 'Food123', expected: false },
        { input: 'Food!', expected: false }
    ],
    date: [
        { input: '2025-09-29', expected: true },
        { input: '2025-13-01', expected: false },
        { input: '2025-09-32', expected: false },
        { input: '2025-9-1', expected: false }
    ],
    advanced: {
        duplicateWords: [
            { input: 'coffee coffee', expected: true },
            { input: 'coffee shop coffee', expected: false },
            { input: 'the the', expected: true }
        ],
        hasCents: [
            { input: '10.50', expected: true },
            { input: '10', expected: false },
            { input: '10.5', expected: false }
        ]
    }
};