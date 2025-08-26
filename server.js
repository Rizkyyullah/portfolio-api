import express from 'express';
import cors from 'cors';
import { createTransport } from 'nodemailer';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = process.env.PORT;
const EMAIL_SENDER = process.env.EMAIL_SENDER;
const EMAIL_RECEIVER = process.env.EMAIL_RECEIVER;
const PASSWORD = process.env.PASSWORD;

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.post('/send-email', (req, res) => {
	const { name, email, subject, message } = req.body;

	let templateHTML = fs.readFileSync(
		path.join(__dirname, 'template.html'),
		'utf-8'
	);

	templateHTML = templateHTML.replace('{{name}}', name);
	templateHTML = templateHTML.replace('{{email}}', email);
	templateHTML = templateHTML.replace('{{message}}', message);

	const transporter = createTransport({
		host: 'smtp.gmail.com',
		port: 587,
		secure: false,
		service: 'gmail',
		auth: {
			user: EMAIL_SENDER,
			pass: PASSWORD,
		},
	});

	(async () => {
		try {
			const info = await transporter.sendMail({
				from: `${name} ${EMAIL_SENDER}`,
				to: EMAIL_RECEIVER,
				subject: subject,
				html: templateHTML,
			});

			console.log(`Response : ${info.response}`);
			res.status(201).json({
				status: 'Success',
				statusCode: 201,
				message: 'Email has been sent successfully',
			});
		} catch (e) {
			console.log("Something's wrong ", e);
			res.status(500).json({
				status: 'Failed',
				statusCode: 500,
				message: 'Email failed to send',
			});
		}
	})();
});

app.listen(PORT, () => {
	console.log(`App running on port ${PORT}.`);
});
