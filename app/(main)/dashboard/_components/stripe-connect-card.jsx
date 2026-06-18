"use client";

import { useEffect } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createStripeConnectDashboardLink,
  createStripeConnectOnboardingLink,
  getStripeConnectStatus,
} from "@/actions/stripe-connect";
import useFetch from "@/hooks/use-fetch";

export default function StripeConnectCard() {
  const {
    data: status,
    loading: loadingStatus,
    error: statusError,
    fn: fnGetStatus,
  } = useFetch(getStripeConnectStatus);
  const {
    data: onboardingResult,
    loading: onboarding,
    error: onboardingError,
    fn: fnCreateOnboardingLink,
  } = useFetch(createStripeConnectOnboardingLink);
  const {
    data: dashboardResult,
    loading: openingDashboard,
    error: dashboardError,
    fn: fnCreateDashboardLink,
  } = useFetch(createStripeConnectDashboardLink);

  useEffect(() => {
    fnGetStatus();
  }, [fnGetStatus]);

  const openOnboarding = async () => {
    const result = await fnCreateOnboardingLink();

    if (result?.url) {
      window.location.href = result.url;
    }
  };

  const openDashboard = async () => {
    const result = await fnCreateDashboardLink();

    if (result?.url) {
      window.location.href = result.url;
    }
  };

  const isReady = status?.connected && status?.onboardingComplete;
  const isDisabled = status?.disabled;
  const errorMessage =
    status?.error ||
    onboardingResult?.error ||
    dashboardResult?.error ||
    statusError?.message ||
    onboardingError?.message ||
    dashboardError?.message;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Stripe Connect
        </CardTitle>
        <CardDescription>
          Manage mentor payout setup for paid meetings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-gray-50 p-4 text-sm">
          {loadingStatus ? (
            <p>Checking Stripe account...</p>
          ) : isDisabled ? (
            <p className="font-medium text-gray-700">
              {status.message}
            </p>
          ) : isReady ? (
            <p className="font-medium text-green-700">
              Stripe payouts are ready for paid events.
            </p>
          ) : status?.connected ? (
            <p className="font-medium text-yellow-700">
              Stripe account connected. Finish onboarding to receive payouts.
            </p>
          ) : (
            <p className="font-medium text-gray-700">
              Stripe account is not connected yet.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={openOnboarding}
            disabled={isDisabled || onboarding || openingDashboard}
          >
            {status?.connected ? "Continue Onboarding" : "Connect Stripe"}
          </Button>
          {status?.connected && !isDisabled && (
            <Button
              type="button"
              variant="outline"
              onClick={openDashboard}
              disabled={onboarding || openingDashboard}
            >
              Open Stripe Dashboard
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => fnGetStatus()}
            disabled={loadingStatus}
          >
            Refresh Status
          </Button>
        </div>

        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
      </CardContent>
    </Card>
  );
}
