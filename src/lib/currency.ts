export interface CountryCurrency {
  name: string;
  currency: string;
  symbol: string;
}

export async function fetchCountries(): Promise<CountryCurrency[]> {
  try {
    const res = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
    const data = await res.json();
    const countries: CountryCurrency[] = [];
    for (const c of data) {
      const currencies = c.currencies;
      if (currencies) {
        const code = Object.keys(currencies)[0];
        if (code) {
          countries.push({
            name: c.name.common,
            currency: code,
            symbol: currencies[code].symbol || code,
          });
        }
      }
    }
    return countries.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [
      { name: 'United States', currency: 'USD', symbol: '$' },
      { name: 'United Kingdom', currency: 'GBP', symbol: '£' },
      { name: 'European Union', currency: 'EUR', symbol: '€' },
      { name: 'India', currency: 'INR', symbol: '₹' },
      { name: 'Japan', currency: 'JPY', symbol: '¥' },
    ];
  }
}

let rateCache: Record<string, { rates: Record<string, number>; ts: number }> = {};

export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  if (from === to) return amount;
  const cacheKey = from;
  const cached = rateCache[cacheKey];
  if (cached && Date.now() - cached.ts < 600000) {
    return +(amount * (cached.rates[to] || 1)).toFixed(2);
  }
  try {
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
    const data = await res.json();
    rateCache[cacheKey] = { rates: data.rates, ts: Date.now() };
    return +(amount * (data.rates[to] || 1)).toFixed(2);
  } catch {
    return amount;
  }
}

export const COMMON_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SGD'];
