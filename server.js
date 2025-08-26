import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

const PORT = process.env.PORT || 3_000;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_RECEIVER = process.env.EMAIL_RECEIVER;
const EMAIL_SENDER = process.env.EMAIL_SENDER;

const app = express();
const resend = new Resend(RESEND_API_KEY);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

let templateHTML = fs.readFileSync(
	path.join(__dirname, 'template.html'),
	'utf-8'
);

app.post('/send-email', async (req, res) => {
	const { name, email, subject, message } = req.body;

	templateHTML = templateHTML.replace('{{name}}', name);
	templateHTML = templateHTML.replace('{{email}}', email);
	templateHTML = templateHTML.replace('{{message}}', message);

	try {
		const { data, error } = await resend.emails.send({
			from: `Message from Portfolio <${EMAIL_SENDER}>`,
			to: [EMAIL_RECEIVER],
			subject: subject,
			html: templateHTML,
			replyTo: email,
		});

		if (error) {
			console.error('Resend API error:', error);
			return res.status(400).json({
				status: 'Failed',
				statusCode: 400,
				message: 'Email failed to send',
				error: error,
			});
		}

		console.log('Email sent successfully:', data);
		res.status(200).json({
			status: 'Success',
			statusCode: 200,
			message: 'Email has been sent successfully',
		});
	} catch (e) {
		console.error('Internal server error:', e);
		res.status(500).json({
			status: 'Failed',
			statusCode: 500,
			message: 'An unexpected error occurred',
		});
	}
});

const server = app.listen(PORT, '0.0.0.0', () => {
	console.log(`App running on port ${PORT}.`);
});

const gracefulShutdown = () => {
	console.log('Received shutdown signal, shutting down gracefully ...');
	server.close(() => {
		console.log('Closed out remaining connections.');
		process.exit(0);
	});
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
