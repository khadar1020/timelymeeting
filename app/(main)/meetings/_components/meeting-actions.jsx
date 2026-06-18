"use client";

import { Button } from "@/components/ui/button";
import {
  markMeetingRefunded,
  markMeetingCompleted,
  reportMeetingIssue,
  retryMentorPayout,
} from "@/actions/meetings";
import { useRouter } from "next/navigation";
import useFetch from "@/hooks/use-fetch";

export default function MeetingActions({ meetingId, status, payoutStatus }) {
  const router = useRouter();
  const {
    loading: completing,
    error: completeError,
    fn: fnMarkMeetingCompleted,
  } = useFetch(markMeetingCompleted);
  const {
    loading: reporting,
    error: reportError,
    fn: fnReportMeetingIssue,
  } = useFetch(reportMeetingIssue);
  const {
    loading: refunding,
    error: refundError,
    fn: fnMarkMeetingRefunded,
  } = useFetch(markMeetingRefunded);
  const {
    loading: retryingPayout,
    error: payoutError,
    fn: fnRetryMentorPayout,
  } = useFetch(retryMentorPayout);

  const handleComplete = async () => {
    await fnMarkMeetingCompleted(meetingId);
    router.refresh();
  };

  const handleRetryPayout = async () => {
    await fnRetryMentorPayout(meetingId);
    router.refresh();
  };

  const handleReportIssue = async () => {
    if (
      window.confirm(
        "Report an issue with this meeting? This marks it as disputed for manual review."
      )
    ) {
      await fnReportMeetingIssue(meetingId);
      router.refresh();
    }
  };

  const handleRefunded = async () => {
    if (
      window.confirm(
        "Only mark this refunded after completing the refund in Stripe Dashboard."
      )
    ) {
      await fnMarkMeetingRefunded(meetingId);
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={handleComplete}
          disabled={completing || reporting || refunding}
          className={["COMPLETED", "DISPUTED"].includes(status) ? "hidden" : ""}
        >
          {completing ? "Marking..." : "Mark Completed"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReportIssue}
          disabled={completing || reporting || refunding}
          className={["COMPLETED", "DISPUTED"].includes(status) ? "hidden" : ""}
        >
          {reporting ? "Reporting..." : "Report Issue"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleRefunded}
          disabled={completing || reporting || refunding || retryingPayout}
        >
          {refunding ? "Updating..." : "Mark Refunded"}
        </Button>
        {status === "COMPLETED" &&
          ["READY", "FAILED", "PENDING"].includes(payoutStatus) && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRetryPayout}
              disabled={completing || reporting || refunding || retryingPayout}
            >
              {retryingPayout ? "Sending..." : "Retry Mentor Payout"}
            </Button>
          )}
      </div>
      {(completeError || reportError || refundError || payoutError) && (
        <p className="text-sm text-red-500">
          {completeError?.message ||
            reportError?.message ||
            refundError?.message ||
            payoutError?.message}
        </p>
      )}
    </div>
  );
}
