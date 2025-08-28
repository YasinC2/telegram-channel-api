import { parse } from 'node-html-parser';
import { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } from 'node-html-markdown'
import { 
  normalizeDate, 
  parseCount 
} from './utils.js';

// Initialize NodeHtmlMarkdown for HTML to Markdown conversion
const nhm = new NodeHtmlMarkdown();

/**
 * Parse Telegram channel HTML into structured data
 * @param {string} html - Raw HTML from Telegram
 * @param {Object} options - Parsing options
 * @param {boolean} [options.include_reactions=true] - Include reactions in output
 * @param {boolean} [options.include_replies=true] - Include replies in output
 * @returns {{channel: Object, messages: Object[]}} Parsed channel and messages
 */
export function parseChannelHTML(html, options = {}) {
  const root = parse(html);
  // console.log(`root: ${root.toString().slice(0, 100)}...`); // Log first 100 chars of root
  
  const channel = extractChannelInfo(root);
  // console.log(`channel: ${JSON.stringify(channel)}`);
  
  const messageElements = root.querySelectorAll('.tgme_widget_message_wrap .tgme_widget_message');
  // console.log(`messageElements: ${messageElements.length}`);
  
  // Process messages in reverse order (newest first)
  const messages = messageElements
    .slice(0, 20) // Limit to 20 messages
    .map(element => parseMessageElement(element, options))
    .reverse(); // Make index 1 = most recent
  
  // console.log(`----> messages: ${JSON.stringify(messages).substring(0, 500)}...`); // Log first 500 chars of messages
    
  return { channel, messages };
}

/**
 * Extract channel information
 * @param {HTMLElement} root - Parsed document root
 * @returns {Object} Channel info
 */
function extractChannelInfo(root) {
  return {
    title: root.querySelector('.tgme_channel_info_header_title')?.textContent.trim() || '',
    username: root.querySelector('.tgme_channel_info_header_username')?.textContent.trim().replace('@', '') || '',
    link: root.querySelector('.tgme_channel_info_header_username')?.getAttribute('href') || '',
    about: root.querySelector('.tgme_channel_info_description')?.textContent.trim() || '',
    subscribers: parseCount(root.querySelector('.tgme_channel_info_counters .tgme_channel_info_counter:first-child .counter_value')?.textContent.trim())
  };
}

/**
 * Parse a single message element
 * @param {HTMLElement} element - Message element
 * @param {Object} options - Parsing options
 * @returns {Object} Message object
 */
function parseMessageElement(element, options) {
  const message = {
    permalink: element.querySelector('.tgme_widget_message_footer .tgme_widget_message_date > a')?.getAttribute('href') || '',
    author_name: element.querySelector('.tgme_widget_message_author .tgme_widget_message_owner_name')?.textContent.trim() || '',
    date: normalizeDate(element.querySelector('.tgme_widget_message_date time')?.getAttribute('datetime') || ''),
    views: parseCount(element.querySelector('.tgme_widget_message_views')?.textContent.trim())
  };

  // console.log(`message: ${JSON.stringify(message)}`);
  
  
  // Extract message ID from permalink
  const urlMatch = message.permalink.match(/\/(\d+)$/);
  message.id = urlMatch ? urlMatch[1] : '';
  
  // Extract and convert message text
  const textElement = element.querySelector('.tgme_widget_message_text.js-message_text');
  // console.log(`--> textElement: ${textElement}`);
  
  if (textElement) {
    // console.log(`--> textElement.innerHTML: ${textElement.innerHTML}`);
    
    // Convert HTML to Markdown
    message.text = nhm.translate(textElement.innerHTML);
  }
  // console.log(`--> Converted HTML to Markdown: ${message.text}`);
  
  
  // Extract media
  message.media = extractMedia(element);
  // console.log(`--> media: ${JSON.stringify(message.media)}`);
  
  
  // Extract forwarded from
  const forwardedElement = element.querySelector('.tgme_widget_message_forwarded_from a');
  // console.log(`--> forwardedElement: ${forwardedElement}`);
  if (forwardedElement) {
    message.forwarded_from = forwardedElement.textContent.trim();
  }
  
  // Extract reply info if enabled
  if (options.include_replies !== false) {
    message.reply_to = extractReplyInfo(element);
  }
  
  // Extract reactions if enabled
  if (options.include_reactions !== false) {
    message.reactions = extractReactions(element);
  }
  
  // Extract replies info
  const repliesElement = element.querySelector('.tgme_widget_message_replies');
  // console.log(`--> repliesElement: ${repliesElement}`);
  
  if (repliesElement) {
    message.replies = {
      count: parseCount(repliesElement.querySelector('.tgme_widget_message_reply_count')?.textContent.trim()),
      link: repliesElement.getAttribute('href') || ''
    };
  }
  
  // Remove empty fields
  Object.keys(message).forEach(key => {
    if (message[key] === null || message[key] === undefined || message[key] === '') {
      delete message[key];
    }
  });

  // console.log(`Parsed message: ${JSON.stringify(message)}`);
  
  
  return message;
}

/**
 * Extract media information from message
 * @param {HTMLElement} element - Message element
 * @returns {Object|null} Media object or null
 */
function extractMedia(element) {
  // console.log(`--> extractMedia element: ${element}`);
  
  // Photo
  const photoWrap = element.querySelector('.tgme_widget_message_photo_wrap');
  // console.log(`--> photoWrap: ${photoWrap}`);
  
  if (photoWrap) {
    const style = photoWrap.getAttribute('style') || '';
    const urlMatch = style.match(/url\('?(.*?)'?\)/);
    if (urlMatch) {
      return {
        type: 'photo',
        url: urlMatch[1]
      };
    }
  }
  
  // Video
  const videoElement = element.querySelector('.tgme_widget_message_video');
  // console.log(`--> videoElement: ${videoElement}`);
  if (videoElement) {
    return {
      type: 'video',
      url: videoElement.getAttribute('src') || ''
    };
  }
  
  // Voice
  const voiceElement = element.querySelector('.tgme_widget_message_voice');
  // console.log(`--> voiceElement: ${voiceElement}`);
  if (voiceElement) {
    return {
      type: 'voice',
      url: voiceElement.getAttribute('src') || ''
    };
  }
  
  return null;
}

/**
 * Extract reply information
 * @param {HTMLElement} element - Message element
 * @returns {Object|null} Reply info or null
 */
function extractReplyInfo(element) {
  const replyElement = element.querySelector('.tgme_widget_message_reply');
  if (!replyElement) return null;
  
  return {
    author_name: replyElement.querySelector('.tgme_widget_message_author_name')?.textContent.trim() || '',
    text: replyElement.querySelector('.js-message_reply_text')?.textContent.trim() || '',
    link: replyElement.getAttribute('href') || ''
  };
}

/**
 * Extract reactions
 * @param {HTMLElement} element - Message element
 * @returns {Object[]} Array of reactions
 */
function extractReactions(element) {
  const reactions = [];
  const reactionElements = element.querySelectorAll('.tgme_widget_message_reactions .tgme_reaction');

  reactionElements.forEach(reactionEl => {
    // Get the last text node which contains the count
    // const countNode = [...reactionEl.childNodes].reverse().find(node =>
    //   node.nodeType === node.TEXT_NODE && node.textContent.trim() !== ''
    // );
    
    // const count = countNode ? parseCount(countNode.textContent.trim()) : 0;

    // Get direct text nodes only (ignore <i> etc.)
    const directTextNodes = [...reactionEl.childNodes].filter(
      node => node.nodeType === 3 && node.textContent.trim() !== ''
    );

    // Usually the last direct text node is the count
    const countText = directTextNodes.pop()?.textContent.trim() || '0';
    const count = parseCount(countText);


    if (reactionEl.classList.contains('tgme_reaction_paid')) {
      reactions.push({
        type: 'telegram_stars',
        count
      });
    } else {
      const emoji = reactionEl.querySelector('.emoji')?.textContent.trim() ||
                    reactionEl.querySelector('.tgme_reaction_emoji')?.textContent.trim();
      if (emoji) {
        reactions.push({
          emoji,
          count
        });
      }
    }
  });

  return reactions;
}