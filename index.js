const { Client } = require('discord.js-selfbot-v13');
require('dotenv').config();  // Load environment variables

const client = new Client({
  checkUpdate: false
});

// Use environment variables from the .env file
const sourceChannelId = process.env.SOURCE_CHANNEL_ID;
const menuChannelId = process.env.MENU_CHANNEL_ID;

let latestMessage = null;  // Store the latest message from the source channel
let userCooldowns = {};  // Cooldown object for users to prevent multiple responses
let respondedUsers = {};  // Track users who have already received a response to their "!checkcode" command

client.on('ready', async () => {
  console.log('✅ Client is ready!');
});

// Capture the latest message from the source channel
client.on('messageCreate', async (message) => {
  // If the message is from the source channel and not from a bot, capture it as the latest message
  if (message.channel.id === sourceChannelId && !message.author.bot) {
    latestMessage = message.content;
    console.log(`📥 New message captured: ${latestMessage}`);
  }

  // If someone sends "!checkcode" in the menu channel
  if (message.channel.id === menuChannelId && message.content.toLowerCase() === '!checkcode') {
    // Check if the user has already received a response
    if (respondedUsers[message.author.id]) {
      console.log(`User ${message.author.tag} has already received a response.`);
      return;  // Exit early if the user has already received a response
    }

    // Mark the user as having received a response
    respondedUsers[message.author.id] = true;

    try {
      // If there is no latest message, let the user know
      if (!latestMessage) {
        await message.author.send('❌ Nu am găsit niciun mesaj pentru verificare.');
      } else {
        // If there is a latest message, send it to the user via DM
        await message.author.send(`📝 Acestea sunt datele de verificare:\n${latestMessage}`);
      }

      // React to the command to let the user know it was processed
      await message.react('✅');

      console.log(`📤 Sent data privately to ${message.author.tag}`);

      // Delete the command message from the channel
      await message.delete();
      console.log('📥 Command message deleted from the channel.');
    } catch (err) {
      console.error('❌ Could not send DM:', err);
      await message.react('⚠️'); // Let user know DM failed
    }

    // Set a cooldown for the user (prevent them from triggering the command multiple times in a short time)
    userCooldowns[message.author.id] = true;
    setTimeout(() => {
      delete userCooldowns[message.author.id]; // Remove cooldown after a set time (e.g., 10 seconds)
      delete respondedUsers[message.author.id]; // Allow the user to receive a message again after cooldown
    }, 10000); // 10 second cooldown for this example
  }
});

client.login(process.env.DISCORD_TOKEN);  // Login using token from .env file
