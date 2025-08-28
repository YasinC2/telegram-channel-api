/**
 * Utility functions for Telegram Channel API
 */

import { MAX_MESSAGES } from './constants.js';

/**
 * Validate that an index is within 1-20 range
 * @param {number} index - The message index to validate
 * @throws {Error} If index is out of range
 */
export function validateIndex(index) {
  if (index < 1 || index > MAX_MESSAGES) {
    throw new Error(`Message index must be between 1 and ${MAX_MESSAGES}`);
  }
}

/**
 * Validate a range string and return start/end indices
 * @param {string} range - The range string (e.g., "1-5")
 * @returns {[number, number]} Start and end indices
 * @throws {Error} If range is invalid
 */
export function validateRange(range) {
  const [startStr, endStr] = range.split('-').map(Number);
  if (!startStr || !endStr || isNaN(startStr) || isNaN(endStr)) {
    throw new Error('Invalid range format. Use "start-end" (e.g., "1-5")');
  }
  
  validateIndex(startStr);
  validateIndex(endStr);
  
  if (startStr > endStr) {
    throw new Error('Start index must be less than or equal to end index');
  }
  
  return [startStr, endStr];
}

/**
 * Parse a Telegram message URL to extract channel_id and message_id
 * @param {string} url - The message URL
 * @returns {{channel_id: string, message_id: string}} Extracted IDs
 * @throws {Error} If URL is invalid
 */
export function parseMessageUrl(url) {
  // console.log(`Parsing message URL: ${url}`);
  
  const match = url.match(/https?:\/\/t\.me\/([^/]+)\/(\d+)/i);
  if (!match || match.length < 3) {
    throw new Error('Invalid message URL format');
  }
  // console.log(`Parsed channel_id: ${match[1]}, message_id: ${match[2]}`);
  
  return {
    channel_id: match[1],
    message_id: match[2]
  };
}

/**
 * Convert formatted count strings to numbers
 * @param {string} text - Formatted text (e.g., "4.9K", "1.2M")
 * @returns {number} Parsed number
 */
export function parseCount(text) {
  if (!text) return 0;
  
  const normalized = text.trim().toUpperCase();
  const multiplier = {
    'K': 1000,
    'M': 1000000
  }[normalized.slice(-1)] || 1;
  
  const numericPart = normalized.replace(/[^\d.]/g, '');
  const value = parseFloat(numericPart) || 0;
  
  // console.log(`---> normalized: ${normalized}, multiplier: ${multiplier}, numericPart: ${numericPart}, value: ${value}`);
  
  // console.log("---> parseCount:", Math.round(value * multiplier));
  
  return Math.round(value * multiplier);
}

/**
 * Normalize date string to ISO format
 * @param {string} dateString - Input date string
 * @returns {string} ISO date string
 */
export function normalizeDate(dateString) {
  // Telegram already provides ISO dates, but ensure format
  return new Date(dateString).toISOString();
}