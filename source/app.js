const config = require('config');
const redis = require('redis');
const amqp = require('amqplib/callback_api');
const express = require('express');
const bodyParser = require('body-parser');

const routes = require('./routes');

const redisClient = redis.createClient(config.redis.url);
const db = require('./db')({redisClient});

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
			send: send.bind(this, 'skype')
		}));
		app.use('/api', routes.telegram({
			path: '/api',
			bot: protocols.telegram.bot,
			send: send.bind(this, 'telegram'),
			commands: {
				register: db.registerChat,
				unregister: db.unregisterChat,
				link: db.linkChats,
				unlink: db.unlinkChats,
				links: db.linkedChats
			}
		}));

		app.listen(config.hosting.port, () => {
			console.log(`imcb started at ${config.hosting.port} port!`);
		});


		function send(queryName, message) {
			return channel.sendToQueue(`protocols.${queryName}`, new Buffer(JSON.stringify(message)));
		}
	});
}