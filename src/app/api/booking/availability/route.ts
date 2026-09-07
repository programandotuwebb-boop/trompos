import { NextRequest, NextResponse } from "next/server";
import { getWeekAvailability, SERVICES, type ServiceKey } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_WEEK_OFFSET = 8;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get("service");
  const weekOffset = Number(searchParams.get("weekOffset") ?? "0");

  if (!service || !(service in SERVICES)) {
    return NextResponse.json({ error: "Servicio inválido." }, { status: 400 });
  }
  if (!Number.isInteger(weekOffset) || weekOffset < 0 || weekOffset > MAX_WEEK_OFFSET) {
    return NextResponse.json({ error: "Semana inválida." }, { status: 400 });
  }

  try {
    const days = await getWeekAvailability(service as ServiceKey, weekOffset);
    return NextResponse.json({ days });
  } catch (error) {
    console.error("[booking/availability]", error);
    return NextResponse.json(
      { error: "No pudimos cargar los turnos. Intentá de nuevo en un momento." },
      { status: 502 }
    );
  }
}
