module.exports = {
    hosting: {
        port: process.env.PORT || 3000,
        url: process.env.APP_URL
    },
    protocols: {
        skype: {
            appId: process.env.SKYPE_APP_ID,
            appPassword: process.env.SKYPE_APP_PWD
        },
        telegram: {
            token: process.env.TELEGRAM_TOKEN
        }
    }
};