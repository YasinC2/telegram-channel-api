/**
 * JSDoc typedefs for Telegram Channel API
 * 
 * @typedef {Object} Channel
 * @property {string} title - Channel title (.tgme_channel_info_header_title)
 * @property {string} username - Channel username (.tgme_channel_info_header_username)
 * @property {string} link - Channel public link (constructed)
 * @property {string} about - Channel description (.tgme_channel_info_description)
 * @property {number} subscribers - Subscriber count (.tgme_channel_info_counters > .tgme_channel_info_counter)
 * 
 * @typedef {Object} Message
 * @property {string} permalink - Message Permalink (.tgme_widget_message_footer .tgme_widget_message_date > a[href])
 * @property {string} id - Message ID (last part of permalink URL)
 * @property {string} author_name - Author Name (.tgme_widget_message_author .tgme_widget_message_owner_name)
 * @property {string} text - Message text (.tgme_widget_message_text) converted to Markdown
 * @property {string} date - ISO datetime (time[datetime])
 * @property {number} views - View count (.tgme_widget_message_views)
 * @property {Media|null} media - Media info if exists (photo, video, voice)
 * @property {string|null} forwarded_from - Source channel that message forwarded from 
 * @property {string|null} reply_to - The message that this message replied to 
 * @property {Reaction[]} reactions - Array of reactions with emoji + count
 * @property {ReplyInfo|null} replies - Info about replies if discussion group is enabled
 * 
 * @typedef {Object} Media
 * @property {"photo"|"video"|"voice"} type
 * @property {string} url - URL of media
 * 
 * @typedef {Object} Reaction
 * @property {string} emoji
 * @property {number} count
 * 
 * @typedef {Object} ReplyInfo
 * @property {number} count - Number of replies
 * @property {string} link - Link to replies
 */