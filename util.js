import axios from 'axios';
import * as cheerio from 'cheerio';

// JS has terrible date formatting utilities
// This function formats the current date in YYYY-MM-DD HH:II:SS format
export function formatDate() {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

// Logs to STDOUT with a timestamp prepended
export function log(msg) {
    console.log(`[${formatDate()}] ${msg}`);
}

// Logs to STDERR with a timestamp prepended
export function error(msg) {
    console.error(`[${formatDate()}] ${msg}`);
}

// Validates required config values are present and not set to their default value
export function validateConfig(config) {
    if (!config)
        throw new Error("Could not read config file! Ensure 'config.json' exists in this directory.");
    if (!config.token || config.token == "token-here")
        throw new Error("Token not found! Please set your bot token in 'config.json'.");
    if (!config.pollRate || config.pollRate <= 0)
        throw new Error("Invalid poll rate! Please set a positive integer for 'pollRate' in 'config.json'.");
    if (!config.channelId || config.channelId == "channel-id")
        throw new Error("Invalid channel ID! Please set a valid channel ID in 'config.json'.");

	if (config.totalCount !== undefined) {
		if (!config.totalCount.url || config.totalCount.url.startsWith("https://example.com"))
			throw new Error("Invalid Total Count URL! Please set a valid URL in 'config.json'.");
		if (!config.totalCount.cssSelector)
			throw new Error("Invalid Total Count CSS Selector! Please provide a valid CSS Selector to identify member count in 'config.json'.");
	} else {
		log("Total count fetching is disabled. Ensure 'totalCount' is set in 'config.json'.");
	}

	if (config.worldsCount !== undefined) {
		if (!config.worldsCount.url || config.worldsCount.url.startsWith("https://example.com"))
			throw new Error("Invalid Worlds Count URL! Please set a valid URL in 'config.json'.");
		if (!config.worldsCount.cssSelector)
			throw new Error("Invalid Worlds Count CSS Selector! Please provide a valid CSS Selector to identify member count in 'config.json'.");
	} else {
		log("Worlds count fetching is disabled. Ensure 'worldsCount' is set in 'config.json'.");
	}

	if (!config.totalCount && !config.worldsCount) {
		throw new Error("At least one of 'totalCount' or 'worldsCount' must be defined in 'config.json'.");
	}
}

export function formatPollRate(pollRate) {
	const pollMinutes = Math.floor(pollRate / 60);
	const pollSeconds = pollRate % 60;
	let pollText = ''
	if (pollMinutes > 0) pollText += `${pollMinutes}m`;
	if (pollSeconds > 0) {
		if (pollText.length > 0) pollText += ' ';
		pollText += `${pollSeconds}s`;
	}
	if (pollMinutes > 0) pollText += ` (${pollRate} seconds)`;

    return pollText;
}

export async function fetchData(config) {
	try {
		const response = await axios.get(config.url);
		const $ = cheerio.load(response.data);

		let element = $(config.cssSelector);
		if (config.negativeCssSelector !== undefined)
			element = element.not(config.negativeCssSelector);

		if (config.subCssSelector !== undefined)
			element = element.find(config.subCssSelector);

		return element;
	} catch (err) {
		error(`Error fetching data from ${config.url}: ${err.message}`);
	}
}
