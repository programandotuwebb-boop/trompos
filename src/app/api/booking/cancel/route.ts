import { NextRequest, NextResponse } from "next/server";
import { cancelBooking } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const { eventId, phone } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof eventId !== "string" ||
    eventId.length === 0 ||
    typeof phone !== "string" ||
    phone.trim().length < 6
  ) {
    return NextResponse.json({ error: "Datos incompletos o inválidos." }, { status: 400 });
  }

  try {
    const result = await cancelBooking({ eventId, phone: phone.trim() });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[booking/cancel]", error);
    return NextResponse.json(
      { error: "No pudimos cancelar el turno. Intentá de nuevo en un momento." },
      { status: 502 }
    );
  }
}
