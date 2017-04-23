const assert = require('assert');
const config = require('config');
const BotBuilder = require('botbuilder');

module.exports = Factory;

function Factory() {
	const connector = new BotBuilder.ChatConnector({
		appId: config.protocols.skype.appId,
		appPassword: config.protocols.skype.appPassword
	});
	const bot = new BotBuilder.UniversalBot(connector);

	bot._connector = connector;

	return {
		getName,
		send,

		bot
	};

	function getName() {
		return 'skype';
	}

	function send({from, to, message} = {}, callback) {
		const messageForSend = from && from.name ? `${from.name}:\n${message}` : message;

		const address = {
			conversation: {
				isGroup: true,
				id: `19:${to}@thread.skype`
			},
			serviceUrl: 'https://smba.trafficmanager.net/apis/',
			useAuth: true
		};

		const msg = new BotBuilder.Message()
			.address(address)
			.text(messageForSend);

		bot.send(msg, callback);
	}
}
