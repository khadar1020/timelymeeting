CREATE TYPE "MentorPayoutStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'READY', 'PAID', 'FAILED');

ALTER TABLE "User" ADD COLUMN "stripeConnectedAccountId" TEXT,
ADD COLUMN "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Booking" ADD COLUMN "platformFeeAmount" INTEGER,
ADD COLUMN "mentorPayoutAmount" INTEGER,
ADD COLUMN "mentorPayoutStatus" "MentorPayoutStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN "stripeTransferId" TEXT,
ADD COLUMN "transferredAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_stripeConnectedAccountId_key" ON "User"("stripeConnectedAccountId");
CREATE UNIQUE INDEX "Booking_stripeTransferId_key" ON "Booking"("stripeTransferId");
