const config = require('config');
const router = new require('express').Router();

module.exports = Factory;

const isCommand = new RegExp(`^@${config.protocols.telegram.username}( .*)?`);
const isLinkCommand = new RegExp('^link (.*) (.*)');
const isUnlinkCommand = new RegExp('^unlink (.*) (.*)');

function Factory({path, bot, send, commands}) {
	bot.on('message', onBotMessage);
	bot.onText(isCommand, onBotCommandMessage);
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
				if (!isCommand.test(msg.text))
					return send({
						broadcast: true,
						to: 'telegram:' + msg.chat.id,
						from: {name: msg.from.username},
						message: msg.text
					});
		}
	}

	function onBotCommandMessage(msg, match) {
		const command = (match[1] || '').trim();

		switch (true) {
			case (command === 'status'):
				return sendStatus(msg);
			case (isLinkCommand.test(command)):
				return link(msg, command.match(isLinkCommand).slice(1));
			case (isUnlinkCommand.test(command)):
				return unlink(msg, command.match(isUnlinkCommand).slice(1));
		}
	}


	function isInvited(msg) {
		return msg.new_chat_member &&
			msg.new_chat_member.username === config.protocols.telegram.username;
	}

	function processInvited(msg) {
		commands.register(getChatId(msg.chat), (err) => {
			if (err) {
				console.error(err);
				return sendError(msg, err);
			}

			console.log(`${getChatId(msg.chat)} chat registered`);
			sendStatus(msg);
		});
	}

	function isRemoved(msg) {
		return msg.left_chat_member &&
			msg.left_chat_member.username === config.protocols.telegram.username;
	}

	function processRemoved(msg) {
		commands.unregister(getChatId(msg.chat), (err) => {
			if (err) {
				return console.error(err);
			}

			console.log(`${getChatId(msg.chat)} chat unregistered`);
		});
	}

	function link(msg, clients) {
		const chatA = clients[0];
		const chatB = clients[1];

		commands.link(chatA, chatB, (err) => {
			if (err) {
				console.error(err);
				return sendError(msg, err);
			}

			console.log(`chats ${chatA} and ${chatB} linked`);
			sendLinkStatus(msg, chatA, chatB);
		});
	}

	function unlink(msg, clients) {
		const chatA = clients[0];
		const chatB = clients[1];

		commands.unlink(chatA, chatB, (err) => {
			if (err) {
				console.error(err);
				return sendError(msg, err);
			}

			console.log(`chats ${chatA} and ${chatB} are unlinked`);
			sendUnlinkStatus(msg, chatA, chatB);
		});
	}


	function getChatId(chat) {
		return `telegram:${chat.id}`;
	}

	function sendStatus(msg) {
		send({to: msg.chat.id, message: `chat registered as ${getChatId(msg.chat)}`});
	}

	function sendLinkStatus(msg, chatA, chatB) {
		send({to: msg.chat.id, message: `chats ${chatA} and ${chatB} are linked`});
	}

	function sendUnlinkStatus(msg, chatA, chatB) {
		send({to: msg.chat.id, message: `chats ${chatA} and ${chatB} are unlinked`});
	}

	function sendError(msg, error) {
		send({to: msg.chat.id, message: `Oops! Error...\n ${error.toString()}`});
	}

}