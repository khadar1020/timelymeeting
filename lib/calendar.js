import { clerkClient } from "@clerk/nextjs/server";
import { google } from "googleapis";

export async function createCalendarEvent({ event, bookingData }) {
  const { data } = await clerkClient.users.getUserOauthAccessToken(
    event.user.clerkUserId,
    "oauth_google"
  );

  const token = data[0]?.token;

  if (!token) {
    throw new Error("Event creator has not connected Google Calendar");
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const meetResponse = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary: `${bookingData.name} - ${event.title}`,
      description: bookingData.additionalInfo,
      start: { dateTime: bookingData.startTime },
      end: { dateTime: bookingData.endTime },
      attendees: [{ email: bookingData.email }, { email: event.user.email }],
      conferenceData: {
        createRequest: { requestId: `${event.id}-${Date.now()}` },
      },
    },
  });

  return {
    meetLink: meetResponse.data.hangoutLink,
    googleEventId: meetResponse.data.id,
  };
}
