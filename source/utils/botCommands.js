const assert = require('assert');
const config = require('config');

module.exports = Factory;

function Factory(protocol, send, getChatId, getChatMessageText) {
	assert(config.protocols[protocol].botName, `config.protocols.${protocol}.botName must be defined`);

	const isCommand = new RegExp(`^@${config.protocols[protocol].botName}( (.*))?`);
	const isStatusCommand = new RegExp('^status');
	const isLinkCommand = new RegExp('^link (.*) (.*)');
	const isUnlinkCommand = new RegExp('^unlink (.*) (.*)');

	send = send.bind(null, protocol);

	return {
		process,
		send,

		sendStatus,
		sendLinkStatus,
		sendUnlinkStatus,
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
			case isStatusCommand.test(commandText):
				return sendStatus(message);
			//case isLinkCommand.test(commandText):
			//	return;
			default:
				return onCommand(messageText) || onNotCommand(message);
		}
	}


	function sendStatus(message) {
		send({to: getChatId(message), message: `chat registered as ${getChatId(message)}`});
	}

	function sendLinkStatus(message, chatA, chatB) {
		send({to: getChatId(message), message: `chats ${chatA} and ${chatB} are linked`});
	}

	function sendUnlinkStatus(message, chatA, chatB) {
		send({to: getChatId(message), message: `chats ${chatA} and ${chatB} are unlinked`});
	}

	function sendError(msg, error) {
		send({to: getChatId(msg), message: `Oops! Error...\n ${error.toString()}`});
	}
}