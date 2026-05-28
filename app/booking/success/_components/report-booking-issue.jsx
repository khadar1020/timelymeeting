"use client";

import { reportPaidBookingIssue } from "@/actions/bookings";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { useRouter } from "next/navigation";

export default function ReportBookingIssue({ stripeSessionId }) {
  const router = useRouter();
  const { loading, error, data, fn } = useFetch(reportPaidBookingIssue);

  const handleReportIssue = async () => {
    if (
      window.confirm(
        "Report an issue with this meeting? This marks the booking as disputed for manual review."
      )
    ) {
      await fn(stripeSessionId);
      router.refresh();
    }
  };

  return (
    <div className="mt-6">
      <Button
        type="button"
        variant="outline"
        onClick={handleReportIssue}
        disabled={loading || data?.success}
      >
        {loading ? "Reporting..." : "Report Issue"}
      </Button>
      {data?.success && (
        <p className="mt-2 text-sm text-green-600">
          Issue reported. The booking is now under manual review.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-500">{error.message}</p>}
    </div>
  );
}
