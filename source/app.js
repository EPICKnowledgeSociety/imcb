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

		app.use('/api', protocols.skype({path: '/api', amqpConnection, bot: skypeProtocol.bot, send}));
		app.use('/api', protocols.telegram({path: '/api', amqpConnection, bot: telegramProtocol.bot, send}));
		//app.use('/api', protocols.facebook);

		app.listen(config.hosting.port, () => {
			console.log(`imcb started at ${config.hosting.port} port!`);
		});

		function send(queryName, message) {
			return channel.sendToQueue(queryName, new Buffer(JSON.stringify(message)));
		}
	});

}


//skype: "id":"1492970407421","channelId":"skype"
//telegram: "chat":{"id":-155914777

//skype address
const skypeAddress = {
		"text": "@imcb hello",
		"type": "message",
		"timestamp": "2017-04-23T19:26:55.195Z",
		"localTimestamp": "2017-04-23T22:26:55.195+03:00",
		"entities": [
			{
				"mentioned": {
					"id": "28:f14f29e0-17de-431f-ad98-711e33366ce2"
				},
				"text": "<at id=\"28:f14f29e0-17de-431f-ad98-711e33366ce2\">@imcb</at>",
				"type": "mention"
			},
			{
				"locale": "en-US",
				"country": "UA",
				"platform": "Windows",
				"type": "clientInfo"
			}
		],
		"sourceEvent": {
			"text": "<at id=\"28:f14f29e0-17de-431f-ad98-711e33366ce2\">@imcb</at> hello"
		},
		"attachments": [],
		"address": {
			"id": "1492975615192",
			"channelId": "skype",
			"user": {
				"id": "29:1yUkKVMOFggbhK7xC9Rah6FMZueHRIHhBWSYQsdd6rQA",
				"name": "Alexey Malyarov"
			},
			"conversation": {
				"isGroup": true,
				"id": "19:205182d3e38a4e17a83e9505a3d7184b@thread.skype"
			},
			"bot": {
				"id": "28:f14f29e0-17de-431f-ad98-711e33366ce2",
				"name": "imcb"
			},
			"serviceUrl": "https://smba.trafficmanager.net/apis/",
			"useAuth": true
		},
		"source": "skype",
		"agent": "botbuilder",
		"user": {
			"id": "29:1yUkKVMOFggbhK7xC9Rah6FMZueHRIHhBWSYQsdd6rQA",
			"name": "Alexey Malyarov"
		}
	};
