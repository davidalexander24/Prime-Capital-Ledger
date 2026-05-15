import YahooFinance from 'yahoo-finance2';
import { redis } from './redis';

const yahooFinance = new YahooFinance();

const CACHE_TTL = 900; // 15 minutes

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