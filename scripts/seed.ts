import { loadEnvConfig } from "@next/env";
import { db, transaction } from "../src/lib/booking/db";
loadEnvConfig(process.cwd());
async function main() {
  await transaction(async (c) => {
    for (const [key, name, duration, price] of [
      ["corte", "Corte de pelo", 45, 30000],
      ["corte_barba", "Corte + Barba", 60, 50000],
    ])
      await c.query(
        "INSERT INTO services(legacy_key,name,duration_minutes,price) VALUES($1,$2,$3,$4) ON CONFLICT(legacy_key) DO NOTHING",
        [key, name, duration, price],
      );
    const people = [
      {
        name: "Tomás",
        slug: "tomas",
        days: [2, 3, 4, 5, 6],
        blocks: [
          [600, 810],
          [870, 1140],
        ],
        legacy: true,
      },
      {
        name: "Mateo",
        slug: "mateo",
        days: [1, 2, 3, 4, 5],
        blocks: [
          [540, 780],
          [840, 1080],
        ],
        legacy: false,
      },
      {
        name: "Franco",
        slug: "franco",
        days: [3, 4, 5, 6],
        blocks: [
          [660, 900],
          [960, 1200],
        ],
        legacy: false,
      },
    ];
    for (const p of people) {
      const { rows } = await c.query(
        "INSERT INTO professionals(name,slug,legacy_calendar,description) VALUES($1,$2,$3,$4) ON CONFLICT(slug) DO NOTHING RETURNING id",
        [p.name, p.slug, p.legacy, "Corte de pelo · Corte + Barba"],
      );
      if (!rows.length) continue;
      const id = rows[0].id;
      await c.query(
        "INSERT INTO professional_services SELECT $1,id FROM services",
        [id],
      );
      for (const day of p.days)
        for (const [start, end] of p.blocks)
          await c.query(
            "INSERT INTO working_hours(professional_id,day_of_week,start_minute,end_minute)VALUES($1,$2,$3,$4)",
            [id, day, start, end],
          );
    }
  });
  console.log(
    "Seed listo: profesionales inactivos hasta revisar horarios/precios.",
  );
}
main().finally(() => db().end());
