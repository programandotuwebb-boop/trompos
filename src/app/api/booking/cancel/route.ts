import { changeBooking, bookingResult } from "@/lib/booking/service";
import { phone, uuid } from "@/lib/booking/validation";
import { rateLimit } from "@/lib/booking/auth";
import { failure, jsonBody } from "@/lib/booking/http";
import { NextResponse } from "next/server";
import { sendCancellationEmail } from "@/lib/email";
export async function POST(request: Request) {
  try {
    const body = (await jsonBody(request)) as {
      phone: unknown;
      eventId: unknown;
    };
    const digits = phone.parse(body.phone);
    await rateLimit(`cancel:${digits}`, 10);
    const id = uuid.parse(
      typeof body.eventId === "string"
        ? body.eventId.replace(/^db:/, "")
        : body.eventId,
    );
    const booking = await changeBooking(id, "CANCEL", { phone: digits });
    const summary = bookingResult(booking);
    if (booking.customer_email)
      await sendCancellationEmail({
        to: booking.customer_email,
        name: booking.customer_name,
        serviceLabel: booking.service_name,
        dateLabel: summary.dateLabel,
        timeLabel: summary.timeLabel,
      });
    return NextResponse.json({ success: true });
  } catch (e) {
    return failure(e);
  }
}
