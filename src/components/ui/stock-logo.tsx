"use client";

import { useState } from "react";

interface StockLogoProps {
  ticker: string;
  className?: string;
  size?: number;
}

function StockLogoInner({
  ticker,
  className = "",
  size = 32,
}: StockLogoProps) {
  const [errorCount, setErrorCount] = useState(0);

  const cleanTicker = ticker.replace(".JK", "").toUpperCase();

  const sources = [
    `https://s3-symbol-logo.tradingview.com/${cleanTicker.toLowerCase()}--big.svg`,
    `https://financialmodelingprep.com/image-stock/${cleanTicker}.png`,
    `https://eodhd.com/img/logos/US/${cleanTicker}.png`
  ];

  const imgSrc = sources[errorCount];

  if (errorCount >= sources.length) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg border border-[oklch(0.12_0.005_260)] bg-transparent text-[oklch(0.50_0.01_260)] font-semibold tracking-wide ${className}`}
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
        className="h-full w-full object-contain opacity-85 mix-blend-multiply dark:mix-blend-normal transition-opacity duration-300 hover:opacity-100"
        onError={() => {
          setErrorCount((prev) => prev + 1);
        }}
      />
    </div>
  );
}

export function StockLogo(props: StockLogoProps) {
  return <StockLogoInner key={props.ticker} {...props} />;
}