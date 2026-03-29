import { logger } from "../lib/logger.js";

const EXCHANGE_CACHE: Map<string, { rates: Record<string, number>; updatedAt: Date }> = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

let currencyListCache: Array<{ code: string; name: string; symbol: string }> | null = null;
let currencyListCachedAt: Date | null = null;

export async function getCurrencyList(): Promise<Array<{ code: string; name: string; symbol: string }>> {
  if (currencyListCache && currencyListCachedAt && Date.now() - currencyListCachedAt.getTime() < CACHE_TTL_MS * 48) {
    return currencyListCache;
  }

  try {
    const res = await fetch("https://restcountries.com/v3.1/all?fields=name,currencies");
    if (!res.ok) throw new Error("Failed to fetch countries");
    const data = await res.json() as Array<{ currencies?: Record<string, { name: string; symbol: string }> }>;

    const seen = new Set<string>();
    const currencies: Array<{ code: string; name: string; symbol: string }> = [];

    for (const country of data) {
      if (!country.currencies) continue;
      for (const [code, info] of Object.entries(country.currencies)) {
        if (!seen.has(code)) {
          seen.add(code);
          currencies.push({ code, name: info.name || code, symbol: info.symbol || code });
        }
      }
    }

    currencies.sort((a, b) => a.code.localeCompare(b.code));
    currencyListCache = currencies;
    currencyListCachedAt = new Date();
    return currencies;
  } catch (err) {
    logger.error({ err }, "Failed to fetch currency list");
    return currencyListCache || [{ code: "USD", name: "United States Dollar", symbol: "$" }];
  }
}

export async function getExchangeRates(base: string): Promise<{ base: string; rates: Record<string, number>; updatedAt: Date }> {
  const cached = EXCHANGE_CACHE.get(base);
  if (cached && Date.now() - cached.updatedAt.getTime() < CACHE_TTL_MS) {
    return { base, rates: cached.rates, updatedAt: cached.updatedAt };
  }

  try {
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
    if (!res.ok) throw new Error("Failed to fetch exchange rates");
    const data = await res.json() as { rates: Record<string, number> };

    const updatedAt = new Date();
    EXCHANGE_CACHE.set(base, { rates: data.rates, updatedAt });
    return { base, rates: data.rates, updatedAt };
  } catch (err) {
    logger.error({ err }, "Failed to fetch exchange rates");
    if (cached) return { base, rates: cached.rates, updatedAt: cached.updatedAt };
    return { base, rates: { [base]: 1 }, updatedAt: new Date() };
  }
}

export async function convertAmount(amount: number, from: string, to: string): Promise<{ convertedAmount: number; rate: number }> {
  if (from === to) return { convertedAmount: amount, rate: 1 };
  const { rates } = await getExchangeRates(from);
  const rate = rates[to] ?? 1;
  return { convertedAmount: parseFloat((amount * rate).toFixed(2)), rate };
}
