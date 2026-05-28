import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/prisma";
import ReportBookingIssue from "./_components/report-booking-issue";

export const metadata = {
  title: "Booking Payment Successful | TimelyMeet",
};

export default async function BookingSuccessPage({ searchParams }) {
  const sessionId = searchParams?.session_id;
  let booking = sessionId
    ? await db.booking.findUnique({
        where: { stripeSessionId: sessionId },
        include: { event: true },
      })
    : null;
  const now = new Date();

  if (
    booking?.event.isPaid &&
    booking.status === "CONFIRMED" &&
    now >= booking.endTime
  ) {
    booking = await db.booking.update({
      where: { id: booking.id },
      data: { status: "AWAITING_CONFIRMATION" },
      include: { event: true },
    });
  }

  if (
    booking?.event.isPaid &&
    booking.status === "AWAITING_CONFIRMATION" &&
    now > new Date(booking.endTime.getTime() + 24 * 60 * 60 * 1000)
  ) {
    booking = await db.booking.update({
      where: { id: booking.id },
      data: {
        status: "COMPLETED",
        completedAt: now,
      },
      include: { event: true },
    });
  }

  const canReportIssue =
    booking?.event.isPaid &&
    ["CONFIRMED", "AWAITING_CONFIRMATION"].includes(booking.status) &&
    now >= booking.endTime &&
    now <= new Date(booking.endTime.getTime() + 24 * 60 * 60 * 1000);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-600" />
      <h1 className="mb-4 text-3xl font-bold text-blue-600">
        Payment successful
      </h1>
      {booking ? (
        <div className="mb-6 text-gray-600">
          <p>
            Your booking is {booking.status.replaceAll("_", " ").toLowerCase()}.
          </p>
          {booking.meetLink && (
            <p className="mt-3">
              Join the meeting:{" "}
              <a
                href={booking.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {booking.meetLink}
              </a>
            </p>
          )}
          {canReportIssue && (
            <ReportBookingIssue stripeSessionId={sessionId} />
          )}
        </div>
      ) : (
        <p className="mb-6 text-gray-600">
          Your payment was received. TimelyMeet will confirm your booking and
          create the Google Meet link once payment processing is complete.
        </p>
      )}
      <Link href="/">
        <Button>Back to TimelyMeet</Button>
      </Link>
    </div>
  );
}
