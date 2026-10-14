import { NextResponse } from "next/server";
import { requireActor } from "@/lib/booking/auth";
import { db } from "@/lib/booking/db";
import { failure } from "@/lib/booking/http";
import { DAY, localDate, midnight, weekStart } from "@/lib/booking/time";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const actor = await requireActor(),
      q = new URL(request.url).searchParams;
    const view = z
      .enum(["today", "week", "upcoming"])
      .parse(q.get("view") ?? "today");
    const date = q.get("date")
      ? z.iso.date().parse(q.get("date"))
      : localDate();
    const from =
        view === "week" ? weekStart(0, midnight(date)) : midnight(date),
      to = from + (view === "today" ? 1 : view === "week" ? 7 : 63) * DAY;
    const professional =
      actor.role === "OWNER"
        ? q.get("professional")
          ? z.uuid().parse(q.get("professional"))
          : null
        : actor.professional_id;
    const service = q.get("service") ? z.uuid().parse(q.get("service")) : null;
    const status = q.get("status")
      ? z
          .enum(["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"])
          .parse(q.get("status"))
      : null;
    const page = z.coerce
      .number()
      .int()
      .min(0)
      .max(100000)
      .parse(q.get("page") ?? 0);
    const filter =
      "b.start_at>=$1 AND b.start_at<$2 AND ($3::uuid IS NULL OR b.professional_id=$3) AND ($4::uuid IS NULL OR b.service_id=$4) AND ($5::text IS NULL OR b.status=$5)";
    const params = [
      new Date(from),
      new Date(to),
      professional,
      service,
      status,
    ];
    const bookings = (
      await db().query(
        `SELECT b.*,p.name professional_name FROM bookings b JOIN professionals p ON p.id=b.professional_id WHERE ${filter} ORDER BY b.start_at,b.id LIMIT 200 OFFSET $6`,
        [...params, page * 200],
      )
    ).rows;
    const total = (
      await db().query(
        `SELECT count(*)::int total FROM bookings b WHERE ${filter}`,
        params,
      )
    ).rows[0].total;
    const summary = (
      await db().query(
        `SELECT b.professional_id,count(*)::int count FROM bookings b WHERE ${filter} AND b.status='CONFIRMED' GROUP BY b.professional_id`,
        params,
      )
    ).rows;
    const own = actor.role === "OWNER" ? null : actor.professional_id;
    const professionals = (
      await db().query(
        `SELECT p.*,coalesce(array_agg(ps.service_id)FILTER(WHERE ps.service_id IS NOT NULL),'{}') service_ids FROM professionals p LEFT JOIN professional_services ps ON ps.professional_id=p.id WHERE ($1::uuid IS NULL OR p.id=$1) GROUP BY p.id ORDER BY p.name`,
        [own],
      )
    ).rows;
    const services = (
      await db().query(
        "SELECT s.* FROM services s WHERE $1::uuid IS NULL OR EXISTS(SELECT 1 FROM professional_services ps WHERE ps.service_id=s.id AND ps.professional_id=$1) ORDER BY s.name",
        [own],
      )
    ).rows;
    const hours = (
      await db().query(
        "SELECT * FROM working_hours WHERE $1::uuid IS NULL OR professional_id=$1 ORDER BY day_of_week,start_minute",
        [own],
      )
    ).rows;
    const exceptions = (
      await db().query(
        "SELECT e.*,e.date_from::text,e.date_to::text FROM availability_exceptions e WHERE $1::uuid IS NULL OR professional_id=$1 ORDER BY e.date_from",
        [own],
      )
    ).rows;
    const users =
      actor.role === "OWNER"
        ? (
            await db().query(
              "SELECT id,email,role,professional_id,active,can_block FROM admin_users ORDER BY email",
            )
          ).rows
        : [];
    return NextResponse.json(
      {
        actor,
        bookings,
        summary,
        pagination: { page, total, hasMore: (page + 1) * 200 < total },
        professionals: professionals.map((p) =>
          actor.role === "OWNER" ? p : { id: p.id, name: p.name },
        ),
        services,
        hours,
        exceptions,
        users,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
