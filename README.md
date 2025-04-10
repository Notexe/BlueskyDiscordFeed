# BlueskyDiscordFeed
Monitors Bluesky posts from configured accounts and sends them to Discord webhooks in embed form

### Example:
![Discord_FtOc5txjqa](https://github.com/user-attachments/assets/5a35e7db-ab7c-4a20-aa6b-c44d0f8a4eff)

## Running
Requires NodeJS

1. `npm install`
2. `npm start`

### As a systemd service:
`/etc/systemd/system/blueskydiscordfeed.service`
```conf
[Unit]
Description=Monitors Bluesky posts from configured accounts and sends them to a Discord webhook 
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/path/to/BlueskyDiscordFeed
ExecStart=/usr/bin/node /path/to/BlueskyDiscordFeed/index.js
Restart=on-failure
RestartSec=3s
[Install]
WantedBy=multi-user.target
```

### As a Docker compose file:
```yaml
services:
  blueskydiscordfeed:
    image: ghcr.io/notexe/blueskydiscordfeed:latest
    volumes:
      - /data:/config
```

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
