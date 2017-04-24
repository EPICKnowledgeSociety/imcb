const config = require('config');
const router = new require('express').Router();

module.exports = Factory;

function Factory({path, bot, commands, helperFactory}) {
	const helper = helperFactory(getChatId);

	bot.on('message', onBotMessage);
	bot.onText(helperFactory.isCommand, onBotCommandMessage);
	bot.setWebHook(`${config.hosting.url}${path}/telegram/bot${config.protocols.telegram.token}`);

	router.post(`/telegram/bot${config.protocols.telegram.token}`, onPost);

	return router;

	function onPost(req, res) {
		req.bots.telegram.processUpdate(req.body);
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
				if (!helperFactory.isCommand.test(msg.text))
					return helperFactory.send({
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
				return helper.sendStatus(msg);
			case (helperFactory.isLinkCommand.test(command)):
				return link(msg, command.match(helperFactory.isLinkCommand).slice(1));
			case (helperFactory.isUnlinkCommand.test(command)):
				return unlink(msg, command.match(helperFactory.isUnlinkCommand).slice(1));
		}
	}


	function isInvited(msg) {
		return msg.new_chat_member &&
			msg.new_chat_member.username === config.protocols.telegram.username;
	}

	function processInvited(msg) {
		commands.register(getChatId(msg), (err) => {
			if (err) {
				return helper.sendError(msg, err);
			}
			helper.sendStatus(msg);
		});
	}

	function isRemoved(msg) {
		return msg.left_chat_member &&
			msg.left_chat_member.username === config.protocols.telegram.username;
	}

	function processRemoved(msg) {
		commands.unregister(getChatId(msg));
	}

	function link(msg, clients) {
		const chatA = clients[0];
		const chatB = clients[1];

		commands.link(chatA, chatB, (err) => {
			if (err) {
				return helper.sendError(msg, err);
			}
			helper.sendLinkStatus(msg, chatA, chatB);
		});
	}

	function unlink(msg, clients) {
		const chatA = clients[0];
		const chatB = clients[1];

		commands.unlink(chatA, chatB, (err) => {
			if (err) {
				return helper.sendError(msg, err);
			}
			helper.sendUnlinkStatus(msg, chatA, chatB);
		});
	}

	function getChatId(msg) {
		return `telegram:${msg.chat.id}`;
	}
}