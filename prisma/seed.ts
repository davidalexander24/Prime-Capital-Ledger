import { PrismaClient, Prisma } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
    console.log('Clearing existing data...');

    console.log('Seeding Database...');

    const user = await prisma.user.create({
        data: {
            email: 'dafa@primecapital.com',
            name: 'Tubagus Dafa Izza Fariz',
        },
    });

    // Assets
    const msft = await prisma.asset.create({
        data: { ticker: 'MSFT', companyName: 'Microsoft Corporation', currency: 'USD' },
    });

    const aapl = await prisma.asset.create({
        data: { ticker: 'AAPL', companyName: 'Apple Inc.', currency: 'USD' },
    });

    // Initial Deposit + Stock Purchases
    await prisma.transaction.createMany({
        data: [
            {
                userId: user.id,
                type: 'DEPOSIT',
                quantity: new Prisma.Decimal(1),
                executionPrice: new Prisma.Decimal(10000), // $10,000 deposit
                fee: new Prisma.Decimal(0),
                date: new Date('2026-04-01T10:00:00Z'),
            },
            {
                userId: user.id,
                assetId: msft.id,
                type: 'BUY',
                quantity: new Prisma.Decimal(5),
                executionPrice: new Prisma.Decimal(400), // 5 * 400 = $2000
                fee: new Prisma.Decimal(3), // 0.15% fee
                date: new Date('2026-04-02T14:30:00Z'),
            },
            {
                userId: user.id,
                assetId: aapl.id,
                type: 'BUY',
                quantity: new Prisma.Decimal(10),
                executionPrice: new Prisma.Decimal(170), // 10 * 170 = $1700
                fee: new Prisma.Decimal(2.55), // 0.15% fee
                date: new Date('2026-04-03T15:00:00Z'),
            }
        ]
    });

    // Historical Daily Valuations (Simulating market movement)
    await prisma.dailyValuation.createMany({
        data: [
            {
                userId: user.id,
                date: new Date('2026-04-03T23:59:00Z'),
                cashBalanceUSD: new Prisma.Decimal(6294.45), // 10000 - 2003 - 1702.55
                marketValueUSD: new Prisma.Decimal(3720), // Simulated slight gain
                totalEquityUSD: new Prisma.Decimal(10014.45),
                totalEquityIDR: new Prisma.Decimal(162234090),
                exchangeRate: new Prisma.Decimal(16200),
            },
            {
                userId: user.id,
                date: new Date('2026-04-04T23:59:00Z'),
                cashBalanceUSD: new Prisma.Decimal(6294.45),
                marketValueUSD: new Prisma.Decimal(3850), // Simulated further gain
                totalEquityUSD: new Prisma.Decimal(10144.45),
                totalEquityIDR: new Prisma.Decimal(164340090),
                exchangeRate: new Prisma.Decimal(16200),
            }
        ]
    });

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });