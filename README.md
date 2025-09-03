# Telegram Channel API with Cloudflare Workers

This project provides an API to scrape public Telegram channels and return structured JSON data of the last 20 messages. It runs on Cloudflare Workers and uses:
- `node-html-parser` for HTML parsing
- `node-html-markdown` for converting HTML to Markdown

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

3. Start local development server:
```bash
npm run dev
```

4. Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## API Usage

### Endpoint
`GET /api`

### Parameters
- `channel_id` (required unless using message_url): Telegram channel username
- `message_index` (optional): Specific message index (1-20, 1=most recent)
- `range` (optional): Message range (e.g., "1-5")
<!-- - `message_url` (optional): Full URL of a specific message -->
- `include_reactions` (optional, default=true): Include reactions in response
- `include_replies` (optional, default=true): Include reply information

### Examples

Get last 20 messages from a channel:
```bash
curl "http://127.0.0.1:8787/api?channel_id=telegram"
```

Get the most recent message:
```bash
curl "http://127.0.0.1:8787/api?channel_id=telegram&message_index=1"
```

Get messages 1-5:
```bash
curl "http://127.0.0.1:8787/api?channel_id=telegram&range=1-5"
```

<!-- It's not working right now.
Get specific message by URL:
```bash
curl "http://127.0.0.1:8787/api?message_url=https://t.me/telegram/2891"
``` -->

Exclude reactions:
```bash
curl "http://127.0.0.1:8787/api?channel_id=telegram&include_reactions=false"
```

## Response Schema

```json
{
  "channel": {
    "title": "Channel Title",
    "username": "channel_username",
    "link": "https://t.me/channel_username",
    "about": "Channel description",
    "subscribers": 15000
  },
  "messages": [
    {
      "id": "12345",
      "permalink": "https://t.me/channel_username/12345",
      "author_name": "Author Name",
      "text": "Message text in Markdown",
      "date": "2023-01-01T12:00:00.000Z",
      "views": 1500,
      "media": {
        "type": "photo",
        "url": "https://image.url"
      },
      "reactions": [
        {"emoji": "🔥", "count": 45},
        {"emoji": "❤️", "count": 120}
      ],
      "replies": {
        "count": 5,
        "link": "https://t.me/channel_username/12345?reply=1"
      }
    }
  ]
}
```

## Error Responses

```json
{
  "error": true,
  "message": "Error description"
}
```

## Limitations
- Only the last 20 messages are accessible
- Cannot fetch private channels or messages older than the latest 20
- If a requested message is outside the last 20, returns `NOT_FOUND`
- Respects Telegram's Terms of Use - for public viewing only

## Roadmap
- Implementing the ability to receive older messages using the "https://t.me/s/{channel-id}?before={post-id}" url format.

## Credits
- [node-html-parser](https://github.com/taoqf/node-html-parser)
- [node-html-markdown](https://github.com/crosstype/node-html-markdown)
- Cloudflare Workers