module.exports = {
    hosting: {
        port: process.env.PORT || 3000,
        url: process.env.APP_URL
    },
    redis: {
		url: ''
	},
    amqp: {
    	url: process.env.AMQP_URL
	},
    protocols: {
        skype: {
            appId: process.env.SKYPE_APP_ID,
            appPassword: process.env.SKYPE_APP_PWD
        },
        telegram: {
			username: 'inter_mc_bot',
        	token: process.env.TELEGRAM_TOKEN
        },
		facebook: {
        	token: process.env.FACEBOOK_TOKEN,
			pageToken: process.env.FACEBOOK_PAGE_TOKEN
		}
    }
};