const router = new require('express').Router();

module.exports = Factory;

function Factory({bot, db, BotCommandsFactory}) {
	const botCommands = BotCommandsFactory(getChatId, getChatMessageText);

	bot.on('contactRelationUpdate', (message) => {
		console.log('skype', 'contactRelationUpdate', message);

		if (message.action === 'add') {
			db.registerChat(getChatId(message), (err) => {
				if (err) {
					return botCommands.sendError(message, err);
				}
				return botCommands.sendStatus(message);
			});
		} else {
			db.unregisterChat(getChatId(message));
		}
	});

	//bot.on('typing', (message) => {});
	//bot.on('deleteUserData', (message) => {
	//	console.log('skype', 'deleteUserData', message);
	// User asked to delete their data
	//});

	bot.dialog('/', (session) => {

		botCommands.process(session.message,
			() => {

			},
			() => {
				botCommands.send({
					broadcast: true,
					to: getChatId(session.message),
					from: {name: session.message.user.name},
					message: session.message.text
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