import { NextResponse } from "next/server";
import { publicCatalog } from "@/lib/booking/repository";
import { failure } from "@/lib/booking/http";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await publicCatalog(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
