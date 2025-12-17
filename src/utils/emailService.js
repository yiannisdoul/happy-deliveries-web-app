import emailjs from '@emailjs/browser';
import { EMAILJS_CLIENT_STATUS_UPDATE, EMAILJS_OWNER_REQUEST_ALERT, COMPANY_EMAIL } from './constants';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * Sends an email using EmailJS.
 * @param {string} templateKey - The template ID to use
 * @param {Object} params - Dynamic data for the template.
 */
export const sendNotificationEmail = async (templateKey, params) => {
    if (!SERVICE_ID || !templateKey || !PUBLIC_KEY) {
        console.warn("EmailJS not fully configured or missing template key. Email skipped.");
        return;
    }

    try {
        const response = await emailjs.send(SERVICE_ID, templateKey, params, PUBLIC_KEY);
        console.log(`📧 Email Sent via Template ${templateKey}! Status:`, response.status);
    } catch (error) {
        console.error("❌ Email Failed:", error);
    }
};

export const TEMPLATES = {
    OWNER_REQUEST_ALERT: EMAILJS_OWNER_REQUEST_ALERT,
    CLIENT_STATUS_UPDATE: EMAILJS_CLIENT_STATUS_UPDATE,
};