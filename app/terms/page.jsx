export const metadata = {
  title: "Terms of Service | TimelyMeet",
  description: "Terms of service for TimelyMeet.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 text-gray-700">
      <h1 className="mb-6 text-4xl font-bold text-blue-600">
        Terms of Service
      </h1>
      <p className="mb-4">
        By using TimelyMeet, you agree to use the service responsibly for
        scheduling meetings and managing event bookings.
      </p>

      <h2 className="mb-3 mt-8 text-2xl font-semibold">Use of the Service</h2>
      <p className="mb-4">
        TimelyMeet lets users create event types, set availability, share
        scheduling links, and receive bookings. You are responsible for the
        accuracy of the event, availability, and contact information you provide.
      </p>

      <h2 className="mb-3 mt-8 text-2xl font-semibold">
        Calendar Integration
      </h2>
      <p className="mb-4">
        When you connect Google Calendar, you authorize TimelyMeet to create and
        manage meeting events related to bookings made through the app. You can
        remove access from your Google Account permissions at any time.
      </p>

      <h2 className="mb-3 mt-8 text-2xl font-semibold">Acceptable Use</h2>
      <p className="mb-4">
        You agree not to misuse the app, attempt unauthorized access, interfere
        with the service, or use scheduling pages for spam, fraud, or unlawful
        activity.
      </p>

      <h2 className="mb-3 mt-8 text-2xl font-semibold">Availability</h2>
      <p className="mb-4">
        TimelyMeet is provided as-is and may change over time. The developer
        does not guarantee uninterrupted access or error-free operation.
      </p>

      <h2 className="mb-3 mt-8 text-2xl font-semibold">Contact</h2>
      <p>
        For questions about these terms, contact the developer at{" "}
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
