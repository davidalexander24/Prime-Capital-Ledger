"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Polyfill DOM elements for pdf-parse (pdf.js) in Node Next.js environments
if (typeof global.DOMMatrix === 'undefined') {
  (global as any).DOMMatrix = class DOMMatrix {};
}
if (typeof global.Path2D === 'undefined') {
  (global as any).Path2D = class Path2D {};
}
const pdfParseModule = require("pdf-parse");
const pdfParse = pdfParseModule.default || pdfParseModule;

const INDONESIAN_MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, jun: 5,
  jul: 6, agt: 7, sep: 8, okt: 9, nov: 10, des: 11,
};

export async function processPdfImport(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }
    const userId = (session.user as any).id;

    const file = formData.get("file") as File;
    if (!file) {
      throw new Error("No file provided");
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Use pdf-parse to extract raw text
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    const lines = text.split(/\r?\n/);
    
    let currentDate: Date | null = null;
    let currentSection: "BUY" | "SELL" | null = null;
    const extractedTransactions: any[] = [];

    // Regex Definitions
    const dateRegex = /Tgl\. Transaksi\s*:\s*[A-Za-z]+,\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i;
    // Row matching: LIMIT MSFT $421.73 0.140177830 $0.18 $59.30
    const rowRegex = /(LIMIT|MARKET|STOP|MKT)\s+([A-Z0-9]+)\s+\$([\d,\.]+)\s+([\d,\.]+)\s+\$([\d,\.]+)\s+\$([\d,\.]+)/i;

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;
      
      try {
        // Parse the Date
        const dateMatch = cleanLine.match(dateRegex);
        if (dateMatch) {
          const day = parseInt(dateMatch[1], 10);
          const monthStr = dateMatch[2].toLowerCase().substring(0, 3);
          const year = parseInt(dateMatch[3], 10);
          const month = INDONESIAN_MONTHS[monthStr] ?? 0;
          currentDate = new Date(Date.UTC(year, month, day));
          continue;
        }

        // Identify Beli/Jual headers
        if (cleanLine.toLowerCase() === "beli" || cleanLine.toLowerCase().includes("beli (buy)")) {
          currentSection = "BUY";
          continue;
        }
        if (cleanLine.toLowerCase() === "jual" || cleanLine.toLowerCase().includes("jual (sell)")) {
          currentSection = "SELL";
          continue;
        }

        // Parse Row data
        if (currentSection && currentDate) {
          const rowMatch = cleanLine.match(rowRegex);
          if (rowMatch) {
            const ticker = rowMatch[2].toUpperCase();
            const price = parseFloat(rowMatch[3].replace(/,/g, ''));
            const quantity = parseFloat(rowMatch[4].replace(/,/g, ''));
            const fee = parseFloat(rowMatch[5].replace(/,/g, ''));

            if (quantity > 0 && price > 0) {
              extractedTransactions.push({
                date: currentDate,
                type: currentSection,
                ticker,
                price,
                quantity,
                fee
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Robust try-catch: Regex parsing failed for line: "${cleanLine}"`, err);
      }
    }

    if (extractedTransactions.length === 0) {
      const textPreview = text.substring(0, 150).replace(/\n/g, '\\n');
      return { 
        success: false, 
        error: `No recognizable transactions found. PDF Text Preview: "${textPreview}..."` 
      };
    }

    // Perform sequential Prisma operations inside a transaction block
    let importedCount = 0;
    
    await prisma.$transaction(async (tx) => {
      for (const t of extractedTransactions) {
        // Upsert the Asset table
        const asset = await tx.asset.upsert({
          where: { ticker: t.ticker },
          update: {},
          create: {
            ticker: t.ticker,
            companyName: `${t.ticker} Inc`,
            currency: "USD",
          }
        });

        // Create a new Transaction record
        await tx.transaction.create({
          data: {
            userId: userId,
            assetId: asset.id,
            type: t.type,
            quantity: t.quantity,
            executionPrice: t.price,
            fee: t.fee,
            date: t.date,
          }
        });
        importedCount++;
      }
    });

    return { success: true, message: `Successfully parsed and imported ${importedCount} transactions!` };
  } catch (error: any) {
    console.error("PDF Parsing error:", error);
    return { success: false, error: error.message || "Failed to process PDF." };
  }
}
