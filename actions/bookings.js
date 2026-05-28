"use server";

import { db } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/calendar";
import { hasOverlappingBooking } from "@/lib/bookings";

export async function createBooking(bookingData) {
  try {
    const event = await db.event.findUnique({
      where: { id: bookingData.eventId },
      include: { user: true },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.isPaid) {
      throw new Error("Paid events must be booked through checkout");
    }

    const hasConflict = await hasOverlappingBooking({
      eventId: event.id,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
    });

    if (hasConflict) {
      throw new Error("This time slot is no longer available");
    }

    const { meetLink, googleEventId } = await createCalendarEvent({
      event,
      bookingData,
    });

    const booking = await db.booking.create({
      data: {
        eventId: event.id,
        userId: event.userId,
        name: bookingData.name,
        email: bookingData.email,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        additionalInfo: bookingData.additionalInfo,
        meetLink,
        googleEventId,
        status: "CONFIRMED",
      },
    });

    return { success: true, booking, meetLink };
  } catch (error) {
    console.error("Error creating booking:", error);
    return { success: false, error: error.message };
  }
}

export async function reportPaidBookingIssue(stripeSessionId) {
  if (!stripeSessionId) {
    throw new Error("Missing checkout session");
  }

  const booking = await db.booking.findUnique({
    where: { stripeSessionId },
    include: { event: true },
  });

  if (!booking || !booking.event.isPaid) {
    throw new Error("Paid booking not found");
  }

  const now = new Date();
  const reportDeadline = new Date(
    booking.endTime.getTime() + 24 * 60 * 60 * 1000
  );

  if (now < booking.endTime) {
    throw new Error("Issues can be reported after the meeting ends");
  }

  if (now > reportDeadline) {
    throw new Error("The 24-hour issue reporting window has closed");
  }

  await db.booking.update({
    where: { id: booking.id },
    data: {
      status: "DISPUTED",
      disputedAt: now,
    },
  });

  return { success: true };
}
