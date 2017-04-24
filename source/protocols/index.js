const assert = require('assert');

module.exports = Factory;


function Factory({db, amqpConnection, protocol} = {}) {
	assert(!!amqpConnection, 'amqpConnection must be defined');
	assert(!!protocol, 'protocol must be defined');

	amqpConnection.createChannel((err, channel) => {
		const queryName = 'protocols.' + protocol.getName();

		channel.assertQueue(queryName, {durable: true});
		channel.consume(queryName, (msg) => {
			console.log('Received %s', msg.content.toString());

			const message = JSON.parse(msg.content);

			if (message.broadcast) {
				db.linkedChats(message.to, (err, links) => {
					if (err) {
						return console.error(err);
					}

					links.forEach((val) => {
						const parts = val.split(':');

						if (parts[0] === protocol.getName()) {
							const m = Object.assign(message, {to: parts[1]});
							protocol.send(m);
						} else {
							const m = Object.assign(message, {to: parts[1], broadcast: undefined});
							channel.sendToQueue('protocols.' + parts[0], new Buffer(JSON.stringify(m)));
						}
					});

				});
			} else {
				protocol.send(message);
			}
		}, {noAck: true});
	});
}