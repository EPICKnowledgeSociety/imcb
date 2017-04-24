const router = new require('express').Router();

module.exports = {
	index: router,
	skype: require('./skype'),
	telegram: require('./telegram')
};

router.get('/', (req, res) => {
	res.send('IMCB');
});