const assert = require('assert');

module.exports = Factory;


function Factory({redisClient, amqpConnection, protocol} = {}) {
	assert(!!amqpConnection, 'amqpConnection must be defined');
	assert(!!protocol, 'protocol must be defined');

	amqpConnection.createChannel((err, channel) => {
		const queryName = 'protocols.' + protocol.getName();

		channel.assertQueue(queryName, {durable: false});

		channel.consume(queryName, (msg) => {
			console.log(" [x] Received %s", msg.content.toString());

			const message = JSON.parse(msg.content);

			if (message.chat) {
				redisClient.smembers(message.chat + ':link', (err, res) => {
					if (err) {
						return console.error(err);
					}

					res.forEach((val) => {
						const parts = val.split(':');

						if (parts[0] === protocol.getName()) {
							const m = Object.assign(message, {to: parts[1]});
							protocol.send(m);
						} else {
							const m = Object.assign(message, {to: parts[1], chat: undefined});
							channel.sendToQueue('protocols.' + parts[0], new Buffer(JSON.stringify(m)));
						}
					});
				});
			} else {
				protocol.send(message);
			}
		}, {noAck: true});
	});


	return {
		register,
		link
	};


	function register(chat, callback) {
		redisClient.get(chat, (err, res) => {
			if (err) {
				return callback(err);
			}

			if (res[0]) {
				return callback(new Error(`${chat} already registered`));
			}

			redisClient.set(chat, true, (err, res) => {
				if (err) {
					return callback(err);
				}

				callback(null);
			});
		});
	}

	function link(chatA, chatB, callback) {
		redisClient.sadd(chatA + ':link', chatB, true, (err, res) => {
			if (err) {
				return callback(err);
			}

			redisClient.sadd(chatB + ':link', chatA, true, (err, res) => {
				if (err) {
					return callback(err);
				}

				callback(null);
			});
		});
	}
}