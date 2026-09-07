import { NextRequest, NextResponse } from "next/server";
import { createBooking, SERVICES, type ServiceKey } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const { startISO, service, name, phone } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof startISO !== "string" ||
    typeof service !== "string" ||
    !(service in SERVICES) ||
    typeof name !== "string" ||
    name.trim().length < 2 ||
    typeof phone !== "string" ||
    phone.trim().length < 6
  ) {
    return NextResponse.json({ error: "Datos incompletos o inválidos." }, { status: 400 });
  }

  if (Number.isNaN(new Date(startISO).getTime())) {
    return NextResponse.json({ error: "Horario inválido." }, { status: 400 });
  }

  try {
    const result = await createBooking({
      startISO,
      service: service as ServiceKey,
      name: name.trim(),
      phone: phone.trim(),
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[booking/reserve]", error);
    return NextResponse.json(
      { error: "No pudimos confirmar el turno. Intentá de nuevo en un momento." },
      { status: 502 }
    );
  }
}
