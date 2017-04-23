const config = require('config');
const router = new require('express').Router();

module.exports = Factory;

const isCommand = new RegExp(`^@${config.protocols.telegram.username}( .*)?`);

function Factory({path, bot, send}) {
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
					return send('protocols.telegram', {chat: 'telegram:' + msg.chat.id, from: {name: msg.from.username}, message: msg.text});
		}
	}

	function onBotCommandMessage(msg, match) {
		const command = (match[1] || '').trim();

		switch (true) {
			case (command === 'status'): return sendStatus(msg);
		}
	}


	function isInvited(msg) {
		return msg.new_chat_member &&
			msg.new_chat_member.username === config.protocols.telegram.username;
	}

	function processInvited(msg) {
		sendStatus(msg);
	}

	function isRemoved(msg) {
		return msg.left_chat_member &&
			msg.left_chat_member.username === config.protocols.telegram.username;
	}

	function processRemoved(msg) {
		console.log('todo: clean');
	}

	function getChatId(chat) {
		return `telegram:${chat.id}`;
	}

	function sendStatus(msg) {
		send('protocols.telegram', {to: msg.chat.id, message: `chat room registered as ${getChatId(msg.chat)}`});
	}
}