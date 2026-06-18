import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createCalendarEvent } from "@/lib/calendar";
import { hasOverlappingBooking } from "@/lib/bookings";
import { calculatePayoutAmounts } from "@/lib/stripe-connect";

export async function POST(request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = headers().get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Invalid Stripe webhook signature:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handling failed:", error);
    return NextResponse.json(
      { error: "Webhook handling failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session) {
  const existingBooking = await db.booking.findUnique({
    where: { stripeSessionId: session.id },
  });

  if (existingBooking) {
    return existingBooking;
  }

  const metadata = session.metadata || {};
  const event = await db.event.findUnique({
    where: { id: metadata.eventId },
    include: { user: true },
  });

  if (!event || !event.isPaid) {
    throw new Error("Paid event not found for Stripe session");
  }

  const bookingData = {
    eventId: event.id,
    name: metadata.name,
    email: metadata.email,
    startTime: metadata.startTime,
    endTime: metadata.endTime,
    additionalInfo: metadata.additionalInfo || "",
  };

  const hasConflict = await hasOverlappingBooking({
    eventId: event.id,
    startTime: bookingData.startTime,
    endTime: bookingData.endTime,
  });

  if (hasConflict) {
    throw new Error("Paid time slot is no longer available");
  }

  const { meetLink, googleEventId } = await createCalendarEvent({
    event,
    bookingData,
  });
  const { platformFeeAmount, mentorPayoutAmount } = calculatePayoutAmounts(
    session.amount_total || event.price
  );

  return db.booking.create({
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
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
      amountPaid: session.amount_total,
      currency: session.currency,
      paidAt: new Date(),
      platformFeeAmount,
      mentorPayoutAmount,
      mentorPayoutStatus: "PENDING",
    },
  });
}
