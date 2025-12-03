// Constants shared across components
export const STAMP_MAX = 10;
export const REWARD_VALUE = 160; // UPDATED DISCOUNT VALUE

// Cloudinary Constants (for OwnerDash/DeliveryModal, kept here for consistency)
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