"use server";

import prisma from "@/lib/prisma";

export interface AssetSearchResult {
  ticker: string;
  companyName: string;
  source: "db" | "yahoo";
}

export async function searchAssets(
  query: string
): Promise<AssetSearchResult[]> {
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
      source: "db" as const,
    }));

    if (results.length >= 5) return results;

    const dbTickers = new Set(results.map((r) => r.ticker));

    try {
      const YahooFinance = (await import("yahoo-finance2")).default;
      const yf = new YahooFinance();
      const yahooResults = await yf.search(q);

      const quotes = (yahooResults as any)?.quotes ?? [];
      for (const quote of quotes) {
        if (results.length >= 8) break;
        const symbol: string | undefined = quote?.symbol;
        if (!symbol) continue;
        if (dbTickers.has(symbol)) continue;

        const qType: string | undefined = quote?.quoteType;
        if (qType !== "EQUITY" && qType !== "ETF") continue;

        results.push({
          ticker: symbol,
          companyName:
            quote.shortname || quote.longname || symbol,
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
