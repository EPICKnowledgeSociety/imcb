const config = require('config');
const redis = require('redis');
const amqp = require('amqplib/callback_api');
const express = require('express');
const bodyParser = require('body-parser');

const protocols = require('./protocols');

const telegramProtocol = require('./chat/telegram')();
const skypeProtocol = require('./chat/skype')();

const app = express();

app.use(bodyParser.json());


amqp.connect(config.amqp.url, (err, amqpConnection) => {
	const redisClient = redis.createClient(config.redis.url);
	const telegramServer = require('./chat/index')({redisClient, amqpConnection, protocol: telegramProtocol});
	const skypeServer = require('./chat/index')({redisClient, amqpConnection, protocol: skypeProtocol});

	run({amqpConnection, redisClient});
});


function run({redisClient, amqpConnection}) {
	app.use((req, res, next) => {
		req.bots = {
			telegram: telegramProtocol.bot
		};
		req.redis = redisClient;
		req.amqp = amqpConnection;
		next();
	});

	app.get('/', (req, res) => {
		res.send('IMCB');
	});

	amqpConnection.createChannel((err, channel) => {
		channel.assertQueue('protocols.telegram', {durable: false});
		channel.assertQueue('protocols.skype', {durable: false});

		app.use('/api', protocols.skype({path: '/api', redisClient, amqpConnection, bot: skypeProtocol.bot, send}));
		app.use('/api', protocols.telegram({path: '/api', redisClient, amqpConnection, bot: telegramProtocol.bot, send}));
		//app.use('/api', protocols.facebook);

		app.listen(config.hosting.port, () => {
			console.log(`imcb started at ${config.hosting.port} port!`);
		});

		function send(queryName, message) {
			return channel.sendToQueue(queryName, new Buffer(JSON.stringify(message)));
		}
	});

}