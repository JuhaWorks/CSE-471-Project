const nodemailer = require('nodemailer');

/**
 * Reusable utility to send emails.
 * Make sure to add the following to your .env file:
 * - EMAIL_HOST (e.g., smtp.gmail.com)
 * - EMAIL_PORT (e.g., 587 or 465)
 * - EMAIL_USER (e.g., your_email@gmail.com)
 * - EMAIL_PASS (e.g., app-specific password if using Gmail, or SMTP password)
 * - EMAIL_FROM (e.g., "Klivra Security" <noreply@klivra.com>)
 */

const sendEmail = async ({ to, subject, html }) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Verify connection configuration
        if (process.env.NODE_ENV !== 'production') {
            await transporter.verify();
            console.log('✅ Mail server connection established successfully.');
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"Klivra Team" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ Email sent to ${to}. Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        throw new Error('Email could not be sent. Please try again later.');
    }
};

module.exports = sendEmail;
