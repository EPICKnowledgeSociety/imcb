const esLintTest = require('mocha-eslint');

const paths = [
	'*.js',
	'source',
	'test'
];
const opts = {
	formatter: 'node_modules/eslint-friendly-formatter'
};

esLintTest(paths, opts);