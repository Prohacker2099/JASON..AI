/**
 * Safely sets an event listener on an element, checking if it exists first
 * @param {string} selector - CSS selector for the element
 * @param {string} eventType - Event type (e.g., 'click', 'submit')
 * @param {Function} callback - Event handler function
 * @param {boolean} useCapture - Whether to use event capturing
 * @returns {Function|null} - Function to remove the event listener or null if element not found
 */
export const safeAddEventListener = (
  selector,
  eventType,
  callback,
  useCapture = false,
) => {
  const element = document.querySelector(selector);
  if (!element) {
    console.warn(`Element not found: ${selector}`);
    return null;
  }

  element.addEventListener(eventType, callback, useCapture);
  return () => element.removeEventListener(eventType, callback, useCapture);
};

/**
 * Safely sets text content on an element, checking if it exists first
 * @param {string} selector - CSS selector for the element
 * @param {string} text - Text to set
 * @returns {boolean} - Whether the operation was successful
 */
export const safeSetTextContent = (selector, text) => {
  const element = document.querySelector(selector);
  if (!element) {
    console.warn(`Element not found: ${selector}`);
    return false;
  }

  element.textContent = text;
  return true;
};

/**
 * Safely gets an element by selector
 * @param {string} selector - CSS selector for the element
 * @returns {Element|null} - The element or null if not found
 */
export const safeGetElement = (selector) => {
  const element = document.querySelector(selector);
  if (!element) {
    console.warn(`Element not found: ${selector}`);
    return null;
  }

  return element;
};

/**
 * Safely executes a callback when the DOM is fully loaded
 * @param {Function} callback - Function to execute when DOM is ready
 */
export const onDOMReady = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
};
