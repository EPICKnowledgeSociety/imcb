const assert = require('assert');
const configHelper = require('../utils/configHelper');

module.exports = Factory;


function Factory({db, amqpConnection, protocol} = {}) {
	assert(!!amqpConnection, 'amqpConnection must be defined');
	assert(!!protocol, 'protocol must be defined');

	amqpConnection.createChannel((err, channel) => {
		const queryName = 'protocols.' + protocol.getName();

		channel.assertQueue(queryName, {durable: !configHelper.isAmpqLiteMode()});
		channel.consume(queryName, (msg) => {
			console.log('received', msg.content.toString());

			const message = JSON.parse(msg.content);

			if (message.broadcast) {
				db.linkedChats(message.to, (err, links) => {
					if (err) {
						const chatId = getChatId(message.to);
						protocol.send({to: chatId, message: err.toString()});

						return console.error(err);
					}

					links.forEach((val) => {
						const chatProtocol = getChatProtocol(val);
						const chatId = getChatId(val);

						if (chatProtocol === protocol.getName()) {
							const m = Object.assign(message, {to: chatId});
							protocol.send(m);
						} else {
							const m = Object.assign(message, {to: chatId, broadcast: undefined});
							channel.sendToQueue('protocols.' + chatProtocol, new Buffer(JSON.stringify(m)));
						}
					});

				});
			} else {
				protocol.send(message);
			}
		}, {noAck: true});
	});
}

function getChatProtocol(to) {
	return to.split(':')[0];
}
function getChatId(to) {
	return to.split(':')[1];
}