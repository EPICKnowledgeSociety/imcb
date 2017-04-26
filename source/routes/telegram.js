const config = require('config');
const router = new require('express').Router();

module.exports = Factory;

function Factory({path, bot, db, BotCommandsFactory}) {
	const botCommands = BotCommandsFactory(getChatId, getChatMessageText);

	bot.on('message', onBotMessage);
	bot.setWebHook(`${config.hosting.url}${path}/telegram/bot${config.protocols.telegram.token}`);

	router.post(`/telegram/bot${config.protocols.telegram.token}`, onPost);

	return router;

	function onPost(req, res) {
		bot.processUpdate(req.body);
		res.sendStatus(200);
	}


	function onBotMessage(message) {
		console.log('message', JSON.stringify(message));

		switch (true) {
			case isInvited.call(this, message):
				return processInvited.call(this, message);
			case isRemoved.call(this, message):
				return processRemoved.call(this, message);
			default:
				return botCommands.process(message,
					() => {
					},
					() => {
						botCommands.send({
							broadcast: true,
							to: getChatId(message),
							from: {name: message.from.username},
							message: message.text
						});
					}
				);
		}
	}

	function isInvited(message) {
		return message.new_chat_member &&
			message.new_chat_member.username === config.protocols.telegram.username;
	}

	function processInvited(message) {
		db.registerChat(getChatId(message), (err) => {
			if (err) {
				return botCommands.sendError(message, err);
			}
			botCommands.sendStatus(message);
		});
	}

	function isRemoved(message) {
		return message.left_chat_member &&
			message.left_chat_member.username === config.protocols.telegram.username;
	}

	function processRemoved(message) {
		db.unregisterChat(getChatId(message));
	}
}

function getChatId(message) {
	return `telegram:${message.chat.id}`;
}

function getChatMessageText(message) {
	return message.text;
}
