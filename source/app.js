const config = require('config');
const express = require('express');
const protocols = require('./protocols');

const app = express();

app.use('/api', protocols.skype);

app.listen(config.hosting.port, () => {
  console.log(`imcb started at ${config.hosting.port} port!`);
});