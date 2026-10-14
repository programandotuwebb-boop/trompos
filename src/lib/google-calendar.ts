// Read-only historical import helper; never imported by the application.
import { google } from "googleapis";
import { getEnv } from "@/lib/env";
export function getCalendarId(): string {
  return getEnv("GOOGLE_CALENDAR_ID");
}

export function getCalendarClient() {
  const email = getEnv("GOOGLE_CLIENT_EMAIL");
  const key = getEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });

  return google.calendar({ version: "v3", auth });
}
