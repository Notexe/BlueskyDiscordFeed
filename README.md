# BlueskyDiscordFeed
Monitors Bluesky posts from configured accounts and sends them to Discord webhooks

## config.json example:
```json
{
    "bluesky": {
        "service": "https://public.api.bsky.app",
        "jetstreamServices": [
            "jetstream1.us-east.bsky.network",
            "jetstream2.us-east.bsky.network",
            "jetstream1.us-west.bsky.network",
            "jetstream2.us-west.bsky.network"
        ],
        "accountHandles": [
            "bsky.app"
        ]
    },
    "webhookURLs": [
        "https://discord.com/api/webhooks/id/token"
    ]
}
```