# **Check Out Live**

https://timelymeet.vercel.app/

# **TimelyMeet**

TimelyMeet is a responsive web application designed to streamline scheduling and appointment booking. It integrates Google Calendar API, Prisma for the database, and Clerk for authentication, allowing users to create events, share event links, and check available times for convenient scheduling.

## **Features**

- **Responsive Design**: Works seamlessly on desktop and mobile devices.
- **Authentication**: User authentication powered by Clerk, ensuring secure login and user management.
- **Google Calendar Integration**: Users can sync their Google Calendar to create events and manage availability.
- **Event Scheduling**: Users can create events, share event links, and allow others to view available time slots.
- **Appointment Booking**: Recipients can view the user's available time and schedule appointments directly.
- **Paid Bookings**: Event creators can make events free or paid. Paid bookings use Stripe Checkout.
- **Booking Status Flow**: Paid meetings can be confirmed, completed, disputed, cancelled, or marked refunded after manual review.

---

## **Technologies Used**

- **Frontend**: React, JavaScript, HTML, CSS
- **Backend**: Next.js server actions
- **Authentication**: Clerk
- **Calendar Integration**: Google Calendar API
- **Database**: Prisma (for database interaction)
- **Payments**: Stripe Checkout and Stripe webhooks

---

## **Project Flow**

TimelyMeet has two main users:

- **Event creator / mentor**: signs in, sets availability, creates event types, and shares booking links.
- **Booker / student**: opens a public booking link, selects a slot, and books a meeting.

```mermaid
flowchart TD
    A["User visits TimelyMeet"] --> B{"Signed in?"}
    B -->|No| C["Clerk sign-in / sign-up"]
    C --> D["Create or load user profile"]
    B -->|Yes| D
    D --> E["Dashboard"]
    E --> F["Set weekly availability"]
    E --> G["Create event"]
    G --> H{"Free or paid?"}
    H -->|Free| I["Save free event"]
    H -->|Paid| J["Save price and currency"]
    I --> K["Share public booking link"]
    J --> K
    K --> L["Booker opens event page"]
    L --> M["Booker selects date and time"]
    M --> N{"Event is paid?"}
    N -->|No| O["Create Google Calendar event and Meet link"]
    O --> P["Save confirmed booking"]
    N -->|Yes| Q["Redirect to Stripe Checkout"]
```

### **Main App Areas**

- `/dashboard`: account overview and public username link.
- `/availability`: weekly availability setup.
- `/events`: event list and event creation.
- `/meetings`: upcoming and past meetings, cancellation, completion, dispute, and refund status controls.
- `/[username]`: public profile with public events.
- `/[username]/[eventId]`: public booking page.

---

## **Payment Gateway Flow**

Paid bookings use Stripe Checkout. The app does not store card details and does not trust the browser redirect as proof of payment. A paid booking is confirmed only after Stripe sends a verified webhook.

```mermaid
flowchart TD
    A["Booker selects paid slot"] --> B["Submit booking form"]
    B --> C["Create Stripe Checkout session"]
    C --> D["Redirect to Stripe Checkout"]
    D --> E{"Payment result"}
    E -->|Cancelled| F["Return to /booking/cancel"]
    F --> G["No booking or calendar event is created"]
    E -->|Succeeded| H["Stripe sends checkout.session.completed webhook"]
    H --> I["Verify webhook signature"]
    I --> J["Check event and slot availability again"]
    J --> K{"Slot still available?"}
    K -->|No| L["Reject webhook handling for manual review"]
    K -->|Yes| M["Create Google Calendar event and Meet link"]
    M --> N["Save booking as CONFIRMED"]
    N --> O["Return user to /booking/success"]
```

### **Paid Meeting Status Flow**

```mermaid
flowchart TD
    A["Stripe payment succeeds"] --> B["Booking status: CONFIRMED"]
    B --> C["Meeting end time passes"]
    C --> D["Booking status: AWAITING_CONFIRMATION"]
    D --> E{"Issue reported within 24 hours?"}
    E -->|No| F["Booking status: COMPLETED"]
    E -->|Yes| G["Booking status: DISPUTED"]
    G --> H["Admin / mentor reviews manually"]
    H --> I{"Refund completed in Stripe?"}
    I -->|Yes| J["Booking status: REFUNDED"]
    I -->|No| K["Keep DISPUTED until resolved"]
```

### **Payment Notes**

- Stripe money goes to the platform Stripe account.
- Stripe Connect and automatic mentor payouts are not implemented in this version.
- Refunds are manual in Stripe Dashboard.
- After a manual refund, the booking can be marked `REFUNDED` in TimelyMeet.
- Student issue reporting is available from the paid booking success link during the 24-hour post-meeting window.
- The booking page shows the policy: full refund if the mentor cancels or does not attend, and issues must be reported within 24 hours after the meeting.

---

## **Deployment**

The production app is deployed on Vercel:

https://timelymeet.vercel.app/

Vercel should use the default Next.js settings:

- **Install Command**: `npm install`
- **Build Command**: `npx prisma migrate deploy && npm run build`
- **Output Directory**: `.next`

Required production environment variables:

```env
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=https://timelymeet.vercel.app
```

Run Prisma migrations against production when needed:

```bash
npx prisma migrate deploy
```

If Vercel is configured with the build command above, migrations run automatically during deployment.

## **Google OAuth Verification**

Google Calendar access uses sensitive OAuth scopes, so Google can show an
"unverified app" warning until OAuth verification is complete.

Public policy pages were added for Google OAuth review:

- Privacy Policy: https://timelymeet.vercel.app/privacy
- Terms of Service: https://timelymeet.vercel.app/terms

In Google Cloud Console, configure:

- **Application home page**: `https://timelymeet.vercel.app`
- **Privacy policy link**: `https://timelymeet.vercel.app/privacy`
- **Terms of service link**: `https://timelymeet.vercel.app/terms`
- **Authorized domains**: `accounts.dev` and `timelymeet.vercel.app`

Then use **Verification Center** to verify branding and submit data access
verification for Google Calendar scopes.
