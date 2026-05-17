"use server";

import { PDFParse } from "pdf-parse";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const globalWithPolyfills = globalThis as typeof globalThis & {
  DOMMatrix?: typeof globalThis.DOMMatrix;
  Path2D?: typeof globalThis.Path2D;
};

if (typeof globalWithPolyfills.DOMMatrix === "undefined") {
  globalWithPolyfills.DOMMatrix = class DOMMatrix { } as typeof globalThis.DOMMatrix;
}
if (typeof globalWithPolyfills.Path2D === "undefined") {
  globalWithPolyfills.Path2D = class Path2D { } as typeof globalThis.Path2D;
}

const INDONESIAN_MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, jun: 5,
  jul: 6, agt: 7, sep: 8, okt: 9, nov: 10, des: 11,
};

export interface ParsedRow {
  type: "BUY" | "SELL";
  ticker: string;
  companyName: string;
  quantity: number;
  quantityRaw?: string;
  price: number;
  priceRaw?: string;
  fee: number;
  feeRaw?: string;
  date: string;
  currency: string;
}

export type ParseResult =
  | { success: true; data: { sourceDate: string; rows: ParsedRow[] } }
  | { success: false; error: string };

export type CommitResult =
  | { success: true; message: string; imported: number; skipped: number }
  | { success: false; message: string };

async function resolveCompanyName(
  ticker: string,
  cache: Map<string, string>
): Promise<string> {
  const placeholder = `${ticker} Inc`;
  if (cache.has(ticker)) return cache.get(ticker)!;
  try {
    const YahooFinance = (await import("yahoo-finance2")).default;
    const yf = new YahooFinance();
    const q = await yf.quote(ticker) as { longName?: string; shortName?: string };
    const name = q?.longName ?? q?.shortName ?? placeholder;
    cache.set(ticker, name);
    return name;
  } catch (error: unknown) {
    console.warn(`Yahoo name lookup failed for ${ticker}:`, error);
    cache.set(ticker, placeholder);
    return placeholder;
  }
}

export async function parsePdfTransactions(
  formData: FormData
): Promise<ParseResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No file provided." };
    }

    const name = (file.name ?? "").toLowerCase();
    const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
    if (!isPdf) {
      if (name.endsWith(".csv")) {
        return { success: false, error: "CSV import not implemented yet." };
      }
      return { success: false, error: "Unsupported file type. Upload a PDF." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    let text = "";
    try {
      const textResult = await parser.getText();
      text = textResult?.text ?? "";
    } finally {
      await parser.destroy?.();
    }

    const dateRegex =
      /Tgl\.\s*Transaksi\s*:\s*(?:[A-Za-z]+,\s*)?(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i;
    let sourceDate: Date | null = null;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      const day = parseInt(dateMatch[1], 10);
      const monthStr = dateMatch[2].toLowerCase().substring(0, 3);
      const year = parseInt(dateMatch[3], 10);
      const month = INDONESIAN_MONTHS[monthStr];
      if (month !== undefined && !Number.isNaN(day) && !Number.isNaN(year)) {
        sourceDate = new Date(Date.UTC(year, month, day));
      }
    }

    type RawRow = {
      type: "BUY" | "SELL";
      ticker: string;
      price: number;
      priceRaw: string;
      quantity: number;
      quantityRaw: string;
      fee: number;
      feeRaw: string;
      dateStr: string;
      currency: string;
    };
    const rawRows: RawRow[] = [];

    // Ajaib Parsing
    if (sourceDate) {
      const beliMatch = text.match(/\bBeli\b/i);
      const jualMatch = text.match(/\bJual\b/i);
      const beliIdx = beliMatch?.index ?? -1;
      const jualIdx = jualMatch?.index ?? -1;

      const rowRegex =
        /(LIMIT|MARKET|STOP|MKT)\s+([A-Z0-9.]+)\s+\$([\d,.]+)\s+([\d,.]+)\s+\$([\d,.]+)\s+\$([\d,.]+)/gi;

      for (const m of text.matchAll(rowRegex)) {
        const idx = m.index ?? 0;
        let type: "BUY" | "SELL" | null = null;
        if (beliIdx !== -1 && idx > beliIdx && (jualIdx === -1 || idx < jualIdx)) {
          type = "BUY";
        } else if (jualIdx !== -1 && idx > jualIdx) {
          type = "SELL";
        }
        if (!type) continue;

        const ticker = m[2].toUpperCase();
        const priceRaw = m[3].replace(/,/g, "");
        const quantityRaw = m[4].replace(/,/g, "");
        const feeRaw = m[5].replace(/,/g, "");
        const totalRaw = m[6].replace(/,/g, "");

        const price = Number(priceRaw);
        const quantity = Number(quantityRaw);
        const total = Number(totalRaw);

        const fee = type === "BUY"
          ? total - (quantity * price)
          : (quantity * price) - total;

        if (!Number.isFinite(quantity) || !Number.isFinite(price)) continue;
        if (!(quantity > 0) || !(price > 0)) continue;

        rawRows.push({
          type,
          ticker,
          price,
          priceRaw,
          quantity,
          quantityRaw,
          fee,
          feeRaw,
          dateStr: sourceDate.toISOString(),
          currency: "USD",
        });
      }
    } else {
      // Stockbit Parsing
      const stockbitRowRegex = /(\d{2})\/(\d{2})\/(\d{4})\s+([A-Z0-9]+)\s+(B|S)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)(?:\s+([\d,.]+))?/gi;

      for (const m of text.matchAll(stockbitRowRegex)) {
        const day = parseInt(m[1], 10);
        const month = parseInt(m[2], 10) - 1;
        const year = parseInt(m[3], 10);
        const dateObj = new Date(Date.UTC(year, month, day));

        const ticker = m[4].toUpperCase();
        const typeStr = m[5].toUpperCase();
        const type: "BUY" | "SELL" = typeStr === "B" ? "BUY" : "SELL";

        const lotRaw = m[6].replace(/,/g, "");
        const priceRaw = m[7].replace(/,/g, "");
        const buyValRaw = m[8].replace(/,/g, "");
        const sellValRaw = m[9].replace(/,/g, "");
        const taxRaw = m[10] ? m[10].replace(/,/g, "") : "0";

        const lot = Number(lotRaw);
        const quantity = lot * 100; // 1 Lot = 100 shares
        const price = Number(priceRaw);
        const buyVal = Number(buyValRaw);
        const sellVal = Number(sellValRaw);

        let total = 0;
        if (type === "BUY") {
          total = buyVal;
        } else {
          total = sellVal;
        }

        const fee = type === "BUY"
          ? total - (quantity * price)
          : (quantity * price) - total;

        if (!Number.isFinite(quantity) || !Number.isFinite(price)) continue;
        if (!(quantity > 0) || !(price > 0)) continue;

        rawRows.push({
          type,
          ticker: ticker + ".JK", // Append .JK for Indonesian stocks
          price,
          priceRaw,
          quantity,
          quantityRaw: quantity.toString(),
          fee,
          feeRaw: fee.toString(),
          dateStr: dateObj.toISOString(),
          currency: "IDR",
        });
      }

      if (rawRows.length === 0) {
        const preview = text.substring(0, 300).replace(/\s+/g, " ");
        return {
          success: false,
          error: `Could not find transaction date or valid rows. PDF preview: "${preview}..."`,
        };
      }
    }


    const nameCache = new Map<string, string>();
    const rows: ParsedRow[] = await Promise.all(
      rawRows.map(async (r) => ({
        type: r.type,
        ticker: r.ticker,
        companyName: await resolveCompanyName(r.ticker, nameCache),
        quantity: r.quantity,
        quantityRaw: r.quantityRaw,
        price: r.price,
        priceRaw: r.priceRaw,
        fee: r.fee,
        feeRaw: r.feeRaw,
        date: r.dateStr,
        currency: r.currency,
      }))
    );

    return {
      success: true,
      data: { sourceDate: rawRows.length > 0 ? rawRows[0].dateStr : new Date().toISOString(), rows },
    };
  } catch (error: unknown) {
    console.error("PDF parse error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse PDF.",
    };
  }
}

export async function commitParsedTransactions(
  rows: ParsedRow[],
  filename: string
): Promise<CommitResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, message: "Unauthorized" };
    }
    const userId = session.user.id;

    if (!rows || rows.length === 0) {
      return { success: false, message: "No rows to import." };
    }

    let imported = 0;
    let skipped = 0;

    await prisma.$transaction(async (tx) => {
      const importSession = await tx.importSession.create({
        data: {
          userId,
          filename,
          source: "Brokerage PDF"
        }
      });

      for (const r of rows) {
        const ticker = r.ticker.toUpperCase();
        const placeholder = `${ticker} Inc`;
        const incomingName = r.companyName?.trim() || placeholder;

        const existingAsset = await tx.asset.findUnique({ where: { ticker } });
        const shouldUpdateName =
          existingAsset &&
          incomingName !== placeholder &&
          (existingAsset.companyName === placeholder ||
            existingAsset.companyName.trim().length === 0);

        const asset = await tx.asset.upsert({
          where: { ticker },
          update: shouldUpdateName ? { companyName: incomingName } : {},
          create: {
            ticker,
            companyName: incomingName,
            currency: r.currency,
          },
        });

        const txDate = new Date(r.date);

        const quantityValue = r.quantityRaw ?? r.quantity;
        const priceValue = r.priceRaw ?? r.price;
        const feeValue = r.feeRaw ?? r.fee;

        const dup = await tx.transaction.findFirst({
          where: {
            userId,
            assetId: asset.id,
            type: r.type,
            date: txDate,
            executionPrice: priceValue,
            quantity: quantityValue,
          },
        });

        if (dup) {
          skipped++;
          continue;
        }

        await tx.transaction.create({
          data: {
            userId,
            assetId: asset.id,
            importSessionId: importSession.id,
            type: r.type,
            quantity: quantityValue,
            executionPrice: priceValue,
            fee: feeValue,
            date: txDate,
          },
        });
        imported++;
      }
    }, {
      maxWait: 15000, // 15s to get a connection
      timeout: 120000, // 2 minutes to process all rows
    });

    const parts = [
      `Imported ${imported} transaction${imported === 1 ? "" : "s"}`,
    ];
    if (skipped > 0) {
      parts.push(
        `skipped ${skipped} duplicate${skipped === 1 ? "" : "s"}`
      );
    }
    return {
      success: true,
      message: parts.join(", ") + ".",
      imported,
      skipped,
    };
  } catch (error: unknown) {
    console.error("PDF commit error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to import transactions.",
    };
  }
}
