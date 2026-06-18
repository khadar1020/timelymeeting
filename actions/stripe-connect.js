"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getAppUrl } from "@/lib/bookings";
import { syncConnectedAccountStatus } from "@/lib/stripe-connect";

async function getCurrentUser() {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function getStripeConnectStatus() {
  const user = await getCurrentUser();

  if (!user.stripeConnectedAccountId) {
    return {
      connected: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      onboardingComplete: false,
    };
  }

  const status = await syncConnectedAccountStatus(user);

  await db.user.update({
    where: { id: user.id },
    data: status,
  });

  return {
    connected: true,
    chargesEnabled: status.stripeChargesEnabled,
    payoutsEnabled: status.stripePayoutsEnabled,
    onboardingComplete: status.stripeOnboardingComplete,
  };
}

export async function createStripeConnectOnboardingLink() {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const user = await getCurrentUser();
  let accountId = user.stripeConnectedAccountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      business_type: "individual",
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        userId: user.id,
        clerkUserId: user.clerkUserId,
      },
    });

    accountId = account.id;

    await db.user.update({
      where: { id: user.id },
      data: { stripeConnectedAccountId: accountId },
    });
  }

  const appUrl = getAppUrl();
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/dashboard`,
    return_url: `${appUrl}/dashboard`,
    type: "account_onboarding",
  });

  return { url: accountLink.url };
}

export async function createStripeConnectDashboardLink() {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const user = await getCurrentUser();

  if (!user.stripeConnectedAccountId) {
    throw new Error("Stripe account is not connected");
  }

  const loginLink = await stripe.accounts.createLoginLink(
    user.stripeConnectedAccountId
  );

  return { url: loginLink.url };
}
