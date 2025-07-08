import axios from 'axios';
import * as cheerio from 'cheerio';
import * as util from './util.js';

export default class OnlineBot {
    /**
     * @param {Config} config
     * @param {Client} client
     */
    constructor(config, client) {
        this.client = client;
        this.config = config;

		this.messageRef = undefined;
        this.cachedCount = undefined;

        this.running = false;
    }

    /**
     * Sets up discord client ready event handler and logs in to discord
     */
    run() {
        this.running = true;

        this.client.once('ready', this.onReady.bind(this));
        this.client.login(this.config.token);
    }

    /**
     * Handler for discord client ready event
     * @param {Client} readyClient
     */
    async onReady(readyClient) {
        util.log(`Bot is online, logged in as ${readyClient.user.tag}`);
        const formattedPollRate = util.formatPollRate(this.config.pollRate);
        util.log(`Polling active member count from '${this.config.url}' every ${formattedPollRate}`);

        this.messageRef = await this.getOrSendMessage();

        // Start polling
        this.poll();
    }

    /**
     * Main update loop
     */
    async poll() {
        util.log("Polling site...");
        const newCount = await this.fetchMemberCount();
        util.log(`Fetched member count: ${newCount}`);

        if (newCount !== undefined && !Number.isNaN(newCount) && newCount !== this.cachedCount) {
            this.cachedCount = newCount;
			await this.messageRef.edit(this.buildMessage());
            util.log(`Updated message`);
        }

        // Lazy async interval, re-queue polling
        if (this.running)
            setTimeout(this.poll, this.config.pollRate * 1000);
    }

    /**
     * Attempts to fetch an existing message from the channel
     * Sends a new message if none is found
     * @returns A reference to the found or newly sent message
     */
    async getOrSendMessage() {
        const channel = await this.client.channels.fetch(this.config.channelId);
        if (!channel || !channel.isTextBased())
            throw new Error(`Could not find channel with ID '${this.channelId}' or it is not a text channel.`);
        // Find messages from our bot containing an embed in the last 10 messages
		const messages = await channel.messages.fetch({ limit: 10, cache: false });
		const botMessages = messages.filter(msg => msg.author.id === this.client.user.id && msg.embeds.length > 0);
		if (botMessages.size > 0) {
			// Sort messages by created timestamp, newest first
			botMessages.sort((a, b) => b.createdTimestamp - a.createdTimestamp);
			const message = botMessages.first();
			util.log(`Found existing message with ID '${message.id}'`);
			return message;
		} else {
			const message = await channel.send(this.buildMessage());
			util.log(`Sent new message with ID '${message.id}'`);
			return message;
		}
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
