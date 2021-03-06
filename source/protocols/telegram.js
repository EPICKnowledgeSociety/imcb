const config = require('config');
const Bot = require('node-telegram-bot-api');

module.exports = Factory;

function Factory() {
	const bot = new Bot(config.protocols.telegram.token);

	return {
		getName,
		send,

		bot
	};

	function getName() {
		return 'telegram';
	}

	function send({from, to, message} = {}, callback) {
		const messageForSend = from && from.name ? `${from.name}\n${message}` : message;
		bot.sendMessage(to, messageForSend);

		if (typeof callback === 'function') {
			process.nextTick(callback);
		}
	}
}