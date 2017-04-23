const config = require('config');
const request = require('request');

const router = new require('express').Router();


router.get('/facebook/webhook', (req, res) => {

	if (req.query['hub.mode'] === 'subscribe') {
		if (req.query['hub.verify_token'] === config.protocols.facebook.token) {
			return res.status(200).send(req.query['hub.challenge']);
		} else {
			console.error('Failed validation. Make sure the validation tokens match.');
			return res.sendStatus(403);
		}
	}

	if (!req.body) {
		return res.sendStatus(400);
	}

	const data = req.body;

	if (data.object === 'page') {
		// Iterate over each entry - there may be multiple if batched
		data.entry.forEach(function (entry) {
			const pageID = entry.id;
			const timeOfEvent = entry.time;

			// Iterate over each messaging event
			entry.messaging.forEach(function (event) {
				if (event.message) {
					receivedMessage(event);
				} else {
					console.log('Webhook received unknown event: ', event);
					return res.sendStatus(400);
				}
			});
		});

		// Assume all went well.
		//
		// You must send back a 200, within 20 seconds, to let us know
		// you've successfully received the callback. Otherwise, the request
		// will time out and we will keep trying to resend.
		return res.sendStatus(200);
	} else {
		console.error('Data Object is not a page.');
		return res.sendStatus(400);
	}
});

function receivedMessage(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfMessage = event.timestamp;
	var message = event.message;

	console.log("Received message for user %d and page %d at %d with message:",
		senderID, recipientID, timeOfMessage);
	console.log(JSON.stringify(message));

	var messageId = message.mid;

	var messageText = message.text;
	var messageAttachments = message.attachments;

	if (messageText) {

		// If we receive a text message, check to see if it matches a keyword
		// and send back the example. Otherwise, just echo the text we received.
		switch (messageText) {
			case 'generic':
				sendGenericMessage(senderID);
				break;

			default:
				sendTextMessage(senderID, messageText);
		}
	} else if (messageAttachments) {
		sendTextMessage(senderID, "Message with attachment received");
	}
}

function sendTextMessage(recipientId, messageText) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: messageText
		}
	};

	callSendAPI(messageData);
}

function callSendAPI(messageData) {
	request({
		uri: 'https://graph.facebook.com/v2.6/me/messages',
		qs: { access_token: config.protocols.facebook.pageToken },
		method: 'POST',
		json: messageData

	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var recipientId = body.recipient_id;
			var messageId = body.message_id;

			console.log("Successfully sent generic message with id %s to recipient %s",
				messageId, recipientId);
		} else {
			console.error("Unable to send message.");
			console.error(response);
			console.error(error);
		}
	});
}

module.exports = router;