const config = require('config');

module.exports = {
	isAmpqLiteMode
};



const warnOnceAboutAmpqLiteMode = once(() => {
	console.warn('WARNING: amqp running in lite mode');
});


function isAmpqLiteMode() {
	if (config.amqp.lite) {
		warnOnceAboutAmpqLiteMode();
	}

	return config.amqp.lite;
}



function once(fn) {
	let isCalled = false;
	return function () {
		if (isCalled) {
			return;
		}
		isCalled = true;
		fn();
	};
}