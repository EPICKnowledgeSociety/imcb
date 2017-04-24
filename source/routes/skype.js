const router = new require('express').Router();

module.exports = Factory;

function Factory({bot, commands, helperFactory}) {
	const helper = helperFactory(getChatId);

	bot.on('contactRelationUpdate', (message) => {
		console.log('skype', 'contactRelationUpdate', message);

		if (message.action === 'add') {
			commands.register(getChatId(message), (err) => {
				if (err) {
					return helper.sendError(message, err);
				}
				return helper.sendStatus(message);
			});
		} else {
			commands.unregister(getChatId(message));
		}
	});

	//bot.on('typing', (message) => {});
	//bot.on('deleteUserData', (message) => {
	//	console.log('skype', 'deleteUserData', message);
	// User asked to delete their data
	//});

	bot.dialog('/', (session) => {
		if (session.message.text.includes('status')) {
			return helper.sendStatus(session.message);
		} else {
			helperFactory.send({
				broadcast: true,
				to: getChatId(session.message),
				from: {name: session.message.user.name},
				message: session.message.text
			});
		}
	});

	router.post('/skype/messages', bot._connector.listen());

	return router;
}

function getChatId(message) {
	return `skype:${message.address.conversation.id.split(':')[1]}`;
}