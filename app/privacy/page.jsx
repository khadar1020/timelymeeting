export const metadata = {
  title: "Privacy Policy | TimelyMeet",
  description: "Privacy policy for TimelyMeet.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 text-gray-700">
      <h1 className="mb-6 text-4xl font-bold text-blue-600">
        Privacy Policy
      </h1>
      <p className="mb-4">
        TimelyMeet helps users create scheduling links, manage availability, and
        create calendar bookings. This policy explains what information is used
        by the app.
      </p>

      <h2 className="mb-3 mt-8 text-2xl font-semibold">Information We Use</h2>
      <p className="mb-4">
        When you sign in, TimelyMeet may use your name, email address, profile
        image, and account identifier from your authentication provider. The app
        also stores scheduling information such as event details, availability,
        booking times, attendee names, attendee emails, meeting links, and
        calendar event identifiers.
      </p>

      <h2 className="mb-3 mt-8 text-2xl font-semibold">
        Google Calendar Access
      </h2>
      <p className="mb-4">
        If you connect Google Calendar, TimelyMeet uses Google Calendar access
        to create meeting events, add attendees, generate Google Meet links, and
        cancel calendar events when you cancel a meeting. TimelyMeet does not
        sell Google user data.
      </p>

      <h2 className="mb-3 mt-8 text-2xl font-semibold">
        How Information Is Used
      </h2>
      <p className="mb-4">
        Information is used to authenticate users, show scheduling pages,
        calculate available times, create bookings, and manage meeting records.
        Booking details are used only to provide the scheduling service.
      </p>

      <h2 className="mb-3 mt-8 text-2xl font-semibold">Data Sharing</h2>
      <p className="mb-4">
        TimelyMeet shares booking information with Google Calendar only when
        needed to create or manage calendar events. The app also uses service
        providers such as Clerk for authentication and a database provider for
        storing application data.
      </p>

      <h2 className="mb-3 mt-8 text-2xl font-semibold">Contact</h2>
      <p>
        For privacy questions, contact the developer at{" "}
        <a
          className="text-blue-600 underline"
          href="mailto:khadarvsk1@gmail.com"
        >
          khadarvsk1@gmail.com
        </a>
        .
      </p>
    </div>
  );
}
