export const TUTORIAL_STEPS = [
    {
        id: 1,
        title: "Welcome to Happy Deliveries",
        content: "Let's take a quick tour. We have two systems to reward you: 1. Status Tiers (Experience) and 2. Loyalty Cards (Freebies).",
        target: null, 
        position: 'center'
    },
    {
        id: 2,
        title: "Status Tiers",
        content: "This bar tracks your total monthly deliveries. The more you deliver, the higher your Tier. Higher Tiers mean you need FEWER stamps to get a free delivery!",
        target: 'gamification-bar-target', // Need to add this ID to ClientDash
        position: 'bottom'
    },
    {
        id: 3,
        title: "Loyalty Rewards",
        content: "This is your stamp card. You get 1 stamp per delivery. When it fills up, you bank a Free Delivery reward. Use the toggle to spend it.",
        target: 'loyalty-card-target',
        position: 'right'
    },
    {
        id: 4,
        title: "The Request Form",
        content: "Use this form to submit a new delivery request or edit a pending one. Be sure to check the required notice period and operating hours.",
        target: 'request-form-target',
        position: 'right'
    },
    {
        id: 5,
        title: "Quote & Discount",
        content: "Once you enter valid delivery details, your total cost and any loyalty discounts will appear here at the bottom of the form.",
        target: 'request-form-target', 
        position: 'bottom',
    },
    {
        id: 6,
        title: "Job List",
        content: "View all your past and current requests here. You can track status updates in real-time.",
        target: 'jobs-list-target',
        position: 'left'
    },
    {
        id: 7,
        title: "Filter Requests",
        content: "Need to find a specific job? Use these tabs to filter your list by status (Pending, Accepted, Delivered, etc.).",
        target: 'jobs-filter-target',
        position: 'bottom'
    },
    {
        id: 8,
        title: "All Set!",
        content: "You are ready to go! Deliver more to level up and earn rewards faster.",
        target: null,
        position: 'center'
    }
];

export const TUTORIAL_MAX_STEPS = TUTORIAL_STEPS.length;