import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { BookingError } from "./validation";
export function failure(error: unknown) {
  if (error instanceof BookingError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof ZodError || error instanceof SyntaxError)
    return NextResponse.json(
      { error: "Datos inválidos. Revisá los campos." },
      { status: 400 },
    );
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    ["23P01", "23505", "23503"].includes(String(error.code))
  )
    return NextResponse.json(
      {
        error:
          "Conflicto con datos o reservas existentes. Revisá la operación.",
      },
      { status: 409 },
    );
  console.error(
    "[booking-api]",
    error instanceof Error ? error.message : "Error desconocido",
  );
  return NextResponse.json(
    { error: "No pudimos completar la operación. Intentá nuevamente." },
    { status: 503 },
  );
}
export async function jsonBody(request: Request) {
  const text = await request.text();
  if (text.length > 40000)
    throw new BookingError("Solicitud demasiado grande.", 413);
  return JSON.parse(text);
}
