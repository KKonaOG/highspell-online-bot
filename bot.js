import axios from 'axios';
import * as cheerio from 'cheerio';
import * as util from './util';

export default class OnlineBot {
    /**
     * @param {Config} config 
     * @param {Client} client 
     */
    __constructor(config, client) {
        this.discordClient = client;
        this.config = config;

        this.messageRef = this.getOrSendMessage();
        this.cachedCount = undefined;

        this.running = false;
    }

    /**
     * Sets up discord client ready event handler and logs in to discord
     */
    run() {
        this.running = true;

        client.once('ready', this.onReady.bind(this));
        client.login(config.token);
    }

    /**
     * Handler for discord client ready event
     * @param {Client} readyClient 
     */
    onReady(readyClient) {
        util.log(`Bot is online, logged in as ${readyClient.user.tag}`);
        const formattedPollRate = util.formatPollRate(this.config.pollRate);
        util.log(`Polling active member count from '${this.config.url}' every ${formattedPollRate}`);

        // Start polling
        this.poll();
    }

    /**
     * Main update loop
     */
    async poll() {
        util.log("Polling site...");
        const newCount = await fetchMemberCount();
        util.log(`Fetched member count: ${newCount}`);

        if (newCount !== undefined && !Number.isNaN(newCount) && newCount !== cachedCount) {
            cachedCount = newCount;

            if (!messageRef)
                messageRef = await findOrSendMessage(config.channelId);
            else
                await messageRef.edit(buildMessage());
            util.log(`Updated message`);
        }

        // Lazy async interval, re-queue polling
        if (this.running)
            setTimeout(poll, config.pollRate * 1000);
    }

    /**
     * Attempts to fetch an existing message from the channel
     * Sends a new message if none is found
     * @returns A reference to the found or newly sent message
     */
    async getOrSendMessage() {
        const channel = await client.channels.fetch(this.channelId);
        if (!channel || !channel.isTextBased())
            throw new Error(`Could not find channel with ID '${this.channelId}' or it is not a text channel.`);
        // TODO: Find existing message
        const message = await channel.send(buildMessage());

        return message;
    }

    /**
     * Builds a Discord message object to be sent or updated
     * @returns A Discord message object
     */
    buildMessage() {
        // If cachedCount is undefined, we haven't fetched from the website yet
        const countText = (this.cachedCount !== undefined)
            ? `**${this.cachedCount}**`
            : '*Updating...*';

        // Default embed settings
        let embed = {
            color: 0x0099ff,
            title: 'Online Players',
            url: this.config.url,
            description: `Current member count: ${countText}`,
            timestamp: new Date().toISOString(),
        };

        // Apply config embed if it exists
        const configEmbed = this.config.embed;
        if (configEmbed) {
            for (const key in configEmbed) {
                if (configEmbed.hasOwnProperty(key))
                    embed[key] = configEmbed[key];
            }
        }

        return {
            embeds: [ embed ],
            // Just in case
            content: ''
        };
    }

    /**
     * Fetches the configured page and extracts the member count from it
     * @returns {number} The new member count
     */
    async fetchMemberCount() {
        try {
            const response = await axios.get(this.config.url);
            const $ = cheerio.load(response.data);

            const siteCount = $(this.config.cssSelector).text();
            const count = parseInt(siteCount.trim());

            if (Number.isNaN(count)) {
                throw new Error(`Could not parse member count from the site. Expected a number but got '${siteCount.trim()}'`);
            }

            return count;
        } catch (err) {
            util.error('Error fetching member count:', err.message);
        }
    }
}