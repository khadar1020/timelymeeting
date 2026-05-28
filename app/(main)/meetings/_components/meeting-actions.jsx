"use client";

import { Button } from "@/components/ui/button";
import {
  markMeetingRefunded,
  markMeetingCompleted,
  reportMeetingIssue,
} from "@/actions/meetings";
import { useRouter } from "next/navigation";
import useFetch from "@/hooks/use-fetch";

export default function MeetingActions({ meetingId, status }) {
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

  const handleComplete = async () => {
    await fnMarkMeetingCompleted(meetingId);
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
          className={status === "DISPUTED" ? "hidden" : ""}
        >
          {completing ? "Marking..." : "Mark Completed"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReportIssue}
          disabled={completing || reporting || refunding}
          className={status === "DISPUTED" ? "hidden" : ""}
        >
          {reporting ? "Reporting..." : "Report Issue"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleRefunded}
          disabled={completing || reporting || refunding}
        >
          {refunding ? "Updating..." : "Mark Refunded"}
        </Button>
      </div>
      {(completeError || reportError || refundError) && (
        <p className="text-sm text-red-500">
          {completeError?.message ||
            reportError?.message ||
            refundError?.message}
        </p>
      )}
    </div>
  );
}
