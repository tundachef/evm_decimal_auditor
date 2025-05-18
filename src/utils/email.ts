import nodemailer from 'nodemailer';
import { EMAIL_ADDRESS, EMAIL_HOST, EMAIL_PASSWORD, EMAIL_PORT, RECEIVER_EMAIL_ADDRESS } from '../helpers/constants';

import SMTPTransport from 'nodemailer/lib/smtp-transport';

const transporter = nodemailer.createTransport(new SMTPTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: EMAIL_PORT === "465", // true for port 465, false for other ports
    auth: {
        user: EMAIL_ADDRESS,
        pass: EMAIL_PASSWORD,
    },
}));



export async function sendEmail(subject: string, text: string) {
    // Email options
    const mailOptions = {
        from: EMAIL_ADDRESS,
        to: RECEIVER_EMAIL_ADDRESS, // Replace with the recipient's email address
        subject: subject,
        text: text,
    };

    // Send the email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(' Email sent:', info.response);
    } catch (error) {
        console.log('❌ Error sending email:', error);
    }
}

// sendEmail("Test Email", "This is a test email from the Solana NFT project.")
// .then(() => logger.info('Email sent successfully!'));