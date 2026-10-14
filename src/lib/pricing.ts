import { db } from "@/lib/booking/db";
const FALLBACK_PRICES: Record<string, number> = {
  "Corte de pelo": 30000,
  "Corte + Barba": 50000,
};
export async function getServicePrices(): Promise<Record<string, number>> {
  const rows = (
    await db().query(
      "SELECT legacy_key,price FROM services WHERE legacy_key IS NOT NULL",
    )
  ).rows;
  const prices = { ...FALLBACK_PRICES };
  for (const row of rows) {
    const label =
      row.legacy_key === "corte"
        ? "Corte de pelo"
        : row.legacy_key === "corte_barba"
          ? "Corte + Barba"
          : null;
    if (label) prices[label] = row.price;
  }
  return prices;
}
