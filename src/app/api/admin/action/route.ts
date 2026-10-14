import { NextResponse } from "next/server";
import { requireActor, checkOrigin } from "@/lib/booking/auth";
import { executeAdmin } from "@/lib/booking/admin";
import { failure, jsonBody } from "@/lib/booking/http";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const actor = await requireActor();
    const result = await executeAdmin(actor, await jsonBody(request));
    return NextResponse.json({ success: true, result });
  } catch (e) {
    return failure(e);
  }
}
