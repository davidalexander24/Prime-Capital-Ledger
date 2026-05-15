"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// pdf-parse depends on pdf.js, which expects browser globals.
if (typeof global.DOMMatrix === "undefined") {
  (global as any).DOMMatrix = class DOMMatrix {};
}
if (typeof global.Path2D === "undefined") {
  (global as any).Path2D = class Path2D {};
}
const { PDFParse } = require("pdf-parse");

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
    const q: any = await yf.quote(ticker);
    const name = q?.longName ?? q?.shortName ?? placeholder;
    cache.set(ticker, name);
    return name;
  } catch (err) {
    console.warn(`Yahoo name lookup failed for ${ticker}:`, err);
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

    if (!sourceDate) {
      const preview = text.substring(0, 200).replace(/\s+/g, " ");
      return {
        success: false,
        error: `Could not find transaction date. PDF preview: "${preview}..."`,
      };
    }

    // Section boundaries by character index so the parser is robust whether
    // pdf-parse preserves row newlines or flattens the whole table inline.
    const beliMatch = text.match(/\bBeli\b/i);
    const jualMatch = text.match(/\bJual\b/i);
    const beliIdx = beliMatch?.index ?? -1;
    const jualIdx = jualMatch?.index ?? -1;

    const rowRegex =
      /(LIMIT|MARKET|STOP|MKT)\s+([A-Z0-9.]+)\s+\$([\d,.]+)\s+([\d,.]+)\s+\$([\d,.]+)\s+\$([\d,.]+)/gi;

    type RawRow = {
      type: "BUY" | "SELL";
      ticker: string;
      price: number;
      priceRaw: string;
      quantity: number;
      quantityRaw: string;
      fee: number;
      feeRaw: string;
    };
    const rawRows: RawRow[] = [];

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

      const price = Number(priceRaw);
      const quantity = Number(quantityRaw);
      const fee = Number(feeRaw);

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
      });
    }

    if (rawRows.length === 0) {
      const preview = text.substring(0, 300).replace(/\s+/g, " ");
      return {
        success: false,
        error: `No recognizable transactions found. PDF preview: "${preview}..."`,
      };
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
        date: sourceDate!.toISOString(),
      }))
    );

    return {
      success: true,
      data: { sourceDate: sourceDate.toISOString(), rows },
    };
  } catch (error: any) {
    console.error("PDF parse error:", error);
    return { success: false, error: error.message || "Failed to parse PDF." };
  }
}

export async function commitParsedTransactions(
  rows: ParsedRow[]
): Promise<CommitResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, message: "Unauthorized" };
    }
    const userId = (session.user as any).id;

    if (!rows || rows.length === 0) {
      return { success: false, message: "No rows to import." };
    }

    let imported = 0;
    let skipped = 0;

    await prisma.$transaction(async (tx) => {
      for (const r of rows) {
        const ticker = r.ticker.toUpperCase();
        const placeholder = `${ticker} Inc`;
        const incomingName = r.companyName?.trim() || placeholder;

        // Backfill placeholder names from earlier imports when a real one is now known.
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
            currency: "USD",
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
            type: r.type,
            quantity: quantityValue,
            executionPrice: priceValue,
            fee: feeValue,
            date: txDate,
          },
        });
        imported++;
      }
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
  } catch (error: any) {
    console.error("PDF commit error:", error);
    return {
      success: false,
      message: error.message || "Failed to import transactions.",
    };
  }
}
