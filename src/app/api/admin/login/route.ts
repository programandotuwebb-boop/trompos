import { NextResponse } from "next/server";
import { z } from "zod";
import { checkOrigin, login, rateLimit } from "@/lib/booking/auth";
import { failure, jsonBody } from "@/lib/booking/http";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await rateLimit(
      `login-ip:${request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"}`,
      30,
    );
    const body = z
      .object({
        email: z.email().transform((s) => s.toLowerCase()),
        password: z.string().min(1).max(256),
      })
      .parse(await jsonBody(request));
    await login(body.email, body.password);
    return NextResponse.json({ success: true });
  } catch (e) {
    return failure(e);
  }
}
