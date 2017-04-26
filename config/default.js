module.exports = {
	hosting: {
		port: process.env.PORT || 3000,
		url: process.env.APP_URL
	},
	redis: {
		url: process.env.REDIS_URL
	},
	amqp: {
		url: process.env.AMQP_URL,
		lite: true
	},
	protocols: {
		skype: {
			botName: 'imcb',
			appId: process.env.SKYPE_APP_ID,
			appPassword: process.env.SKYPE_APP_PWD
		},
		telegram: {
			botName: 'inter_mc_bot',
			token: process.env.TELEGRAM_TOKEN
		},
		facebook: {
			botName: '',
			token: process.env.FACEBOOK_TOKEN,
			pageToken: process.env.FACEBOOK_PAGE_TOKEN
		}
	}
};
