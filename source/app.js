const assert = require('assert');
const config = require('config');
const redis = require('redis');
const amqp = require('amqplib/callback_api');
const express = require('express');
const bodyParser = require('body-parser');

const routes = require('./routes');

const redisClient = redis.createClient(config.redis.url);
const db = require('./db')({redisClient});
const commands = {
	register: db.registerChat,
	unregister: db.unregisterChat,
	link: db.linkChats,
	unlink: db.unlinkChats,
	links: db.linkedChats
};

const protocols = {
	telegram: require('./protocols/telegram')(),
	skype: require('./protocols/skype')()
};

const app = express();


amqp.connect(config.amqp.url, (err, amqpConnection) => {
	require('./protocols/index')({db, amqpConnection, protocol: protocols.telegram});
	require('./protocols/index')({db, amqpConnection, protocol: protocols.skype});

	run({amqpConnection});
});

function run({amqpConnection}) {
	app.use(bodyParser.json());
	app.use('/', routes.index);

	amqpConnection.createChannel((err, channel) => {
		channel.assertQueue('protocols.telegram', {durable: true});
		channel.assertQueue('protocols.skype', {durable: true});

		app.use('/api', routes.skype({
			path: '/api',
			bot: protocols.skype.bot,
			commands,
			helperFactory: helperFactory.bind(null, 'skype', send)
		}));
		app.use('/api', routes.telegram({
			path: '/api',
			bot: protocols.telegram.bot,
			commands,
			helperFactory: helperFactory.bind(null, 'telegram', send)
		}));

		app.listen(config.hosting.port, () => {
			console.log(`imcb started at ${config.hosting.port} port!`);
		});

		function send(queryName, message) {
			return channel.sendToQueue(`protocols.${queryName}`, new Buffer(JSON.stringify(message)));
		}
	});
}



function helperFactory(protocol, send, getChatId) {
	assert(config.protocols[protocol].name, `config.protocols.${protocol}.name must be defined`);

	const isCommand = new RegExp(`^@${config.protocols[protocol].name}( .*)?`);
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