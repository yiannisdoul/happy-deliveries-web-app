export const TUTORIAL_STEPS = [
    {
        id: 1,
        title: "Welcome to Happy Deliveries",
        content: "Let's take a quick tour of your new Client Dashboard to help you get started with booking and managing deliveries.",
        target: null, // Centered modal
        position: 'center'
    },
    {
        id: 2,
        title: "Loyalty Rewards",
        content: "Track your stamps here! Every 10 deliveries earns you a reward. Use the toggle to apply your banked discount to a new job.",
        target: 'loyalty-card-target',
        position: 'right'
    },
    {
        id: 3,
        title: "The Request Form",
        content: "Use this form to submit a new delivery request or edit a pending one. Be sure to check the required notice period and operating hours.",
        target: 'request-form-target',
        position: 'right'
    },
    {
        id: 4,
        title: "Quote & Discount",
        content: "Once you enter valid delivery details, your total cost and any loyalty discounts will appear here at the bottom of the form.",
        // UPDATED: Point to the form container, position bottom. 
        // This prevents the tutorial from breaking if the price box is hidden.
        target: 'request-form-target', 
        position: 'bottom',
    },
    {
        id: 5,
        title: "Job List",
        content: "View all your past and current requests here. You can track status updates in real-time.",
        target: 'jobs-list-target',
        position: 'left'
    },
    {
        id: 6,
        title: "Filter Requests",
        content: "Need to find a specific job? Use these tabs to filter your list by status (Pending, Accepted, Delivered, etc.).",
        target: 'jobs-filter-target',
        position: 'bottom'
    },
    {
        id: 7,
        title: "All Set!",
        content: "You are ready to go! If you need help, you can restart this tutorial anytime from the top menu.",
        target: null,
        position: 'center'
    }
];

export const TUTORIAL_MAX_STEPS = TUTORIAL_STEPS.length;