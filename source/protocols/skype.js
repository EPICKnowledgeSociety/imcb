const config = require('config');
const BotBuilder = require('botbuilder');

module.exports = Factory;


const isTelegramSticker = new RegExp(`^${config.hosting.url}/api/telegram/stickers/`);


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

		const address = {
			conversation: {
				isGroup: true,
				id: `19:${to}@thread.skype`
			},
			serviceUrl: 'https://smba.trafficmanager.net/apis/',
			useAuth: true
		};

		const msg = new BotBuilder.Message().address(address);

		if (isTelegramSticker.test(message)) {
			msg.addAttachment(
				new BotBuilder.ThumbnailCard()
					.title(from && from.name)
					.images([new BotBuilder.CardImage().url(message)])
			);
		} else {
			msg.text(from && from.name ? `**${from.name}**:\n${message}` : message);
		}

		bot.send(msg, callback);
	}
}
