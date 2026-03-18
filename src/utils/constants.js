// src/utils/constants.js

// Reward Value matches the price of a standard 50km (< 1.25t) delivery
export const REWARD_VALUE = 185; 

// Default stamp max (fallback for new users before tier calc)
export const STAMP_MAX = 10;

// Cloudinary Constants
export const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
export const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// EMAILJS CONSTANTS 
export const EMAILJS_OWNER_REQUEST_ALERT = import.meta.env.VITE_EMAILJS_TEMPLATE_OWNER; 
export const EMAILJS_CLIENT_STATUS_UPDATE = import.meta.env.VITE_EMAILJS_TEMPLATE_CLIENT_VERIFY; 
export const COMPANY_EMAIL = import.meta.env.VITE_COMPANY_EMAIL;

// Utility functions for Owner notifications
export const getNotificationMessage = (job) => {
    // 1. Highest Priority: Document Swaps
    if (job.documentUpdated) {
        return 'CLIENT UPDATED RECEIPT DOCUMENT';
    }
    // 2. Counter-Offer Acceptances
    if (job.status === 'accepted' && job.hasUnreadEdit && job.hasClientCountered) {
        return 'CLIENT ACCEPTED YOUR PROPOSAL';
    }
    // 3. Counter-Offer Submissions
    if (job.status === 'pending' && job.hasUnreadEdit && job.hasClientCountered) {
        return 'CLIENT SUBMITTED COUNTER-OFFER';
    }
    // 4. Standard Edits (Form changes, address changes, etc)
    if (job.hasUnreadEdit) {
        return 'CLIENT EDITED REQUEST';
    }
    return 'MODIFIED BY CLIENT';
};