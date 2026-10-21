export type Currency = "USD" | "IDR";

// The app values two markets: US listings priced in USD and IDX listings
// (Yahoo's .JK suffix) priced in IDR. Currency follows from the ticker, so
// the server never has to trust a currency sent by the client.
export function currencyForTicker(ticker: string): Currency {
  return ticker.trim().toUpperCase().endsWith(".JK") ? "IDR" : "USD";
}

// Other exchange suffixes (.SI, .BA, .MX, ...) are quoted in currencies the
// app does not convert, so their positions could not be valued correctly.
export function isSupportedTicker(ticker: string): boolean {
  const symbol = ticker.trim().toUpperCase();
  return !symbol.includes(".") || symbol.endsWith(".JK");
}
