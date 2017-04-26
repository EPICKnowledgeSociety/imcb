const assert = require('assert');
const config = require('config');

module.exports = Factory;

function Factory(protocol, send, getChatId) {
	assert(config.protocols[protocol].botName, `config.protocols.${protocol}.botName must be defined`);

	const isCommand = new RegExp(`^@${config.protocols[protocol].botName}( .*)?`);
	const isLinkCommand = new RegExp('^link (.*) (.*)');
	const isUnlinkCommand = new RegExp('^unlink (.*) (.*)');

	return {
		isCommand,
		isLinkCommand,
		isUnlinkCommand,

		send: send.bind(null, protocol),

		sendStatus: (msg) =>
			send({to: getChatId(msg), message: `chat registered as ${getChatId(msg)}`}),

		sendLinkStatus: (msg, chatA, chatB) =>
			send({to: getChatId(msg), message: `chats ${chatA} and ${chatB} are linked`}),

		sendUnlinkStatus: (msg, chatA, chatB) =>
			send({to: getChatId(msg), message: `chats ${chatA} and ${chatB} are unlinked`}),

		sendError: (msg, error) =>
			send({to: getChatId(msg), message: `Oops! Error...\n ${error.toString()}`})
	};
}