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

	function registerChat(chat, callback = noop) {
		redisClient
			.exists(getKey(chat), (err, res) => {
				if (err) {
					console.error('registerChat', err);
					return callback(err);
				}

				if (res) {
					err = new Error(`${chat} already registered`);
					console.error('registerChat', err);
					return callback(err);
				}

				redisClient
					.set(getKey(chat), true, (err) => {
						if (err) {
							console.error('registerChat', err);
							return callback(err);
						}

						console.log(`${chat} chat registered`);
						callback();
					});
			});
	}

	function unregisterChat(chat, callback = noop) {
		redisClient
			.exists(getKey(chat), (err, res) => {
				if (err) {
					console.error('unregisterChat', err);
					return callback(err);
				}

				if (!res) {
					err = new Error(`${chat} not registered`);
					console.error('unregisterChat', err);
					return callback(err);
				}

				redisClient
					.multi()
					.smembers(getLinkKey(chat), (err, res) => {
						if (err) {
							console.error('unregisterChat', err);
							return callback(err);
						}

						const commands = res
							.map((res) => ['srem', getLinkKey(res), chat]);

						redisClient
							.multi(commands)
							.exec((err) => {
								if (err) {
									console.error('unregisterChat', err);
									return callback(err);
								}

								console.log(`${chat} chat unregistered`);
								callback();
							});
					})
					.del(getKeys(chat))
					.exec();
			});
	}

	function linkChats(chatA, chatB, callback = noop) {
		redisClient
			.multi()
			.exists(getKey(chatA))
			.exists(getKey(chatB))
			.exec((err, res) => {
				if (err) {
					console.error('linkChats', err);
					return callback(err);
				}

				if (!res[0] || !res[1]) {
					err = new Error(`${res[0] ? chatB : chatA} not registered`);
					console.error('linkChats', err);
					return callback(err);
				}

				redisClient
					.multi()
					.sadd(getLinkKey(chatA), chatB)
					.sadd(getLinkKey(chatB), chatA)
					.exec((err, res) => {
						if (err) {
							console.error('linkChats', err);
							return callback(err);
						}

						if (res[0] && res[1]) {
							console.log(`chats ${chatA} and ${chatB} are linked`);
							return callback();
						} else if (!res[0] && !res[1]) {
							console.log(`chats ${chatA} and ${chatB} are already linked`);
							return callback();
						}

						err = new Error(`error linking ${res[0] ? chatA : chatB} with ${res[0] ? chatB : chatA}`);
						console.error('linkChats', err);
						return callback(err);
					});
			});
	}

	function unlinkChats(chatA, chatB, callback = noop) {
		redisClient
			.multi()
			.exists(getKey(chatA))
			.exists(getKey(chatB))
			.exec((err, res) => {
				if (err) {
					console.error('unlinkChats', err);
					return callback(err);
				}

				if (!res[0] || !res[1]) {
					err = new Error(`${res[0] ? chatB : chatA} not registered`);
					console.error('unlinkChats', err);
					return callback(err);
				}

				redisClient
					.multi()
					.srem(getLinkKey(chatA), chatB)
					.srem(getLinkKey(chatB), chatA)
					.exec((err, res) => {
						if (err) {
							console.error('unlinkChats', err);
							return callback(err);
						}

						if (res[0] && res[1]) {
							console.log(`chats ${chatA} and ${chatB} are unlinked`);
							return callback();
						} else if (!res[0] && !res[1]) {
							console.log(`chats ${chatA} and ${chatB} are not linked`);
							return callback();
						}

						err = new Error(`${res[0] ? chatA : chatB} not linked with ${res[0] ? chatB : chatA}`);
						console.error('unlinkChats', err);
						return callback(err);
					});
			});
	}

	function linkedChats(chat, callback = noop) {
		redisClient
			.exists(getKey(chat), (err, res) => {
				if (err) {
					console.error('linkedChats', err);
					return callback(err);
				}

				if (!res) {
					err = new Error(`${chat} not registered`);
					console.error('linkedChats', err);
					return callback();
				}

				redisClient
					.smembers(getLinkKey(chat), (err, res) => {
						if (err) {
							console.error('linkedChats', err);
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

function noop() {
}