const config = require('config');
const router = new require('express').Router();

module.exports = Factory;

function Factory({path, bot, send}) {

	bot.on('contactRelationUpdate', (message) => {
		console.log('skype', 'contactRelationUpdate', message);

		if (message.action === 'add') {
			send('protocols.skype', {to: message.address.conversation.id.split(':')[1], message: 'Hello!'});
		} else {
			// delete their data
		}
	});

	bot.on('typing', (message) => {
		//console.log('skype', 'typing', message);
		// User is typing
	});

	bot.on('deleteUserData', (message) => {
		console.log('skype', 'deleteUserData', message);

		// User asked to delete their data
	});
//=========================================================
// Bots Dialogs
//=========================================================

	bot.dialog('/', (session) => {
		console.log('skype', 'dialog /');

		session.on('error', function () {
			console.log('skype error', arguments);
		});

		const to = session.message.address.conversation.id.split(':')[1].split('@')[0];

		if (session.message.text.toLowerCase().includes('status')) {
			send('protocols.skype', {to, message: `chat room registered as skype:${to}`});
		} else {
			send('protocols.skype', {chat: 'skype:' + to, from: {name: session.message.user.name}, message: session.message.text});
		}
	});

	router.post('/skype/messages', bot._connector.listen());

	return router;
}

