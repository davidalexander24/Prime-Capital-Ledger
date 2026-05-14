import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getLatestPrice, getUsdIdrRate } from '@/lib/marketData';

export async function GET(request: Request) {
  try {
    // Security Authorization
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('[SECURITY] Unauthorized cron execution attempt.');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('[CRON] Initiating Daily Valuation Engine...');

    // Fetch the USD/IDR Exchange Rate
    const exchangeRate = await getUsdIdrRate();
    if (!exchangeRate) {
      throw new Error("Failed to retrieve baseline exchange rate. Aborting cron job.");
    }

    // Fetch all users and their complete transaction history
    const users = await prisma.user.findMany({
      include: {
        transactions: {
          include: { asset: true }
        }
      }
    });

    // Process each user's portfolio mathematically
    for (const user of users) {
      let cashBalanceUSD = 0;
      const holdings: Record<string, { ticker: string, shares: number }> = {};

      // Reconstruct the ledger state
      for (const t of user.transactions) {
        const qty = Number(t.quantity);
        const price = Number(t.executionPrice);
        const fee = Number(t.fee);
        const transactionValue = qty * price;

        if (t.type === 'DEPOSIT') cashBalanceUSD += transactionValue;
        if (t.type === 'WITHDRAW') cashBalanceUSD -= transactionValue;
        
        if (t.type === 'BUY' && t.asset) {
          cashBalanceUSD -= (transactionValue + fee);
          if (!holdings[t.assetId!]) holdings[t.assetId!] = { ticker: t.asset.ticker, shares: 0 };
          holdings[t.assetId!].shares += qty;
        }
        
        if (t.type === 'SELL' && t.asset) {
          cashBalanceUSD += (transactionValue - fee);
          if (!holdings[t.assetId!]) holdings[t.assetId!] = { ticker: t.asset.ticker, shares: 0 };
          holdings[t.assetId!].shares -= qty;
        }
      }

      // Calculate current market value of holdings
      let marketValueUSD = 0;
      for (const assetId in holdings) {
        const { ticker, shares } = holdings[assetId];
        if (shares > 0) { // Only fetch prices for assets the user currently owns
          const currentPrice = await getLatestPrice(ticker);
          if (currentPrice !== null) {
            marketValueUSD += (shares * currentPrice);
          } else {
            console.warn(`[WARNING] Could not price ${ticker} for user ${user.id}. Skipping asset value.`);
          }
        }
      }

      // Final Equity Calculations
      const totalEquityUSD = cashBalanceUSD + marketValueUSD;
      const totalEquityIDR = totalEquityUSD * exchangeRate;

      // Database Snapshot (Upsert prevents duplicates on the same date)
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      await prisma.dailyValuation.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date: today,
          }
        },
        update: {
          cashBalanceUSD,
          marketValueUSD,
          totalEquityUSD,
          totalEquityIDR,
          exchangeRate,
        },
        create: {
          userId: user.id,
          date: today,
          cashBalanceUSD,
          marketValueUSD,
          totalEquityUSD,
          totalEquityIDR,
          exchangeRate,
        }
      });

      console.log(`[CRON] Processed valuation for user ${user.email}. Equity: $${totalEquityUSD.toFixed(2)}`);
    }

    return NextResponse.json({ success: true, message: 'Daily valuations generated successfully.' });

  } catch (error) {
    console.error('[CRON ERROR] Valuation Engine Failed:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  } finally {
    await prisma.$disconnect(); 
  }
}