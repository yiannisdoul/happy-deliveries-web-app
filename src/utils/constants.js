// src/utils/constants.js

// Reward Value matches the price of a standard 50km (< 1.25t) delivery
export const REWARD_VALUE = 185; 

// Default stamp max (fallback for new users before tier calc)
export const STAMP_MAX = 10;

// Cloudinary Constants (for OwnerDash/DeliveryModal, kept here for consistency)
export const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
export const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// EMAILJS CONSTANTS (UPDATED)
// Ensure these match the IDs you obtained from EmailJS
export const EMAILJS_OWNER_REQUEST_ALERT = import.meta.env.VITE_EMAILJS_TEMPLATE_OWNER; 
export const EMAILJS_CLIENT_STATUS_UPDATE = import.meta.env.VITE_EMAILJS_TEMPLATE_CLIENT_VERIFY; 
export const COMPANY_EMAIL = import.meta.env.VITE_COMPANY_EMAIL;

// Utility functions for Owner notifications
export const getNotificationMessage = (job) => {
    if (job.status === 'accepted' && job.hasUnreadEdit) {
        return 'CLIENT ACCEPTED YOUR PROPOSAL';
    }
    if (job.status === 'pending' && job.hasUnreadEdit && job.hasClientCountered) {
        return 'CLIENT SUBMITTED COUNTER-OFFER';
    }
    if (job.status === 'pending' && job.hasUnreadEdit) {
        return 'CLIENT EDITED REQUEST';
    }
    if (job.status === 'rejected' && job.hasUnreadEdit) { 
        return 'CLIENT RE-EDITED REJECTED REQUEST';
    }
    return 'MODIFIED BY CLIENT';
};