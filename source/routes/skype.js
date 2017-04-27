const config = require('config');
const router = new require('express').Router();

module.exports = Factory;

function Factory({bot, BotCommandsFactory}) {
	const botCommands = BotCommandsFactory(getChatId, getChatMessageText);

	bot.on('conversationUpdate', (conversationUpdate) => {
		console.log('skype contactRelationUpdate:', JSON.stringify(conversationUpdate));

		if (conversationUpdate.membersAdded) {
			if (conversationUpdate.membersAdded.some((member) => member.id.includes(config.protocols.skype.appId))) {
				return botCommands.registerChat(conversationUpdate);
			}
		} else if (conversationUpdate.membersRemoved) {
			if (conversationUpdate.membersRemoved.some((member) => member.id.includes(config.protocols.skype.appId))) {
				return botCommands.unregisterChat(conversationUpdate);
			}
		}
	});

	bot.on('receive', (event) => {
		console.log('skype event:', JSON.stringify(event));
	});


	bot.dialog('/', (session) => {
		botCommands.process(session.message,
			() => {
				/* custom command */
			},
			() => {
				botCommands.send({
					broadcast: true,
					to: getChatId(session.message),
					from: {name: session.message.user.name},
					message: getChatMessageText(session.message).replace(new RegExp(`^@${config.protocols.skype.botName} `), '')
				});
			}
		);
	});

	router.post('/skype/messages', bot._connector.listen());

	return router;
}

function getChatId(message) {
	return `skype:${message.address.conversation.id.split(':')[1].split('@')[0]}`;
}

function getChatMessageText(message) {
	return message.text;
}