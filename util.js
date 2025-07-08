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
    if (!config.url || config.url.startsWith("https://example.com"))
        throw new Error("Invalid URL! Please set a valid URL in 'config.json'.");
    if (!config.channelId || config.channelId == "channel-id")
        throw new Error("Invalid channel ID! Please set a valid channel ID in 'config.json'.");
    if (!config.cssSelector)
        throw new Error("Invalid CSS Selector! Please provide a valid CSS Selector to identify member count in 'config.json'.");
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
