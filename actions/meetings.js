"use server";

import { db } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { google } from "googleapis";
import { createMentorTransferForBooking } from "@/lib/stripe-connect";

export async function getUserMeetings(type = "upcoming") {
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

  const now = new Date();
  const disputeCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  await db.booking.updateMany({
    where: {
      userId: user.id,
      status: "CONFIRMED",
      endTime: { lt: now },
      event: { isPaid: true },
    },
    data: { status: "AWAITING_CONFIRMATION" },
  });

  const bookingsToComplete = await db.booking.findMany({
    where: {
      userId: user.id,
      status: "AWAITING_CONFIRMATION",
      endTime: { lt: disputeCutoff },
      event: { isPaid: true },
    },
    include: {
      event: true,
      user: true,
    },
  });

  for (const booking of bookingsToComplete) {
    const completedBooking = await db.booking.update({
      where: { id: booking.id },
      data: {
        status: "COMPLETED",
        completedAt: now,
      },
      include: {
        event: true,
        user: true,
      },
    });

    await createMentorTransferForBooking({
      booking: completedBooking,
      db,
    });
  }

  const meetings = await db.booking.findMany({
    where: {
      userId: user.id,
      status: { notIn: ["CANCELLED", "REFUNDED"] },
      startTime: type === "upcoming" ? { gte: now } : { lt: now },
    },
    include: {
      event: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      startTime: type === "upcoming" ? "asc" : "desc",
    },
  });

  return meetings;
}

export async function cancelMeeting(meetingId) {
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

  const meeting = await db.booking.findUnique({
    where: { id: meetingId },
    include: { event: true, user: true },
  });

  if (!meeting || meeting.userId !== user.id) {
    throw new Error("Meeting not found or unauthorized");
  }

  // Cancel the meeting in Google Calendar
  const { data } = await clerkClient.users.getUserOauthAccessToken(
    meeting.user.clerkUserId,
    "oauth_google"
  );

  const token = data[0]?.token;

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  if (meeting.googleEventId) {
    try {
      await calendar.events.delete({
        calendarId: "primary",
        eventId: meeting.googleEventId,
      });
    } catch (error) {
      console.error("Failed to delete event from Google Calendar:", error);
    }
  }

  await db.booking.update({
    where: { id: meetingId },
    data: { status: "CANCELLED" },
  });

  return { success: true };
}

export async function markMeetingCompleted(meetingId) {
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

  const meeting = await db.booking.findUnique({
    where: { id: meetingId },
    include: {
      event: true,
      user: true,
    },
  });

  if (!meeting || meeting.userId !== user.id) {
    throw new Error("Meeting not found or unauthorized");
  }

  if (meeting.status === "DISPUTED") {
    throw new Error("Disputed meetings cannot be marked completed");
  }

  const completedMeeting = await db.booking.update({
    where: { id: meetingId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
    include: {
      event: true,
      user: true,
    },
  });

  if (completedMeeting.event.isPaid) {
    await createMentorTransferForBooking({
      booking: completedMeeting,
      db,
    });
  }

  return { success: true };
}

export async function reportMeetingIssue(meetingId) {
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

  const meeting = await db.booking.findUnique({
    where: { id: meetingId },
  });

  if (!meeting || meeting.userId !== user.id) {
    throw new Error("Meeting not found or unauthorized");
  }

  await db.booking.update({
    where: { id: meetingId },
    data: {
      status: "DISPUTED",
      disputedAt: new Date(),
    },
  });

  return { success: true };
}

export async function markMeetingRefunded(meetingId) {
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

  const meeting = await db.booking.findUnique({
    where: { id: meetingId },
  });

  if (!meeting || meeting.userId !== user.id) {
    throw new Error("Meeting not found or unauthorized");
  }

  await db.booking.update({
    where: { id: meetingId },
    data: { status: "REFUNDED" },
  });

  return { success: true };
}

export async function retryMentorPayout(meetingId) {
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

  const meeting = await db.booking.findUnique({
    where: { id: meetingId },
    include: {
      event: true,
      user: true,
    },
  });

  if (!meeting || meeting.userId !== user.id) {
    throw new Error("Meeting not found or unauthorized");
  }

  if (!meeting.event.isPaid || meeting.status !== "COMPLETED") {
    throw new Error("Only completed paid meetings can be paid out");
  }

  await createMentorTransferForBooking({
    booking: meeting,
    db,
  });

  return { success: true };
}
