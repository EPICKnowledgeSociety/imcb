const assert = require('assert');

module.exports = Factory;


function Factory({redisClient}) {
	assert(redisClient, 'redisClient should be defined');

	return {
		registerChat,
		unregisterChat,
		linkChats,
		unlinkChats,
		linkedChats
	};

	function registerChat(chat, callback) {
		redisClient
			.exists(getKey(chat), (err, res) => {
				if (err) {
					return callback(err);
				}

				if (res) {
					return callback(new Error(`${chat} already registered`));
				}

				redisClient
					.set(getKey(chat), true, (err) => {
						if (err) {
							return callback(err);
						}

						callback();
					});
			});
	}

	function unregisterChat(chat, callback) {
		redisClient
			.exists(getKey(chat), (err, res) => {
				if (err) {
					return callback(err);
				}

				if (!res) {
					return callback(new Error(`${chat} not registered`));
				}

				redisClient
					.multi()
					.smembers(getLinkKey(chat), (err, res) => {
						if (err) {
							return callback(err);
						}

						const commands = res
							.map((res) => ['srem', getLinkKey(res), chat]);

						redisClient
							.multi(commands)
							.exec((err) => callback(err));
					})
					.del(getKeys(chat))
					.exec();
			});
	}

	function linkChats(chatA, chatB, callback) {
		redisClient
			.multi()
			.exists(getKey(chatA))
			.exists(getKey(chatB))
			.exec((err, res) => {
				if (err) {
					return callback(err);
				}

				if (!res[0] || !res[1]) {
					return callback(new Error(`${res[0] ? chatA : chatB} not registered`));
				}

				redisClient
					.multi()
					.sadd(getLinkKey(chatA), chatB)
					.sadd(getLinkKey(chatB), chatA)
					.exec((err, res) => {
						if (err) {
							return callback(err);
						}

						if (res[0] && res[1]) {
							return callback();
						} else if (!res[0] && !res[1]) {
							return callback(new Error('link failed'));
						}

						return callback(new Error(`${res[0] ? chatA : chatB} not linked with ${res[0] ? chatB : chatA}`));
					});
			});
	}

	function unlinkChats(chatA, chatB, callback) {
		redisClient
			.multi()
			.exists(getKey(chatA))
			.exists(getKey(chatB))
			.exec((err, res) => {
				if (err) {
					return callback(err);
				}

				if (!res[0] || !res[1]) {
					return callback(new Error(`${res[0] ? chatA : chatB} not registered`));
				}

				redisClient
					.multi()
					.srem(getLinkKey(chatA), chatB)
					.srem(getLinkKey(chatB), chatA)
					.exec((err, res) => {
						if (err) {
							return callback(err);
						}

						if (res[0] && res[1]) {
							return callback();
						} else if (!res[0] && !res[1]) {
							return callback(new Error('unlink failed'));
						}

						return callback(new Error(`${res[0] ? chatA : chatB} not linked with ${res[0] ? chatB : chatA}`));
					});
			});
	}

	function linkedChats(chat, callback) {
		redisClient
			.exists(getKey(chat), (err, res) => {
				if (err) {
					return callback(err);
				}

				if (!res) {
					return callback(new Error(`${chat} not registered`));
				}

				redisClient
					.smembers(getLinkKey(chat), (err, res) => {
						if (err) {
							return callback(err);
						}
						callback(null, res);
					});
			});
	}
}

function getKey(chat) {
	return chat;
}

function getLinkKey(chat) {
	return chat + ':link';
}

function getKeys(chat) {
	const suffixes = ['', ':link'];
	return suffixes.map((suffix) => chat + suffix);
}
