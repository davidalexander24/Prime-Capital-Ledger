import YahooFinance from 'yahoo-finance2';
import { redis } from './redis';

const yahooFinance = new YahooFinance();

const CACHE_TTL = 900; // 15 minutes
const HISTORY_CACHE_TTL = 60 * 60 * 6; // 6 hours

export type HistoricalPricePoint = {
  date: string;
  close: number;
};

// Fetches the most recent market price
export async function getLatestPrice(ticker: string): Promise<number | null> {
  const cacheKey = `market:price:${ticker}`;

  try {
    const cachedPrice = await redis.get<number>(cacheKey);
    if (cachedPrice !== null) {
      console.log(`[CACHE HIT] ${ticker}: $${cachedPrice}`);
      return cachedPrice;
    }

    const result = await yahooFinance.quote(ticker);
    
    if (!result.regularMarketPrice) {
      console.warn(`[API WARNING] No regular market price returned for ${ticker}`);
      return null;
    }

    const livePrice = result.regularMarketPrice;

    await redis.set(cacheKey, livePrice, { ex: CACHE_TTL });
    console.log(`[CACHE MISS] Fetched & Cached ${ticker}: $${livePrice}`);

    return livePrice;

  } catch (error) {
    console.error(`[SYSTEM ERROR] Failed to retrieve price for ${ticker}:`, error);
    return null;
  }
}

// Fetches the USD to IDR exchange rate
export async function getUsdIdrRate(): Promise<number | null> {
  const cacheKey = `market:rate:USDIDR`;

  try {
    const cachedRate = await redis.get<number>(cacheKey);
    if (cachedRate !== null) {
      console.log(`[CACHE HIT] USD/IDR Rate: Rp ${cachedRate}`);
      return cachedRate;
    }

    const result = await yahooFinance.quote('USDIDR=X');
    
    if (!result.regularMarketPrice) {
      console.warn(`[API WARNING] No exchange rate returned for USDIDR=X`);
      return null;
    }

    const liveRate = result.regularMarketPrice;

    await redis.set(cacheKey, liveRate, { ex: CACHE_TTL });
    console.log(`[CACHE MISS] Fetched & Cached USD/IDR Rate: Rp ${liveRate}`);

    return liveRate;

  } catch (error) {
    console.error(`[SYSTEM ERROR] Failed to retrieve USD/IDR rate:`, error);
    return null;
  }
}

// Fetches the full market quote (Price and Change Percentage)
// Caches the object in Upstash Redis to prevent rate limiting
export async function getMarketQuote(ticker: string): Promise<{ price: number; changePercent: number } | null> {
  const cacheKey = `market:quote:${ticker}`;

  try {
    const cachedQuote = await redis.get<{ price: number; changePercent: number }>(cacheKey);
    if (cachedQuote !== null) {
      return cachedQuote;
    }

    const result = await yahooFinance.quote(ticker);
    
    if (!result.regularMarketPrice) return null;

    const quote = {
      price: result.regularMarketPrice,
      changePercent: result.regularMarketChangePercent || 0 
    };

    await redis.set(cacheKey, quote, { ex: CACHE_TTL });
    
    return quote;

  } catch (error) {
    console.error(`[SYSTEM ERROR] Failed to retrieve quote for ${ticker}:`, error);
    return null;
  }
}

export async function getHistoricalPrices(
  ticker: string,
  start: Date,
  end: Date
): Promise<HistoricalPricePoint[]> {
  const startKey = start.toISOString().split("T")[0];
  const endKey = end.toISOString().split("T")[0];
  const cacheKey = `market:history:${ticker}:${startKey}:${endKey}`;

  try {
    const cached = await redis.get<HistoricalPricePoint[]>(cacheKey);
    if (cached && cached.length) {
      return cached;
    }
  } catch (error) {
    console.warn(`[CACHE WARNING] Failed to read history for ${ticker}:`, error);
  }

  try {
    const period1 = new Date(start);
    const period2 = new Date(end);
    period2.setUTCDate(period2.getUTCDate() + 1);

    const result = await yahooFinance.chart(ticker, {
      period1,
      period2,
      interval: "1d",
    });

    const timestamps = (result as any)?.timestamp ?? (result as any)?.timestamps ?? [];
    const quote = (result as any)?.indicators?.quote?.[0];
    const adjclose = (result as any)?.indicators?.adjclose?.[0]?.adjclose;
    const closes = adjclose ?? quote?.close ?? [];

    const length = Math.min(timestamps.length, closes.length);
    const cleaned: HistoricalPricePoint[] = [];

    for (let i = 0; i < length; i += 1) {
      const ts = timestamps[i];
      const close = closes[i];

      if (!ts || close == null || Number.isNaN(Number(close))) {
        continue;
      }

      cleaned.push({
        date: new Date(ts * 1000).toISOString().split("T")[0],
        close: Number(close),
      });
    }

    try {
      if (cleaned.length) {
        await redis.set(cacheKey, cleaned, { ex: HISTORY_CACHE_TTL });
      }
    } catch (error) {
      console.warn(`[CACHE WARNING] Failed to cache history for ${ticker}:`, error);
    }

    return cleaned;
  } catch (error) {
    console.error(`[SYSTEM ERROR] Failed to retrieve history for ${ticker}:`, error);
    return [];
  }
}