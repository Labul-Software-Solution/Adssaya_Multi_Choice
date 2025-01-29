import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.Resend_API) {
    console.warn("Warning: RESEND_API key not found in the .env file. Email functionality will not work.");
}

const resend = process.env.Resend_API ? new Resend(process.env.Resend_API) : null;

const sendEmail = async ({ sendTo, subject, html }) => {
    if (!resend) {
        console.warn("Email sending skipped: RESEND_API key is missing.");
        return { status: "error", message: "RESEND_API key is missing." }; // Return a friendly response or handle it as needed
    }

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
