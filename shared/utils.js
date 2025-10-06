/**
 * Utility functions for sanitization and security
 *
 * SECURITY NOTE: This file provides utilities to prevent XSS (Cross-Site Scripting) attacks.
 * All user-controlled data MUST use textContent instead of innerHTML when possible.
 * Only use escapeHtml() for data attributes or when innerHTML is absolutely necessary.
 *
 * Related to: Issue #4 - XSS vulnerability fix
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 *
 * NOTE: This function is primarily used for data attributes (data-id, etc.).
 * For displaying user content, prefer using textContent over innerHTML.
 *
 * @param {string} unsafe - The unsafe string containing potential HTML/script
 * @returns {string} The escaped string safe for insertion into HTML
 */
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) {
        return '';
    }

    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Creates a Bootstrap icon element
 * @param {string} iconClass - Bootstrap icon class (e.g., 'bi-eye', 'bi-trash')
 * @returns {HTMLElement} The icon element
 */
function createIcon(iconClass) {
    const icon = document.createElement('i');
    icon.className = `bi ${iconClass}`;
    return icon;
}

/**
 * Creates a button with an icon and optional text
 * @param {Object} config - Button configuration
 * @param {string} config.className - Button CSS classes
 * @param {string} config.iconClass - Bootstrap icon class
 * @param {string} [config.text] - Optional button text
 * @param {string} [config.textClass] - Optional text wrapper class (default: 'd-none d-md-inline')
 * @param {Object} [config.attributes] - Optional attributes to set on the button
 * @returns {HTMLButtonElement} The button element
 */
function createButton(config) {
    const button = document.createElement('button');
    button.className = config.className;

    // Add icon
    button.appendChild(createIcon(config.iconClass));

    // Add text if provided
    if (config.text) {
        const textSpan = document.createElement('span');
        textSpan.className = config.textClass || 'd-none d-md-inline';
        textSpan.textContent = config.text;
        button.appendChild(textSpan);
    }

    // Set additional attributes
    if (config.attributes) {
        Object.keys(config.attributes).forEach(key => {
            button.setAttribute(key, config.attributes[key]);
        });
    }

    return button;
}

/**
 * Creates a table cell with safe text content
 * @param {string} text - The text content
 * @param {string} [className] - Optional CSS class
 * @returns {HTMLTableCellElement} The table cell element
 */
function createTextCell(text, className = '') {
    const cell = document.createElement('td');
    if (className) cell.className = className;
    cell.textContent = text || '';
    return cell;
}

/**
 * Creates a badge element
 * @param {string} text - Badge text
 * @param {string} variant - Bootstrap variant (e.g., 'success', 'warning', 'danger')
 * @param {string} [additionalClasses] - Additional CSS classes
 * @returns {HTMLSpanElement} The badge element
 */
function createBadge(text, variant, additionalClasses = '') {
    const badge = document.createElement('span');
    badge.className = `badge bg-${variant} ${additionalClasses}`.trim();
    badge.textContent = text;
    return badge;
}
