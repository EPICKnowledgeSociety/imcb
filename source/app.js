const config = require('config');
const express = require('express');
const bodyParser = require('body-parser');

const protocols = require('./protocols');

const app = express();

app.use(bodyParser.json());
app.use('/api', protocols.skype);
app.use('/api', protocols.telegram);

protocols.telegram.init('/api');

app.listen(config.hosting.port, () => {
  console.log(`imcb started at ${config.hosting.port} port!`);
});