import * as config from './config.json';
// Throws if config is invalid
util.validateConfig(config);

import { Client, GatewayIntentBits } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

import OnlineBot from './bot';
const bot = new OnlineBot(config, client);

// Start the bot
bot.run();