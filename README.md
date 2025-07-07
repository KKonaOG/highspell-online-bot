# Highspell Online Members Bot
A simple discord to periodically fetch online member count from [Highspell main page](https://highspell.com) and update a discord message.

## Setup and Usage
This is a simple node.js application. Clone the repository, run `npm install` in the directory, and then run `node index.js` to start the bot.

## Config
Config is a simple JSON file. Copy `config.dev.json` to `config.json` and edit values as appropriate.
```
{
    token,
    pollRate,
    url,
    channelId,
    cssSelector,
    embed
}
```
- `token` **Requried**: Discord bot token to log in with
- `pollRate` **Required**: Number of seconds between updates. Each update fetches the page and updates the discord message
- `url` **Required**: Exact URL to fetch page from
- `channelId` **Required**: Discord ChannelId
- `cssSelector` **Required**: A standard [CSS Selector]() used to extract the member count from the page
- `embed` *Optional*: Any custom parameters for the message embed. See [discord.js docs]() for details on accepted properties.

### Default Embed settings
These properties, plus any omitted properties, will be overridden by provided properties in the config file
```
{
    color: 0x0099ff,
    title: 'Online Players',
    url: config.url,
    description: `Current member count: ${memberCount}`,
    timestamp: new Date().toISOString(),
}
```
It is not recommended to override `description` or `timestamp`, as values provided in the config file are constant and cannot be evaluated at runtime.