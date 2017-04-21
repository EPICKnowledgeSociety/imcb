const config = require('config');
const builder = require('botbuilder');
const router = new require('express').Router();

// Create chat bot
const connector = new builder.ChatConnector({
    appId: config.protocols.skype.appId,
    appPassword: config.protocols.skype.appPassword
});

const bot = new builder.UniversalBot(connector);

//Bot on
bot.on('contactRelationUpdate', (message) => {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
                .address(message.address)
                .text("Hello %s... Thanks for adding me. Say 'hello' to see some great demos.", name || 'there');
        bot.send(reply);
    } else {
        // delete their data
    }
});

bot.on('typing', (message) => {
  // User is typing
});

bot.on('deleteUserData', (message) => {
    // User asked to delete their data
});
//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', (session) => {
    if(session.message.text.toLowerCase().includes('hello')){
      session.send('Hey, How are you?');
      }else if(session.message.text.toLowerCase().includes('help')){
        session.send('How can I help you?');
      }else{
        session.send(`Sorry I don't understand you...`);
      }
});

router.post('/skype/messages', connector.listen());

module.exports = router;