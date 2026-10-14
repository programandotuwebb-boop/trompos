import { db } from "@/lib/booking/db";
import { bookingResult } from "@/lib/booking/service";
import { phone } from "@/lib/booking/validation";
import { rateLimit } from "@/lib/booking/auth";
import { failure, jsonBody } from "@/lib/booking/http";
import type { Booking } from "@/lib/booking/repository";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  try {
    const body = (await jsonBody(request)) as { phone: unknown };
    const digits = phone.parse(body.phone);
    await rateLimit(`lookup:${digits}`, 10);
    const rows = (
      await db().query<Booking>(
        "SELECT b.*,p.name professional_name FROM bookings b JOIN professionals p ON p.id=b.professional_id WHERE customer_phone=$1 AND end_at>now() AND status='CONFIRMED' ORDER BY start_at",
        [digits],
      )
    ).rows;
    return NextResponse.json(
      { bookings: rows.map(bookingResult) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
