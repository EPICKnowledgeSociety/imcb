const assert = require('assert');
const config = require('config');

module.exports = Factory;

function Factory(db, protocol, send, getChatId, getChatMessageText) {
	assert(config.protocols[protocol].botName, `config.protocols.${protocol}.botName must be defined`);

	const isCommand = new RegExp(`^@${config.protocols[protocol].botName}( (.*))?`);

	const debugRegisterCommandMatcher = new RegExp('^register$');
	const debugUnregisterCommandMatcher = new RegExp('^unregister$');
	const chatStatusCommandMatcher = new RegExp('^status$');
	const linkChatsCommandMatcher = new RegExp('^link (.*)$');
	const unlinkChatsCommandMatcher = new RegExp('^unlink (.*)$');

	send = send.bind(null, protocol);

	return {
		process,

		registerChat: (message) => registerChat(message).send(),
		unregisterChat: (message) => unregisterChat(message).exec(),

		send,
		sendError
	};


	function process(message, onCommand, onNotCommand) {
		assert(typeof onCommand === 'function', 'onCommand must be function');
		assert(typeof onNotCommand === 'function', 'onNotCommand must be function');

		const messageText = getChatMessageText(message);
		const match = messageText.match(isCommand);
		if (!match) {
			return onNotCommand(message);
		}

		const commandText = match[2];

		switch (true) {
			case config.isDebug && debugRegisterCommandMatcher.test(commandText):
				return registerChat(message).send();
			case config.isDebug && debugUnregisterCommandMatcher.test(commandText):
				return unregisterChat(message).send();
			case chatStatusCommandMatcher.test(commandText):
				return getChatStatus(message).send();
			case linkChatsCommandMatcher.test(commandText):
				return linkChats(message, commandText).send();
			case unlinkChatsCommandMatcher.test(commandText):
				return unlinkChats(message, commandText).send();
			default:
				return onCommand(messageText) || onNotCommand(message);
		}
	}

	function SendWrapper(message, fn) {
		return {
			send: () => fn((err, response) => {
				if (err) {
					return sendError(message, err);
				}
				if (response === undefined) {
					return;
				}

				send({to: getChatId(message), message: response});
			}),
			exec: () => fn((err, response) => {
				if (err) {
					return console.error(err);
				}
				if (response === undefined) {
					return;
				}

				console.log(JSON.stringify(response));
			})
		};
	}

	function registerChat(message) {
		return new SendWrapper(message, (callback) => {
			const chatId = getChatId(message);

			db.registerChat(chatId, (err) => {
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	}

	function unregisterChat(message) {
		return new SendWrapper(message, (callback) => {
			const chatId = getChatId(message);

			db.unregisterChat(chatId, (err) => {
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	}

	function linkChats(message, commandText) {
		return new SendWrapper(message, (callback) => {
			const match = commandText.match(linkChatsCommandMatcher);
			const chatA = getChatId(message);
			const chatB = match[1];

			db.linkChats(chatA, chatB, (err) => {
				if (err) {
					return callback(err);
				}
				callback(null, `chats ${chatA} and ${chatB} are linked now`);
			});
		});
	}

	function unlinkChats(message, commandText) {
		return new SendWrapper(message, (callback) => {
			const match = commandText.match(unlinkChatsCommandMatcher);
			const chatA = getChatId(message);
			const chatB = match[1];

			db.unlinkChats(chatA, chatB, (err) => {
				if (err) {
					return callback(err);
				}
				callback(null, `chats ${chatA} and ${chatB} are unlinked now`);
			});
		});
	}

	function getChatStatus(message) {
		return new SendWrapper(message, (callback) => {
			const chatId = getChatId(message);

			db.linkedChats(chatId, (err, links) => {
				if (err) {
					return callback(err);
				}

				let responseMessage = `chat registered as ${chatId}`;

				if (links.length) {
					responseMessage += ' with following linked chats:\n';
					responseMessage += links.map((link) => `  ${link}`).join('\n');
				} else {
					responseMessage += ' with no linked chats';
				}

				callback(null, responseMessage);
			});
		});
	}


	function sendError(message, error) {
		send({to: getChatId(message), message: `Oops!\n ${error.toString()}`});
	}
}