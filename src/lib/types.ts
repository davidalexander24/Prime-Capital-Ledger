export type TransactionType = "BUY" | "SELL" | "DEPOSIT" | "WITHDRAW";

export type TransactionSource =
  | "MANUAL"
  | "AJAIB_PDF"
  | "STOCKBIT_PDF"
  | "CSV_IMPORT"
  | "API_SYNC";

export type AssetType = "STOCK" | "ETF" | "BOND" | "MUTUAL_FUND" | "CRYPTO";

export interface PortfolioValuationPoint {
  date: string;
  totalMarketValue: number;
  totalCostBasis: number;
  unrealizedPnL: number;
  dailyReturn: number;
}

export interface TransactionRecord {
  id: string;
  executedAt: string;
  ticker: string;
  assetName: string;
  type: TransactionType;
  quantity: number;
  pricePerShare: number;
  grossValue: number;
  totalFees: number;
  netValue: number;
  currency: string;
  source: TransactionSource;
}

export interface TopTradedAsset {
  ticker: string;
  name: string;
  sector: string;
  totalVolume: number;
  tradeCount: number;
  lastPrice: number;
  changePercent: number;
  currency: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCostBasis: number;
  unrealizedPnL: number;
  totalReturnPct: number;
  holdingsCount: number;
  currency: string;
  exchangeRate?: number;
}
