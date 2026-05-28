import { db } from "@/lib/prisma";

export const ACTIVE_BOOKING_STATUSES = [
  "CONFIRMED",
  "AWAITING_CONFIRMATION",
  "COMPLETED",
];

export async function hasOverlappingBooking({ eventId, startTime, endTime }) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const booking = await db.booking.findFirst({
    where: {
      eventId,
      status: { in: ACTIVE_BOOKING_STATUSES },
      startTime: { lt: end },
      endTime: { gt: start },
    },
    select: { id: true },
  });

  return Boolean(booking);
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || "http://localhost:3000";
}
