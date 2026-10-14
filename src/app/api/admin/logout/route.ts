import { NextResponse } from "next/server";
import { checkOrigin, logout } from "@/lib/booking/auth";
import { failure } from "@/lib/booking/http";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await logout();
    return NextResponse.json({ success: true });
  } catch (e) {
    return failure(e);
  }
}
