module.exports = {
    hosting: {
        port: process.env.PORT || 3000
    },
    protocols: {
        skype: {
            appId: process.env.SKYPE_APP_ID,
            appPassword: process.env.SKYPE_APP_PWD
        }
    }
};