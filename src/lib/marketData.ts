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
    console.log(`[CACHE MISS] USD/IDR Rate: Rp ${liveRate}`);

    return liveRate;

  } catch (error) {
    console.error(`[SYSTEM ERROR] Failed to retrieve USD/IDR rate:`, error);
    return null;
  }
}

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

    const quotes = result?.quotes ?? [];
    const cleaned: HistoricalPricePoint[] = [];

    for (const q of quotes) {
      const close = q.adjclose ?? q.close;
      if (!q.date || close == null || Number.isNaN(Number(close))) {
        continue;
      }

      cleaned.push({
        date: new Date(q.date).toISOString().split("T")[0],
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

// Batched latest price for many tickers. One Redis mget for all cache hits,
// parallel Yahoo fetches for misses, and a single pipelined writeback.
export async function getLatestPrices(
  tickers: string[]
): Promise<Map<string, number | null>> {
  const result = new Map<string, number | null>();
  const unique = Array.from(new Set(tickers));
  if (unique.length === 0) return result;

  const keys = unique.map((t) => `market:price:${t}`);
  let cached: (number | null)[] = [];
  try {
    cached = await redis.mget<(number | null)[]>(...keys);
  } catch (error) {
    console.warn(`[CACHE WARNING] mget prices failed:`, error);
    cached = new Array(unique.length).fill(null);
  }

  const misses: string[] = [];
  unique.forEach((ticker, i) => {
    const value = cached[i];
    if (value !== null && value !== undefined) {
      result.set(ticker, value);
    } else {
      misses.push(ticker);
    }
  });

  if (misses.length > 0) {
    const fetched = await Promise.all(
      misses.map(async (ticker) => {
        try {
          const quote = await yahooFinance.quote(ticker);
          return { ticker, price: quote?.regularMarketPrice ?? null };
        } catch (error) {
          console.error(`[SYSTEM ERROR] Failed to retrieve price for ${ticker}:`, error);
          return { ticker, price: null };
        }
      })
    );

    const pipeline = redis.pipeline();
    let writes = 0;
    for (const { ticker, price } of fetched) {
      result.set(ticker, price);
      if (price !== null) {
        pipeline.set(`market:price:${ticker}`, price, { ex: CACHE_TTL });
        writes++;
      }
    }
    if (writes > 0) {
      try {
        await pipeline.exec();
      } catch (error) {
        console.warn(`[CACHE WARNING] pipeline writeback (prices) failed:`, error);
      }
    }
  }

  console.log(
    `[BATCH] prices: ${unique.length - misses.length} hit, ${misses.length} miss`
  );
  return result;
}

// Batched price + daily change for many tickers. Same mget/pipeline strategy.
export async function getMarketQuotes(
  tickers: string[]
): Promise<Map<string, { price: number; changePercent: number } | null>> {
  const result = new Map<string, { price: number; changePercent: number } | null>();
  const unique = Array.from(new Set(tickers));
  if (unique.length === 0) return result;

  const keys = unique.map((t) => `market:quote:${t}`);
  type Quote = { price: number; changePercent: number };
  let cached: (Quote | null)[] = [];
  try {
    cached = await redis.mget<(Quote | null)[]>(...keys);
  } catch (error) {
    console.warn(`[CACHE WARNING] mget quotes failed:`, error);
    cached = new Array(unique.length).fill(null);
  }

  const misses: string[] = [];
  unique.forEach((ticker, i) => {
    const value = cached[i];
    if (value) {
      result.set(ticker, value);
    } else {
      misses.push(ticker);
    }
  });

  if (misses.length > 0) {
    const fetched = await Promise.all(
      misses.map(async (ticker) => {
        try {
          const r = await yahooFinance.quote(ticker);
          if (!r?.regularMarketPrice) return { ticker, quote: null };
          return {
            ticker,
            quote: {
              price: r.regularMarketPrice,
              changePercent: r.regularMarketChangePercent || 0,
            } as Quote,
          };
        } catch (error) {
          console.error(`[SYSTEM ERROR] Failed to retrieve quote for ${ticker}:`, error);
          return { ticker, quote: null };
        }
      })
    );

    const pipeline = redis.pipeline();
    let writes = 0;
    for (const { ticker, quote } of fetched) {
      result.set(ticker, quote);
      if (quote) {
        pipeline.set(`market:quote:${ticker}`, quote, { ex: CACHE_TTL });
        writes++;
      }
    }
    if (writes > 0) {
      try {
        await pipeline.exec();
      } catch (error) {
        console.warn(`[CACHE WARNING] pipeline writeback (quotes) failed:`, error);
      }
    }
  }

  console.log(
    `[BATCH] quotes: ${unique.length - misses.length} hit, ${misses.length} miss`
  );
  return result;
}