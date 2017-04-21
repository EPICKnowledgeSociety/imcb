const config = require('config');
const router = new require('express').Router();

const TelegramBot = require('node-telegram-bot-api');

const options = {
  webHook: {
    port: config.hosting.port
  }
};

const bot = new TelegramBot(config.protocols.telegram.token, options);

router.post(`/telegram/bot${config.protocols.telegram.token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.onText(/\/echo (.+)/, function (msg, match) {
  var chatId = msg.chat.id;
  var resp = match[1];
  bot.sendMessage(chatId, resp);
});
 
bot.on('message', function (msg) {
  var chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Received your message');
});

module.exports = router;
module.exports.init = (path) => {
    //bot.setWebHook(`${config.hosting.url}${path}/telegram/bot${config.protocols.telegram.token}`);
};