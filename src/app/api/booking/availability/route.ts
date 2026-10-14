import { availability } from "@/lib/booking/service";
import { failure } from "@/lib/booking/http";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get("service");
  const weekOffset = Number(searchParams.get("weekOffset") ?? "0");
  const MAX_WEEK_OFFSET = 8;
  try {
    const serviceId = z.uuid().parse(service);
    const professionalId = z
      .union([z.uuid(), z.literal("any")])
      .parse(searchParams.get("professionalId") ?? "any");
    z.number().int().min(0).max(MAX_WEEK_OFFSET).parse(weekOffset);
    return NextResponse.json(
      { days: await availability(serviceId, professionalId, weekOffset) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
