module.exports = {
    hosting: {
        port: process.env.PORT || 3000,
        url: process.env.APP_URL || 'https://imc-bot.herokuapp.com:443'
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