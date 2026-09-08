import { google } from "googleapis";
import { unstable_cache } from "next/cache";
import { getEnv } from "@/lib/env";

const SHEET_RANGE = "A2:B3";

// Precios de respaldo: se usan si por algún motivo no se puede leer la
// planilla (permisos mal configurados, planilla caída, celda con un valor
// que no es un número, etc.), para que el sitio nunca se quede sin mostrar
// un precio.
const FALLBACK_PRICES: Record<string, number> = {
  "Corte de pelo": 30000,
  "Corte + Barba": 50000,
};

function getSheetsClient() {
  const email = getEnv("GOOGLE_CLIENT_EMAIL");
  const key = getEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({ version: "v4", auth });
}

async function fetchPricesFromSheet(): Promise<Record<string, number>> {
  const sheets = getSheetsClient();
  const spreadsheetId = getEnv("GOOGLE_SHEETS_ID");

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: SHEET_RANGE,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const rows = response.data.values ?? [];
  const prices: Record<string, number> = { ...FALLBACK_PRICES };

  for (const row of rows) {
    const [name, rawPrice] = row;
    if (typeof name !== "string") continue;

    const trimmedName = name.trim();
    const numericPrice = Number(rawPrice);

    // Si el nombre no es uno de los servicios conocidos, o el precio no es
    // un número válido, se ignora esa fila puntual y queda el respaldo.
    if (trimmedName in FALLBACK_PRICES && Number.isFinite(numericPrice) && numericPrice > 0) {
      prices[trimmedName] = numericPrice;
    }
  }

  return prices;
}

const getCachedPrices = unstable_cache(
  async () => {
    try {
      return await fetchPricesFromSheet();
    } catch (error) {
      console.error("[pricing] No se pudo leer la planilla de precios:", error);
      return { ...FALLBACK_PRICES };
    }
  },
  ["service-prices"],
  { revalidate: 900, tags: ["service-prices"] }
);

export async function getServicePrices(): Promise<Record<string, number>> {
  return getCachedPrices();
}

export function formatPrice(price: number): string {
  return `$${price.toLocaleString("es-AR")}`;
}
