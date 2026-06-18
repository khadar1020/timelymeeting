import { NextResponse } from "next/server";
import { bookingSchema } from "@/app/lib/validators";
import { db } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getAppUrl, hasOverlappingBooking } from "@/lib/bookings";

export async function POST(request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validatedData = bookingSchema.parse(body);
    const { eventId, name, email, date, time, additionalInfo } = validatedData;

    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        user: {
          select: {
            username: true,
            stripeConnectedAccountId: true,
            stripeOnboardingComplete: true,
            stripePayoutsEnabled: true,
          },
        },
      },
    });

    if (!event || !event.isPaid || !event.price) {
      return NextResponse.json(
        { error: "Paid event not found" },
        { status: 404 }
      );
    }

    if (
      !event.user.stripeConnectedAccountId ||
      !event.user.stripeOnboardingComplete ||
      !event.user.stripePayoutsEnabled
    ) {
      return NextResponse.json(
        { error: "This mentor is not ready to receive payouts yet" },
        { status: 409 }
      );
    }

    const startTime = new Date(`${date}T${time}`);
    const endTime = new Date(startTime.getTime() + event.duration * 60000);

    const hasConflict = await hasOverlappingBooking({
      eventId,
      startTime,
      endTime,
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: "This time slot is no longer available" },
        { status: 409 }
      );
    }

    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: event.currency,
            unit_amount: event.price,
            product_data: {
              name: event.title,
              description: `${event.duration}-minute TimelyMeet booking`,
            },
          },
        },
      ],
      metadata: {
        eventId,
        name,
        email,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        additionalInfo: additionalInfo || "",
      },
      success_url: `${appUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/booking/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Unable to create checkout session" },
      { status: 400 }
    );
  }
}
