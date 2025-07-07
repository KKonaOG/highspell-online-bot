const config = require('./config.json');

// Validate config
if (!config)
	throw new Error("Could not read config file! Ensure 'config.json' exists in this directory.");
if (!config.token || config.token == "token-here")
	throw new Error("Token not found! Please set your bot token in 'config.json'.");
if (!config.pollRate || config.pollRate <= 0)
	throw new Error("Invalid poll rate! Please set a positive integer for 'pollRate' in 'config.json'.");
if (!config.url || config.url.startsWith("https://example.com"))
	throw new Error("Invalid URL! Please set a valid URL in 'config.json'.");
if (!config.channelId || config.channelId == "channel-id")
	throw new Error("Invalid channel ID! Please set a valid channel ID in 'config.json'.");
if (!config.cssSelector)
	throw new Error("Invalid CSS Selector! Please provide a valid CSS Selector to identify member count in 'config.json'.");

const { default: axios } = require('axios');
const cheerio = require('cheerio');

const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Reference to existing message
let messageRef;
// Last fetched member count
let cachedCount;

function formatDate() {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}
function log(msg) { console.log(`[${formatDate()}] ${msg}`); }
function error(msg) { console.error(`[${formatDate()}] ${msg}`); }

function buildMessage() {
	const countText = (cachedCount !== undefined)
		? `**${cachedCount}**`
		: '*Updating...*';

	let embed = {
		color: 0x0099ff,
		title: 'Online Players',
		url: config.url,
		description: `Current member count: ${countText}`,
		timestamp: new Date().toISOString(),
	};

	if (config.embed) {
		for (const key in config.embed) {
			if (config.embed.hasOwnProperty(key))
				embed[key] = config.embed[key];
		}
	}

	return {
		content: '',
		embeds: [ embed ]
	};
}

async function fetchMemberCount() {
	try {
		const response = await axios.get(config.url);
		const $ = cheerio.load(response.data);

		const siteCount = $(config.cssSelector).text();
		const count = parseInt(siteCount.trim());

		if (Number.isNaN(count)) {
			throw new Error(`Could not parse member count from the site. Expected a number but got '${siteCount.trim()}'`);
		}

		return count;
	} catch (err) {
		error('Error fetching member count:', err.message);
	}
}

async function findOrSendMessage(channelId) {
	const channel = await client.channels.fetch(channelId);
	if (!channel || !channel.isTextBased())
		throw new Error(`Could not find channel with ID '${channelId}' or it is not a text channel.`);
	const message = await channel.send(buildMessage());

	return message;
}

async function poll() {
	log("Polling site...");
	const newCount = await fetchMemberCount();
	log(`Fetched member count: ${newCount}`);

	if (newCount !== undefined && !Number.isNaN(newCount) && newCount !== cachedCount) {
		cachedCount = newCount;

		if (!messageRef)
			messageRef = await findOrSendMessage(config.channelId);
		else
			await messageRef.edit(buildMessage());
		log(`Updated message`);
	}

	// Lazy async interval, re-queue polling
	setTimeout(poll, config.pollRate * 1000);
}

client.once('ready', async readyClient => {
	log(`Bot is online, logged in as ${readyClient.user.tag}`);

	// Pretty-log poll rate
	const pollRate = config.pollRate;
	const pollMinutes = Math.floor(pollRate / 60);
	const pollSeconds = pollRate % 60;
	let pollText = ''
	if (pollMinutes > 0) pollText += `${pollMinutes}m`;
	if (pollSeconds > 0) {
		if (pollText.length > 0) pollText += ' ';
		pollText += `${pollSeconds}s`;
	}
	if (pollMinutes > 0) pollText += ` (${pollRate} seconds)`;
	log(`Polling active member count from '${config.url}' every ${pollText}`);

	// Start polling
	poll();
});

client.login(config.token);
