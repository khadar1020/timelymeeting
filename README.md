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

---

## **Technologies Used**

- **Frontend**: React, JavaScript, HTML, CSS
- **Backend**: Next.js server actions
- **Authentication**: Clerk
- **Calendar Integration**: Google Calendar API
- **Database**: Prisma (for database interaction)

---

## **Deployment**

The production app is deployed on Vercel:

https://timelymeet.vercel.app/

Vercel should use the default Next.js settings:

- **Install Command**: `npm install`
- **Build Command**: `npm run build`
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
