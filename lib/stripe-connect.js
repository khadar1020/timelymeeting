import { stripe } from "@/lib/stripe";

const DEFAULT_PLATFORM_FEE_PERCENT = 10;

function isStripeConnectEnabled() {
  return (process.env.STRIPE_CONNECT_COUNTRY || "IN").toUpperCase() === "US";
}

export function getPlatformFeePercent() {
  const rawValue = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT);

  if (Number.isFinite(rawValue) && rawValue >= 0 && rawValue <= 100) {
    return rawValue;
  }

  return DEFAULT_PLATFORM_FEE_PERCENT;
}

export function calculatePayoutAmounts(amountPaid) {
  const platformFeeAmount = Math.round(
    amountPaid * (getPlatformFeePercent() / 100)
  );

  return {
    platformFeeAmount,
    mentorPayoutAmount: Math.max(amountPaid - platformFeeAmount, 0),
  };
}

export async function syncConnectedAccountStatus(user) {
  if (!stripe || !user?.stripeConnectedAccountId) {
    return user;
  }

  const account = await stripe.accounts.retrieve(user.stripeConnectedAccountId);

  return {
    stripeChargesEnabled: Boolean(account.charges_enabled),
    stripePayoutsEnabled: Boolean(account.payouts_enabled),
    stripeOnboardingComplete: !account.requirements?.currently_due?.length,
  };
}

export async function createMentorTransferForBooking({ booking, db }) {
  if (!isStripeConnectEnabled()) {
    return db.booking.update({
      where: { id: booking.id },
      data: { mentorPayoutStatus: "READY" },
    });
  }

  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  if (!booking.event?.isPaid || booking.mentorPayoutStatus === "NOT_REQUIRED") {
    return booking;
  }

  if (booking.stripeTransferId) {
    return booking;
  }

  if (!booking.user?.stripeConnectedAccountId) {
    return db.booking.update({
      where: { id: booking.id },
      data: { mentorPayoutStatus: "READY" },
    });
  }

  const connectedStatus = await syncConnectedAccountStatus(booking.user);

  if (
    !connectedStatus.stripeOnboardingComplete ||
    !connectedStatus.stripePayoutsEnabled
  ) {
    await db.user.update({
      where: { id: booking.userId },
      data: connectedStatus,
    });

    return db.booking.update({
      where: { id: booking.id },
      data: { mentorPayoutStatus: "READY" },
    });
  }

  const amount = booking.mentorPayoutAmount || 0;

  if (amount <= 0) {
    return db.booking.update({
      where: { id: booking.id },
      data: { mentorPayoutStatus: "FAILED" },
    });
  }

  try {
    const transfer = await stripe.transfers.create(
      {
        amount,
        currency: booking.currency || booking.event.currency,
        destination: booking.user.stripeConnectedAccountId,
        metadata: {
          bookingId: booking.id,
          eventId: booking.eventId,
          mentorUserId: booking.userId,
        },
      },
      {
        idempotencyKey: `booking-transfer-${booking.id}`,
      }
    );

    return db.booking.update({
      where: { id: booking.id },
      data: {
        mentorPayoutStatus: "PAID",
        stripeTransferId: transfer.id,
        transferredAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to create mentor transfer:", error);

    return db.booking.update({
      where: { id: booking.id },
      data: { mentorPayoutStatus: "FAILED" },
    });
  }
}
