import { reserve, bookingResult } from "@/lib/booking/service";
import { failure, jsonBody } from "@/lib/booking/http";
import { reservationInput } from "@/lib/booking/validation";
import { rateLimit } from "@/lib/booking/auth";
import { NextRequest, NextResponse } from "next/server";
import { sendBookingConfirmationEmail } from "@/lib/email";
export async function POST(request: NextRequest) {
  try {
    const body = await jsonBody(request);
    await rateLimit(
      `reserve-ip:${request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"}`,
      30,
      3600,
    );
    const input = reservationInput.parse(body);
    await rateLimit(`reserve:${input.phone}`, 12, 3600);
    const booking = await reserve(input);
    if (booking.customer_email)
      await sendBookingConfirmationEmail({
        to: booking.customer_email,
        name: booking.customer_name,
        serviceLabel: `${booking.service_name} · ${booking.professional_name}`,
        dateLabel: bookingResult(booking).dateLabel,
        timeLabel: bookingResult(booking).timeLabel,
      });
    return NextResponse.json({
      success: true,
      booking: bookingResult(booking),
    });
  } catch (error) {
    return failure(error);
  }
}
