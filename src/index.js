import { fetchChannelHTML } from './scraper.js';
import { parseChannelHTML } from './parser.js';
import { 
  validateIndex, 
  validateRange, 
  parseMessageUrl 
} from './utils.js';
import { 
  DEFAULT_OPTIONS, 
  MAX_MESSAGES 
} from './constants.js';

/**
 * Cloudflare Worker entrypoint
 */
export default {
  async fetch(request) {
    try {
      const url = new URL(request.url);
      // console.log(`Received request: ${request.method} ${request.url}`);
      
      // Only handle /api path
      if (url.pathname !== '/api') {
        return new Response('Not Found', { status: 404 });
      }
      
      // Parse query parameters
      const params = Object.fromEntries(url.searchParams.entries());
      // console.log(`Parsed params: ${JSON.stringify(params)}`);
      
      const { 
        channel_id, 
        message_index, 
        range, 
        message_url,
        include_reactions = 'true',
        include_replies = 'true'
      } = params;
      
      // Prepare options
      const options = {
        include_reactions: include_reactions === 'true',
        include_replies: include_replies === 'true'
      };
      
      // Determine which channel to fetch and message selection
      let targetChannel = channel_id;
      let messageIds = [];
      // console.log(`channel_id: ${channel_id}, message_index: ${message_index}, range: ${range}, message_url: ${message_url}`);
      
      // Handle message_url parameter (highest priority)
      // if (message_url) {
      //   try {
      //     const { channel_id: urlChannel, message_id } = parseMessageUrl(message_url);
      //     targetChannel = urlChannel;
      //     messageIds = [parseInt(message_id)];
      //     // console.log(`targetChannel: ${targetChannel}, messageIds: ${messageIds}`);
          
      //   } catch (error) {
      //     return jsonResponse({
      //       error: true,
      //       message: error.message
      //     }, 400);
      //   }
      // }
      // Handle range parameter
      if (range) {
        try {
          const [start, end] = validateRange(range);
          // Create array of message indices (1-based)
          messageIds = Array.from({ length: end - start + 1 }, (_, i) => start + i);
        } catch (error) {
          return jsonResponse({
            error: true,
            message: error.message
          }, 400);
        }
      } 
      // Handle message_index parameter
      else if (message_index) {
        try {
          const index = parseInt(message_index);
          validateIndex(index);
          messageIds = [index];
        } catch (error) {
          return jsonResponse({
            error: true,
            message: error.message
          }, 400);
        }
      }
      
      // Validate channel_id if not set by message_url
      if (!targetChannel) {
        return jsonResponse({
          error: true,
          message: 'Missing required parameter: channel_id'
        }, 400);
      }
      
      // Fetch and parse channel HTML
      try {
        const html = await fetchChannelHTML(targetChannel);
        // console.log(`Fetched HTML length: ${html.length}`);
        
        const { channel, messages } = parseChannelHTML(html, options);
        // console.log(`Parsed channel: ${JSON.stringify(channel)}, messages: ${JSON.stringify(messages)}`);
        console.log(`messages: ${messages}`);
        
        
        // If we have specific message IDs to return
        let resultMessages = [];

        console.log(`messageIds: ${messageIds}`);
        

        if (messageIds.length > 0) {
          // Since messages are stored with index 0 = oldest, we need to convert
          // 1-based index to 0-based array position (reverse order)
          resultMessages = messageIds.map(id => {
            console.log(`Processing message ID: ${id}`);
            
            // Convert 1-based index to 0-based position (most recent is at MAX_MESSAGES-1)
            // const position = MAX_MESSAGES - id;
            // const message = messages[position];
            const message = messages[id-1];
            // console.log(`position: ${position}, message: ${JSON.stringify(message)}`);
            console.log(`message: ${JSON.stringify(message)}`);
            
            
            if (!message) {
              throw new Error(`Message index ${id} not found in last ${MAX_MESSAGES} messages`);
            }
            
            return message;
          });
        } else {
          // Return all messages
          resultMessages = messages;
        }
        
        return jsonResponse({
          channel,
          messages: resultMessages
        });
        
      } catch (error) {
        // Handle errors from scraper or parser
        if (error.error) {
          return jsonResponse(error, error.status || 500);
        }
        return jsonResponse({
          error: true,
          message: error.message
        }, 500);
      }
      
    } catch (error) {
      // Catch-all for unexpected errors
      return jsonResponse({
        error: true,
        message: 'Internal server error'
      }, 500);
    }
  }
};

/**
 * Helper to create JSON response
 * @param {Object} data - Response data
 * @param {number} [status=200] - HTTP status code
 * @returns {Response} JSON response
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}