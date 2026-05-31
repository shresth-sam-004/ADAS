const TelegramBot = require('node-telegram-bot-api');
const db = require('./database');

let bot = null;
let io = null; // Socket.io instance reference

function initBot(socketIoInstance) {
  io = socketIoInstance;
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN') {
    console.log('\x1b[33m%s\x1b[0m', '⚠️ [Telegram] TELEGRAM_BOT_TOKEN not configured. Real bot offline. Simulated UI bot is active.');
    return;
  }

  try {
    bot = new TelegramBot(token, { polling: true });
    console.log('\x1b[32m%s\x1b[0m', '✅ [Telegram] Bot active and polling.');

    // Command listener
    bot.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;
      const response = await processCommand('/status');
      bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/location/, async (msg) => {
      const chatId = msg.chat.id;
      const response = await processCommand('/location');
      bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/sos/, async (msg) => {
      const chatId = msg.chat.id;
      const response = await processCommand('/sos');
      bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/lock/, async (msg) => {
      const chatId = msg.chat.id;
      const response = await processCommand('/lock');
      bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/siren/, async (msg) => {
      const chatId = msg.chat.id;
      const response = await processCommand('/siren');
      bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    });

    bot.on('message', (msg) => {
      // Check if message is not a command
      if (msg.text && !msg.text.startsWith('/')) {
        bot.sendMessage(msg.chat.id, "🤖 ADAS Guardian Bot active. Available commands:\n/status - Check vehicle diagnostics\n/location - Live GPS coordinates\n/sos - Trigger emergency alert\n/lock - Lock/Unlock vehicle doors\n/siren - Trigger vehicle alarm");
      }
    });

  } catch (err) {
    console.error('❌ [Telegram] Bot failed to initialize:', err.message);
  }
}

// Unified Command Execution Logic
async function processCommand(cmd) {
  const currentState = await db.getVehicleState();
  let response = '';

  switch (cmd) {
    case '/status':
      response = `🤖 *ADAS Guardian Status Report*
🚗 *Vehicle ID:* ${currentState.vehicleId}
🔋 *Health Score:* ${currentState.healthScore}%
⚠️ *Threat Level:* ${currentState.threatLevel}
🛡️ *GPS Security:* ${currentState.gpsIntegrity}
🛡️ *Network State:* ${currentState.networkSecurity}
🔒 *Security Lock:* ${currentState.remoteLockState}
🚨 *Siren:* ${currentState.sirenState}
🚦 *ADAS Sensors:* ${currentState.adasStatus === 'Active' ? 'Protected' : 'Compromised'}`;
      break;

    case '/location':
      response = `📍 *Vehicle Location Ping*
🚗 *Vehicle ID:* ${currentState.vehicleId}
📡 *Coordinates:* \`${currentState.latitude.toFixed(6)}, ${currentState.longitude.toFixed(6)}\`
🧭 *Heading:* ${currentState.heading}
⚡ *Speed:* ${currentState.speed} km/h
🔗 [Open in Google Maps](https://www.google.com/maps/search/?api=1&query=${currentState.latitude},${currentState.longitude})`;
      break;

    case '/sos':
      // Trigger emergency protocol
      await db.updateVehicleState({
        threatLevel: 'HIGH',
        emergencySystem: 'TRIGGERED',
        emergencyReadiness: 'DEPLOYING RESCUE'
      });
      await db.saveAttackLog({
        attackType: 'Emergency SOS Triggered',
        affectedComponent: 'Manual SOS',
        threatLevel: 'HIGH',
        status: 'DEPLOYED',
        details: 'Driver triggered manual SOS. Emergency services notified.'
      });

      if (io) {
        io.emit('vehicle-update', await db.getVehicleState());
        io.emit('attack-log', {
          title: 'Manual SOS Active',
          desc: 'SOS signal transmitted to central command.',
          threat: 'HIGH'
        });
      }

      response = `🚨 *EMERGENCY SOS RECEIVED*
⚠️ Alerting closest emergency response crew...
📍 *Location:* \`${currentState.latitude.toFixed(6)}, ${currentState.longitude.toFixed(6)}\`
👩‍⚕️ Nearest hospital contacted. Live tracking link sharing active.`;
      break;

    case '/lock':
      const newLockState = currentState.remoteLockState === 'LOCKED' ? 'UNLOCKED' : 'LOCKED';
      await db.updateVehicleState({ remoteLockState: newLockState });
      if (io) {
        io.emit('vehicle-update', await db.getVehicleState());
      }
      response = `🔒 *Remote Command Executive*
Vehicle lock status toggled to: *${newLockState}*`;
      break;

    case '/siren':
      const newSirenState = currentState.sirenState === 'ON' ? 'OFF' : 'ON';
      await db.updateVehicleState({ sirenState: newSirenState });
      if (io) {
        io.emit('vehicle-update', await db.getVehicleState());
      }
      response = `🚨 *Security Siren Override*
Siren has been manually turned *${newSirenState}*.`;
      break;

    default:
      response = `Unknown command. Type /help to see all commands.`;
  }

  return response;
}

// Function to trigger a Telegram push message from the server (e.g. during simulated theft)
async function triggerPushAlert(chatId, text) {
  if (bot && chatId) {
    try {
      await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Error sending Telegram push notification:', err.message);
    }
  }
}

module.exports = {
  initBot,
  processCommand,
  triggerPushAlert
};
