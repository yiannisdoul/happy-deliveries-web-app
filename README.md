# 🚚 Happy Deliveries Web App

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB)
![Firebase](https://img.shields.io/badge/backend-Firebase-FFCA28)

**Happy Deliveries** is a robust, full-stack logistics platform designed to streamline the delivery booking process between clients and fleet owners in Metro Melbourne. 

It features an intelligent **pricing algorithm**, automated **time-blocking based on traffic heuristics**, and a gamified **Loyalty Tier system** that rewards frequent shippers.

---

## ✨ Key Features

### 🏢 For Clients
* **Intelligent Booking Engine:**
    * **Dynamic Pricing:** Calculates base price automatically based on Distance (0-200km+) and Weight (<1t - 3t+) matrices.
    * **Smart Time Blocking:** "Calendly-style" picker greys out slots that conflict with existing jobs + traffic buffers.
    * **Surcharge Logic:** Auto-applies 50% surcharge for late same-day bookings.
* **Gamified Loyalty Program:**
    * **Tier System:** Progress from *Dirt* to *Diamond* tiers based on monthly volume.
    * **Rollover Protection:** Surplus deliveries roll over to the next month to help maintain status.
    * **Banked Rewards:** Earn stamps to unlock free deliveries (capped at $160 value).
* **Negotiation Portal:**
    * One-time counter-offer system allows clients to negotiate rejected requests.

### 🚛 For Owners
* **Command Center Dashboard:**
    * Real-time feed of Pending, Accepted, and Delivered jobs.
    * Visual tags for job specs (e.g., "50-75km / 1-2 tonnes").
* **Proof of Delivery (POD):**
    * Digital signature capture.
    * Photo upload evidence secured in Cloudinary.
* **Calendar Integration:** One-click export to Google Calendar.

---

## 🛠️ Tech Stack

* **Frontend:** React 19, Vite, Tailwind CSS
* **Backend:** Firebase (Firestore, Auth, Storage)
* **Icons:** Lucide React
* **Utilities:** * `react-signature-canvas` (Digital Signatures)
    * `@emailjs/browser` (Notifications)

---

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone [https://github.com/yiannisdoul/happy-deliveries-web-app.git]
cd happy-deliveries-web-app