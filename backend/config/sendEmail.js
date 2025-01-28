import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.Resend_API) {
    console.log("Provide RESEND_API inside the .env file");
    process.exit(1); // Exit if the API key is not provided
}

const resend = new Resend(process.env.Resend_API);

const sendEmail = async ({ sendTo, subject, html }) => {
    try {
        const data = await resend.emails.send({
            from: 'onlineshop <onboarding@resend.dev>',
            to: sendTo,
            subject: subject,
            html: html,
        });
        return data;
    } catch (error) {
        console.log("Error while sending email:", error);
        throw error; // Re-throw the error for higher-level handling if needed
    }
};

export default sendEmail;
