import { XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Booking Payment Cancelled | TimelyMeet",
};

export default function BookingCancelPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
      <XCircle className="mx-auto mb-4 h-14 w-14 text-red-500" />
      <h1 className="mb-4 text-3xl font-bold text-blue-600">
        Payment cancelled
      </h1>
      <p className="mb-6 text-gray-600">
        No booking was created because checkout was cancelled. You can return to
        the booking page and choose another time.
      </p>
      <Link href="/">
        <Button>Back to TimelyMeet</Button>
      </Link>
    </div>
  );
}
