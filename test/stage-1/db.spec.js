const dbFactory = require('../../source/db');

const redis = require('redis');
const redisClient = redis.createClient();

const db = dbFactory({redisClient});

const chat1 = 'telegram:-2626256';
const chat2 = 'telegram:-3425345';
const chat3 = 'telegram:-7834562';


describe('db', () => {

	describe('registerChat', () => {

		describe('in empty db', () => {
			let chat1Keys;

			before_ResetRedis();
			before(`register ${chat1} chat`, (done) => db.registerChat(chat1, (err) => done(err)));
			before(`search ${chat1} keys`, (done) => {
				redisClient.keys(`${chat1}*`, (err, res) => {
					if (err) {
						return done(err);
					}

					chat1Keys = res;
					done();
				});
			});

			it(`should create "${chat1}" key`, () => {
				expect(chat1Keys).to.be.eqls([chat1]);
			});
		});

		describe('in not empty db', () => {

			describe('for new', () => {
				let chat1Keys;

				before_ResetRedis();
				before(`register ${chat2} chat`, (done) => db.registerChat(chat2, (err) => done(err)));
				before(`register ${chat1} chat`, (done) => db.registerChat(chat1, (err) => done(err)));
				before_getRedisKeys(chat1, (keys) => chat1Keys = keys);

				it(`should create "${chat1}" key`, () => {
					expect(chat1Keys).to.be.eqls([chat1]);
				});
			});

			describe('for duplicate', () => {
				let error;

				before_ResetRedis();
				before(`register ${chat1} chat`, (done) => db.registerChat(chat1, (err) => done(err)));
				before(`register ${chat1} chat`, (done) => db.registerChat(chat1, (err) => {
					error = err;
					done();
				}));

				it(`should rise duplicate's error`, () => {
					expect(error).to.be.an('error').to.have.property('message', `${chat1} already registered`);
				});
			});

		});

	});

	describe('linkChats', () => {

		describe('unique', () => {

			let chat1Links;
			let chat2Links;
			let chat3Links;

			before_ResetRedis();
			before(`register ${chat1} chat`, (done) => db.registerChat(chat1, (err) => done(err)));
			before(`register ${chat2} chat`, (done) => db.registerChat(chat2, (err) => done(err)));
			before(`register ${chat3} chat`, (done) => db.registerChat(chat3, (err) => done(err)));
			before(`link ${chat1} and ${chat2} chat`, (done) => db.linkChats(chat1, chat2, (err) => done(err)));
			before(`link ${chat2} and ${chat3} chat`, (done) => db.linkChats(chat2, chat3, (err) => done(err)));
			before_getRedisLinks(chat1, (res) => chat1Links = res);
			before_getRedisLinks(chat2, (res) => chat2Links = res);
			before_getRedisLinks(chat3, (res) => chat3Links = res);

			it(`"${chat1}" link set should contain "${chat2}" key`, () => {
				expect(chat1Links).to.be.eqls([chat2]);
			});
			it(`"${chat2}" link set should contain ["${chat1}", "${chat3}"] keys`, () => {
				expect(chat2Links).to.be.a('array').with.length(2);
				expect(chat2Links).to.contain(chat1);
				expect(chat2Links).to.contain(chat3);
			});
			it(`"${chat3}" link set should contain "${chat2}" key`, () => {
				expect(chat3Links).to.be.eqls([chat2]);
			});

		});

		describe('duplicates', () => {

			let chat1Links;
			let chat2Links;

			before_ResetRedis();
			before(`register ${chat1} chat`, (done) => db.registerChat(chat1, (err) => done(err)));
			before(`register ${chat2} chat`, (done) => db.registerChat(chat2, (err) => done(err)));
			before(`link ${chat1} and ${chat2} chat`, (done) => db.linkChats(chat1, chat2, (err) => done(err)));
			before(`link ${chat1} and ${chat2} chat`, (done) => db.linkChats(chat1, chat2, (err) => done(err)));
			before_getRedisLinks(chat1, (res) => chat1Links = res);
			before_getRedisLinks(chat2, (res) => chat2Links = res);

			it(`"${chat1}" link set should contain "${chat2}" key`, () => {
				expect(chat1Links).to.be.eqls([chat2]);
			});

			it(`"${chat2}" link set should contain "${chat1}" key`, () => {
				expect(chat2Links).to.be.eqls([chat1]);
			});

		});

		describe('not existing', () => {

			describe('chat1', () => {

				let error;

				before_ResetRedis();
				before(`register ${chat2} chat`, (done) => db.registerChat(chat2, (err) => done(err)));
				before(`link ${chat1} and ${chat2} chat`, (done) => db.linkChats(chat1, chat2, (err) => {
					error = err;
					done();
				}));

				it('should return error', () => {
					expect(error).to.be.an('error').to.have.property('message', `${chat1} not registered`);
				});

			});

			describe('chat2', () => {

				let error;

				before_ResetRedis();
				before(`register ${chat1} chat`, (done) => db.registerChat(chat1, (err) => done(err)));
				before(`link ${chat1} and ${chat2} chat`, (done) => db.linkChats(chat1, chat2, (err) => {
					error = err;
					done();
				}));

				it('should return error', () => {
					expect(error).to.be.an('error').to.have.property('message', `${chat2} not registered`);
				});

			});

		});

	});

	describe('linkedChats', () => {

		describe('existing', () => {

			let chat1Links;
			let chat2Links;
			let chat3Links;

			before_ResetRedis();
			before(`register ${chat1} chat`, (done) => db.registerChat(chat1, (err) => done(err)));
			before(`register ${chat2} chat`, (done) => db.registerChat(chat2, (err) => done(err)));
			before(`register ${chat3} chat`, (done) => db.registerChat(chat3, (err) => done(err)));
			before(`link ${chat1} and ${chat2} chat`, (done) => db.linkChats(chat1, chat2, (err) => done(err)));
			before(`link ${chat2} and ${chat3} chat`, (done) => db.linkChats(chat2, chat3, (err) => done(err)));
			before_getLinks(chat1, (res) => chat1Links = res);
			before_getLinks(chat2, (res) => chat2Links = res);
			before_getLinks(chat3, (res) => chat3Links = res);

			it(`"${chat1}" link set should contain "${chat2}" key`, () => {
				expect(chat1Links).to.be.eqls([chat2]);
			});
			it(`"${chat2}" link set should contain ["${chat1}", "${chat3}"] keys`, () => {
				expect(chat2Links).to.be.a('array').with.length(2);
				expect(chat2Links).to.contain(chat1);
				expect(chat2Links).to.contain(chat3);
			});
			it(`"${chat3}" link set should contain "${chat2}" key`, () => {
				expect(chat3Links).to.be.eqls([chat2]);
			});

		});

		describe('not existing', () => {
			let error;

			before_ResetRedis();
			before(`get ${chat1} links`, (done) => {
				db.linkedChats(chat1, (err) => {
					error = err;
					done();
				});
			});

			it('should return error', () => {
				expect(error).to.be.an('error').to.have.property('message', `${chat1} not registered`);
			});

		});

	});

	describe('unlinkChats', () => {

		describe('unique', () => {

			let chat1Links;
			let chat2Links;
			let chat3Links;

			before_ResetRedis();
			before(`register ${chat1} chat`, (done) => db.registerChat(chat1, (err) => done(err)));
			before(`register ${chat2} chat`, (done) => db.registerChat(chat2, (err) => done(err)));
			before(`register ${chat3} chat`, (done) => db.registerChat(chat3, (err) => done(err)));
			before(`link ${chat1} and ${chat2} chat`, (done) => db.linkChats(chat1, chat2, (err) => done(err)));
			before(`link ${chat2} and ${chat3} chat`, (done) => db.linkChats(chat2, chat3, (err) => done(err)));
			before(`link ${chat1} and ${chat2} chat`, (done) => db.unlinkChats(chat1, chat2, (err) => done(err)));
			before_getLinks(chat1, (res) => chat1Links = res);
			before_getLinks(chat2, (res) => chat2Links = res);
			before_getLinks(chat3, (res) => chat3Links = res);

			it(`"${chat1}" link set should be not empty`, () => {
				expect(chat1Links).to.be.eqls([]);
			});
			it(`"${chat2}" link set should contain "${chat3}" key`, () => {
				expect(chat2Links).to.be.eqls([chat3]);
			});
			it(`"${chat3}" link set should contain "${chat2}" key`, () => {
				expect(chat3Links).to.be.eqls([chat2]);
			});

		});

		describe('duplicates', () => {

			let chat1Links;
			let chat2Links;

			before_ResetRedis();
			before(`register ${chat1} chat`, (done) => db.registerChat(chat1, (err) => done(err)));
			before(`register ${chat2} chat`, (done) => db.registerChat(chat2, (err) => done(err)));
			before(`link ${chat1} and ${chat2} chat`, (done) => db.linkChats(chat1, chat2, (err) => done(err)));
			before(`link ${chat1} and ${chat2} chat`, (done) => db.unlinkChats(chat1, chat2, (err) => done(err)));
			before(`link ${chat1} and ${chat2} chat`, (done) => db.unlinkChats(chat1, chat2, (err) => done(err)));
			before_getLinks(chat1, (res) => chat1Links = res);
			before_getLinks(chat2, (res) => chat2Links = res);

			it(`"${chat1}" link set should contain "${chat2}" key`, () => {
				expect(chat1Links).to.be.eqls([]);
			});

			it(`"${chat2}" link set should contain "${chat1}" key`, () => {
				expect(chat2Links).to.be.eqls([]);
			});

		});

		describe('not existing', () => {

			describe('chat1', () => {

				let error;

				before_ResetRedis();
				before(`register ${chat2} chat`, (done) => db.registerChat(chat2, (err) => done(err)));
				before(`link ${chat1} and ${chat2} chat`, (done) => db.unlinkChats(chat1, chat2, (err) => {
					error = err;
					done();
				}));

				it('should return error', () => {
					expect(error).to.be.an('error').to.have.property('message', `${chat1} not registered`);
				});

			});

			describe('chat2', () => {

				let error;

				before_ResetRedis();
				before(`register ${chat1} chat`, (done) => db.registerChat(chat1, (err) => done(err)));
				before(`link ${chat1} and ${chat2} chat`, (done) => db.unlinkChats(chat1, chat2, (err) => {
					error = err;
					done();
				}));

				it('should return error', () => {
					expect(error).to.be.an('error').to.have.property('message', `${chat2} not registered`);
				});

			});

		});

	});

	describe('unregisterChat', () => {

		describe('not existing chat', () => {

			describe('in empty db', () => {
				let error;

				before_ResetRedis();
				before(`register ${chat1} chat`, (done) => db.unregisterChat(chat1, (err) => {
					error = err;
					done();
				}));

				it(`should create "${chat1}" key`, () => {
					expect(error).to.be.an('error').to.have.property('message', `${chat1} not registered`);
				});
			});

			describe('in not empty db', () => {
				let error;

				before_ResetRedis();
				before(`register ${chat2} chat`, (done) => db.registerChat(chat2, (err) => done(err)));
				before(`register ${chat1} chat`, (done) => db.unregisterChat(chat1, (err) => {
					error = err;
					done();
				}));

				it(`should create "${chat1}" key`, () => {
					expect(error).to.be.an('error').to.have.property('message', `${chat1} not registered`);
				});
			});

		});

		describe('existing chat', () => {

			describe('in empty db', () => {
				let chat1Keys;

				before_ResetRedis();
				before(`register ${chat1} chat`, (done) => db.registerChat(chat1, (err) => done(err)));
				before(`unregister ${chat1} chat`, (done) => db.unregisterChat(chat1, (err) => done(err)));
				before_getRedisKeys(chat1, (keys) => chat1Keys = keys);

				it(`should delete "${chat1}" key`, () => {
					expect(chat1Keys).to.be.eqls([]);
				});
			});

			describe('in not empty db', () => {

				describe('not linked chat', () => {

					let chat1Keys;
					let chat2Keys;

					before_ResetRedis();
					before(`register ${chat1} chat`, (done) => db.registerChat(chat1, (err) => done(err)));
					before(`register ${chat2} chat`, (done) => db.registerChat(chat2, (err) => done(err)));
					before(`unregister ${chat1} chat`, (done) => db.unregisterChat(chat1, (err) => done(err)));
					before_getRedisKeys(chat1, (keys) => chat1Keys = keys);
					before_getRedisKeys(chat2, (keys) => chat2Keys = keys);

					it(`should delete "${chat1}" keys`, () => {
						expect(chat1Keys).to.be.eqls([]);
					});

					it(`should leave "${chat2}" keys`, () => {
						expect(chat2Keys).to.be.eqls([chat2]);
					});

				});

				describe('linked chat', () => {

					let chat1Keys;
					let chat2Links;
					let chat3Links;

					before_ResetRedis();
					before(`register ${chat1} chat`, (done) => db.registerChat(chat1, (err) => done(err)));
					before(`register ${chat2} chat`, (done) => db.registerChat(chat2, (err) => done(err)));
					before(`register ${chat3} chat`, (done) => db.registerChat(chat3, (err) => done(err)));
					before(`link ${chat1} & ${chat2} chats`, (done) => db.linkChats(chat1, chat2, (err) => done(err)));
					before(`link ${chat1} & ${chat3} chats`, (done) => db.linkChats(chat1, chat3, (err) => done(err)));
					before(`link ${chat2} & ${chat3} chats`, (done) => db.linkChats(chat2, chat3, (err) => done(err)));
					before(`unregister ${chat1} chat`, (done) => db.unregisterChat(chat1, (err) => done(err)));
					before_getRedisKeys(chat1, (keys) => chat1Keys = keys);

					before(`search ${chat2} links`, (done) =>
						db.linkedChats(chat2, (err, links) => {
							if (err) {
								return done(err);
							}

							chat2Links = links;
							done();
						})
					);
					before(`search ${chat3} links`, (done) =>
						db.linkedChats(chat3, (err, links) => {
							if (err) {
								return done(err);
							}

							chat3Links = links;
							done();
						})
					);

					it(`should delete "${chat1}" keys`, () => {
						expect(chat1Keys).to.be.eqls([]);
					});

					it(`should leave "${chat2}" linked with "${chat3}"`, () => {
						expect(chat2Links).to.be.eqls([chat3]);
					});

					it(`should leave "${chat3}" linked with "${chat2}"`, () => {
						expect(chat3Links).to.be.eqls([chat2]);
					});

				});
			});
		});

	});

});


function before_ResetRedis() {
	before('reset redis', (done) => redisClient.flushdb(done));
}

function before_getRedisKeys(chat, callback) {
	before(`search ${chat} keys`, (done) => {
		redisClient.keys(`${chat}*`, (err, res) => {
			if (err) {
				return done(err);
			}

			res.sort((a, b) => a < b ? -1 : (a > b ? 1 : 0));
			callback(res);
			done();
		});
	});
}

function before_getRedisLinks(chat, callback) {
	before(`get ${chat}:link set members`, (done) => {
		redisClient.smembers(`${chat}:link`, (err, res) => {
			if (err) {
				return done(err);
			}
			callback(res);
			done();
		});
	});
}

function before_getLinks(chat, callback) {
	before(`get ${chat} links`, (done) => {
		db.linkedChats(chat, (err, res) => {
			if (err) {
				return done(err);
			}
			callback(res);
			done();
		});
	});
}