import { NextRequest, NextResponse } from "next/server";
import { findBookingsByPhone } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const { phone } = (body ?? {}) as Record<string, unknown>;

  if (typeof phone !== "string" || phone.trim().length < 6) {
    return NextResponse.json({ error: "Ingresá un teléfono válido." }, { status: 400 });
  }

  try {
    const bookings = await findBookingsByPhone(phone.trim());
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("[booking/cancel/lookup]", error);
    return NextResponse.json(
      { error: "No pudimos buscar tus turnos. Intentá de nuevo en un momento." },
      { status: 502 }
    );
  }
}
