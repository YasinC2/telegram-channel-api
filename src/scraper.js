import { DEFAULT_USER_AGENT, BASE_URL } from './constants.js';

/**
 * Fetches raw HTML from a public Telegram channel
 * @param {string} channel_id - Telegram channel username
 * @returns {Promise<string>} Raw HTML content
 * @throws {Object} JSON error object if fetch fails
 */
export async function fetchChannelHTML(channel_id) {
  const url = `${BASE_URL}${channel_id}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': DEFAULT_USER_AGENT
      }
    });
    // console.log(`Fetched channel HTML: ${await response.text()}...`); // Log first 100 chars
    

    if (!response.ok) {
      throw {
        error: true,
        message: `Failed to fetch channel HTML: ${response.statusText}`,
        status: response.status
      };
    }

    return await response.text();
  } catch (error) {
    // Handle network errors or failed responses
    if (error && error.status) {
      throw error; // Already formatted error
    }
    
    throw {
      error: true,
      message: `Network error: ${error.message}`,
      status: 500
    };
  }
}