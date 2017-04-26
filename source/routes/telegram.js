const config = require('config');
const router = new require('express').Router();

module.exports = Factory;

function Factory({path, bot, db, BotCommandsFactory}) {
	const botCommands = BotCommandsFactory(getChatId);

	bot.on('message', onBotMessage);
	bot.onText(botCommands.isCommand, onBotCommandMessage);
	bot.setWebHook(`${config.hosting.url}${path}/telegram/bot${config.protocols.telegram.token}`);

	router.post(`/telegram/bot${config.protocols.telegram.token}`, onPost);

	return router;

	function onPost(req, res) {
		bot.processUpdate(req.body);
		res.sendStatus(200);
	}


	function onBotMessage(msg) {
		console.log('message', JSON.stringify(msg));

		switch (true) {
			case isInvited.call(this, msg):
				return processInvited.call(this, msg);
			case isRemoved.call(this, msg):
				return processRemoved.call(this, msg);
			default:
				if (!botCommands.isCommand.test(msg.text))
					return botCommands.send({
						broadcast: true,
						to: getChatId(msg),
						from: {name: msg.from.username},
						message: msg.text
					});
		}
	}

	function onBotCommandMessage(msg, match) {
		const command = (match[1] || '').trim();

		switch (true) {
			case (command === 'status'):
				return botCommands.sendStatus(msg);
			case (botCommands.isLinkCommand.test(command)):
				return link(msg, command.match(BotCommandsFactory.isLinkCommand).slice(1));
			case (botCommands.isUnlinkCommand.test(command)):
				return unlink(msg, command.match(BotCommandsFactory.isUnlinkCommand).slice(1));
		}
	}


	function isInvited(msg) {
		return msg.new_chat_member &&
			msg.new_chat_member.username === config.protocols.telegram.username;
	}

	function processInvited(msg) {
		db.registerChat(getChatId(msg), (err) => {
			if (err) {
				return botCommands.sendError(msg, err);
			}
			botCommands.sendStatus(msg);
		});
	}

	function isRemoved(msg) {
		return msg.left_chat_member &&
			msg.left_chat_member.username === config.protocols.telegram.username;
	}

	function processRemoved(msg) {
		db.unregisterChat(getChatId(msg));
	}

	function link(msg, clients) {
		const chatA = clients[0];
		const chatB = clients[1];

		db.linkChats(chatA, chatB, (err) => {
			if (err) {
				return botCommands.sendError(msg, err);
			}
			botCommands.sendLinkStatus(msg, chatA, chatB);
		});
	}

	function unlink(msg, clients) {
		const chatA = clients[0];
		const chatB = clients[1];

		db.unlinkChats(chatA, chatB, (err) => {
			if (err) {
				return botCommands.sendError(msg, err);
			}
			botCommands.sendUnlinkStatus(msg, chatA, chatB);
		});
	}

	function getChatId(msg) {
		return `telegram:${msg.chat.id}`;
	}
}