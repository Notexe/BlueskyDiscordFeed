const { WebhookClient } = require("discord.js")
const { AtpAgent } = require("@atproto/api")
const { IdResolver } = require("@atproto/identity")
const { WebSocket } = require("partysocket")
const fs = require('fs');
const path = require('path');

const defaultConfigPath = path.join(__dirname, "config.json");
const configPath = fs.existsSync("/config/config.json")
  ? "/config/config.json"
  : defaultConfigPath;

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const blueskyClient = new AtpAgent({ service: config.bluesky.service })

async function sendWebhook(embed) {
    for (var i = 0; i < config.webhookURLs.length; i++) {
        const webhook = new WebhookClient({ url: config.webhookURLs[i] })

        await webhook.send({
            embeds: [embed]
        })
    }
}

async function runBluesky() {
    const idResolver = new IdResolver();

    // Resolve handles to DIDs
    accountDIDs = await Promise.all(
        config.bluesky.accountHandles.map(async (handle) => {
            try {
                const res = await idResolver.handle.resolve(handle)
                console.log(`Resolved ${handle} to ${res}`)
                return res
            } catch (err) {
                console.log(`Failed to resolve handle ${handle}:`, err);
                return null;
            }
        })
    )

    const wantedDids = accountDIDs.join('&wantedDids=');

    let urlIndex = 0;

    const urlProvider = () => {
        const baseUrl = config.bluesky.jetstreamServices[urlIndex++ % config.bluesky.jetstreamServices.length];
        const queryParams = `wantedCollections=app.bsky.feed.post&wantedDids=${wantedDids}`;
    
        console.log(`Trying wss://${baseUrl}/subscribe?${queryParams}`)
        return `wss://${baseUrl}/subscribe?${queryParams}`;
    };
    
    const jetstreamSocket = new WebSocket(urlProvider);
    
    jetstreamSocket.addEventListener("open", () => {
        console.log("Bluesky Jetstream websocket client connected");
    });

    jetstreamSocket.addEventListener("error", (error) => {
        console.log("Websocket connection error: " + error.error);
    });

    jetstreamSocket.addEventListener("close", (event) => {
        console.log("Websocket connection closed: " + event.code);
    });

    jetstreamSocket.addEventListener("message", async (event) => {
        try {
            const data = JSON.parse(event.data);

            // Extra sanity check just in case the websocket starts sending posts from other accounts
            if (!accountDIDs.includes(data.did)) {
                return;
            }

            if (data.commit?.operation == "create") {

                if (data.commit?.record?.reply) {
                    return;
                }

                const profileInfo = await blueskyClient.app.bsky.actor.getProfile({
                    actor: data.did
                });

                const accountName = profileInfo.data.displayName || profileInfo.data.handle;

                let embed = {
                    "title": `New Bluesky post from ${accountName}`,
                    "description": data.commit.record.text,
                    "url": `https://bsky.app/profile/${profileInfo.data.handle}/post/${data.commit.rkey}`,
                    "color": 0x156cc7,
                    "timestamp": (new Date(data.commit.record.createdAt)),
                    "author": {
                        "name": accountName,
                        "icon_url": profileInfo.data.avatar
                    }
                };

                // Check for embed and images
                if (data.commit.record.embed && data.commit.record.embed.images && data.commit.record.embed.images.length > 0) {
                    // Get the CID of the first image
                    const firstImage = data.commit.record.embed.images[0];
                    const imageCID = firstImage.image.ref.$link.toString();

                    embed.image = {
                        url: `https://cdn.bsky.app/img/feed_fullsize/plain/${data.did}/${imageCID}@jpeg`
                    };
                }

                if (data.commit.record.embed && data.commit.record.embed.video) {
                    embed.image = {
                        url: `https://video.bsky.app/watch/${data.did}/${data.commit.record.embed.video.ref.$link}/thumbnail.jpg`
                    }
                }

                sendWebhook(embed)
            }
        } catch (error) {
            console.error("Error parsing message or fetching profile:", error);
        }
    });
}

async function main() {
    const configErrors = [];

    if (config.bluesky.accountHandles.length === 0) {
        configErrors.push("No Bluesky accounts specified in config.")
    }

    if (config.webhookURLs.length === 0) {
        configErrors.push("No webhook URLs specified in config.")
    }

    if (configErrors.length > 0) {
        console.log("Error(s) found in configuration:");
        configErrors.forEach(configWarning => console.log(`- ${configWarning}`));
        process.exit(1);
    }

    console.log("\nInitialising BlueskyDiscordFeed!")
    runBluesky()
}

main()