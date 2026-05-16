"use client";

import { useState, useEffect } from "react";

interface StockLogoProps {
  ticker: string;
  className?: string;
  size?: number;
}

export function StockLogo({ ticker, className = "", size = 32 }: StockLogoProps) {
  const [errorCount, setErrorCount] = useState(0);
  
  // Clean the ticker (e.g., BBCA.JK becomes BBCA)
  const cleanTicker = ticker.replace(".JK", "").toUpperCase();

  // A resilient, multi-CDN approach. 
  // It tries TradingView first (very reliable), then FMP, then falls back to text.
  const sources = [
    // 1. TradingView's public CDN (often has better coverage for international/IDX)
    `https://s3-symbol-logo.tradingview.com/${cleanTicker.toLowerCase()}--big.svg`,
    // 2. Financial Modeling Prep (Great for US Equities)
    `https://financialmodelingprep.com/image-stock/${cleanTicker}.png`,
    // 3. EODHD alternative public path
    `https://eodhd.com/img/logos/US/${cleanTicker}.png`
  ];

  // Reset the error count if the ticker changes
  useEffect(() => {
    setErrorCount(0);
  }, [ticker]);

  const imgSrc = sources[errorCount];

  // If ALL databases fail to find the logo, show the elegant minimalist text fallback
  if (errorCount >= sources.length) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-[4px] border border-[oklch(0.12_0.005_260)] bg-transparent text-[oklch(0.50_0.01_260)] font-semibold tracking-wide ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {cleanTicker.slice(0, 2)}
      </div>
    );
  }

  return (
    <div 
      className={`relative shrink-0 flex items-center justify-center bg-transparent ${className}`} 
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={`${cleanTicker} logo`}
        width={size}
        height={size}
        // mix-blend-multiply gracefully handles images with white backgrounds
        className="h-full w-full object-contain opacity-85 mix-blend-multiply dark:mix-blend-normal transition-opacity duration-300 hover:opacity-100"
        onError={() => {
          // If the image is broken or blocked, try the next database
          setErrorCount((prev) => prev + 1);
        }}
      />
    </div>
  );
}