"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getAppUrl } from "@/lib/bookings";
import { syncConnectedAccountStatus } from "@/lib/stripe-connect";

function getStripeConnectCountry() {
  return (process.env.STRIPE_CONNECT_COUNTRY || "IN").toUpperCase();
}

function isStripeConnectEnabled() {
  return getStripeConnectCountry() === "US";
}

function getConnectDisabledMessage() {
  const country = getStripeConnectCountry();

  return `Stripe Connect payouts are currently disabled for ${country}. Paid booking payments are collected by the platform, and mentor payouts should be handled manually for now. Set STRIPE_CONNECT_COUNTRY=US to enable Connect for a supported US Stripe account.`;
}

function getSafeStripeError(error) {
  const message =
    error?.raw?.message ||
    error?.message ||
    "Unable to complete Stripe Connect setup";

  if (message.includes("not configured")) {
    return message;
  }

  if (
    message.toLowerCase().includes("connect") ||
    message.toLowerCase().includes("account") ||
    message.toLowerCase().includes("capabilit")
  ) {
    return message;
  }

  return "Unable to complete Stripe Connect setup. Check your Stripe Connect settings and try again.";
}

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
  try {
    if (!isStripeConnectEnabled()) {
      return {
        connected: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        onboardingComplete: false,
        disabled: true,
        country: getStripeConnectCountry(),
        message: getConnectDisabledMessage(),
      };
    }

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
  } catch (error) {
    console.error("Failed to get Stripe Connect status:", error);

    return {
      connected: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      onboardingComplete: false,
      error: getSafeStripeError(error),
    };
  }
}

export async function createStripeConnectOnboardingLink() {
  try {
    if (!isStripeConnectEnabled()) {
      return { error: getConnectDisabledMessage() };
    }

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
  } catch (error) {
    console.error("Failed to create Stripe Connect onboarding link:", error);

    return { error: getSafeStripeError(error) };
  }
}

export async function createStripeConnectDashboardLink() {
  try {
    if (!isStripeConnectEnabled()) {
      return { error: getConnectDisabledMessage() };
    }

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
  } catch (error) {
    console.error("Failed to create Stripe Connect dashboard link:", error);

    return { error: getSafeStripeError(error) };
  }
}
