# Student Finance Tracker

A responsive, accessible web application for tracking student expenses with regex-powered search and validation.

## Live Demo

[View Live Demo](https://brysonmasivo.github.io/student-finance-tracker)

## Features

### Core Functionality
- Transaction Management: Add, edit, delete transactions with real-time updates
- Categories: Food, Books, Transport, Entertainment, Fees, Other (editable in Settings)
- Real-time Validation: 4+ regex validation rules with inline error messages
- Advanced Search: Regex-powered search with result highlighting
- Sorting: Sort by date (newest/oldest), amount (high/low), description (A-Z/Z-A)
- Statistics Dashboard: Total transactions, total spent, top category, last 7 days trend
- Budget Tracking: Monthly budget with visual progress bar and ARIA live announcements
- Data Persistence: Automatic localStorage backup with JSON import/export
- Multiple Currencies: USD, EUR, GBP, KES with manual conversion rates in Settings

### Accessibility
- Semantic HTML5 landmarks (header, nav, main, section, footer)
- Full keyboard navigation with visible focus indicators
- ARIA live regions for dynamic updates and errors
- High contrast color scheme (WCAG AA compliant, minimum 4.5:1 ratio)
- Screen reader optimized with proper labels and descriptions
- Skip navigation link at top of page
- Proper heading hierarchy (h1-h6)

### Responsive Design
- Mobile-first approach
- Breakpoints: 360px (mobile), 768px (tablet), 1024px (desktop)
- Flexible grid layouts using CSS Grid and Flexbox
- Touch-friendly controls with adequate spacing (minimum 44x44px)
- Optimized tables with horizontal scroll on mobile devices

## Theme

Red, Black, and White color scheme:

```css
:root {
    --primary-red: #dc2626;
    --primary-red-dark: #b91c1c;
    --primary-red-light: #ef4444;
    --black: #000000;
    --black-light: #1a1a1a;
    --white: #ffffff;
    --gray-light: #f3f4f6;
    --gray-medium: #9ca3af;
    --gray-dark: #4b5563;
}