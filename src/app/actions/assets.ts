"use server";

import prisma from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { currencyForTicker, isSupportedTicker, type Currency } from "@/lib/currency";

export interface AssetSearchResult {
  ticker: string;
  companyName: string;
  currency: Currency;
  source: "db" | "yahoo";
}

export async function searchAssets(
  query: string
): Promise<AssetSearchResult[]> {
  const userId = await getSessionUserId();
  if (!userId) return [];
  if (!query || query.trim().length < 1) return [];

  const q = query.trim();

  try {
    const dbAssets = await prisma.asset.findMany({
      where: {
        OR: [
          { ticker: { contains: q, mode: "insensitive" } },
          { companyName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { ticker: true, companyName: true },
    });

    const results: AssetSearchResult[] = dbAssets.map((a) => ({
      ticker: a.ticker,
      companyName: a.companyName,
      currency: currencyForTicker(a.ticker),
      source: "db" as const,
    }));

    if (results.length >= 5) return results;

    const dbTickers = new Set(results.map((r) => r.ticker));

    try {
      const YahooFinance = (await import("yahoo-finance2")).default;
      const yf = new YahooFinance();
      // Yahoo's search payload no longer matches the library's schema, so
      // validation rejects every response. The fields read below are guarded.
      const yahooResults = await yf.search(q, {}, { validateResult: false }) as {
        quotes?: Array<{
          symbol?: string;
          quoteType?: string;
          shortname?: string;
          longname?: string;
        }>;
      };

      const quotes = yahooResults.quotes ?? [];
      for (const quote of quotes) {
        if (results.length >= 8) break;
        const symbol: string | undefined = quote?.symbol;
        if (!symbol) continue;
        if (dbTickers.has(symbol)) continue;
        if (!isSupportedTicker(symbol)) continue;

        const qType: string | undefined = quote?.quoteType;
        if (qType !== "EQUITY" && qType !== "ETF") continue;

        results.push({
          ticker: symbol,
          companyName:
            quote.shortname || quote.longname || symbol,
          currency: currencyForTicker(symbol),
          source: "yahoo",
        });
      }
    } catch (yahooErr) {
      console.error("Yahoo Finance search error:", yahooErr);
    }

    return results;
  } catch (error) {
    console.error("Asset search error:", error);
    return [];
  }
}
