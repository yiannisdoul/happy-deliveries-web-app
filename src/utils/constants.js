// src/utils/constants.js

// Reward Value matches the price of a standard 50-75km (<1t) delivery
export const REWARD_VALUE = 160; 

// Default stamp max (fallback for new users before tier calc)
export const STAMP_MAX = 10;

// Cloudinary Constants
export const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
export const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

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