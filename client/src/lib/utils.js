"use strict";
/**
 * Utility functions for the client application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.formatDate = formatDate;
exports.debounce = debounce;
exports.generateId = generateId;
exports.truncateText = truncateText;
exports.hexToRgb = hexToRgb;
exports.rgbToHex = rgbToHex;
exports.deepClone = deepClone;
exports.isEmptyObject = isEmptyObject;
exports.formatBytes = formatBytes;
// Combine class names with proper handling of conditional classes
function cn() {
  var classes = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    classes[_i] = arguments[_i];
  }
  return classes.filter(Boolean).join(" ");
}
// Format date to a readable string
function formatDate(date) {
  if (!date) return "";
  var d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
// Debounce function to limit how often a function can be called
function debounce(func, wait) {
  var timeout = null;
  return function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var later = function () {
      timeout = null;
      func.apply(void 0, args);
    };
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
// Generate a random ID
function generateId(length) {
  if (length === void 0) {
    length = 8;
  }
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}
// Truncate text with ellipsis
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return "".concat(text.substring(0, maxLength), "...");
}
// Convert hex color to RGB
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
// Convert RGB to hex color
function rgbToHex(r, g, b) {
  return "#".concat(
    ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1),
  );
}
// Deep clone an object
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
// Check if an object is empty
function isEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}
// Format bytes to human-readable string
function formatBytes(bytes, decimals) {
  if (decimals === void 0) {
    decimals = 2;
  }
  if (bytes === 0) return "0 Bytes";
  var k = 1024;
  var dm = decimals < 0 ? 0 : decimals;
  var sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
