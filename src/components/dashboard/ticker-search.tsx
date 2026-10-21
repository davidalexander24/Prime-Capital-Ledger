"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import { Search, X, Database, Globe, Loader2 } from "lucide-react";
import { searchAssets, type AssetSearchResult } from "@/app/actions/assets";
import { currencyForTicker } from "@/lib/currency";

interface TickerSearchProps {
  value: { ticker: string; companyName: string } | null;
  onChange: (value: { ticker: string; companyName: string } | null) => void;
  disabled?: boolean;
}

export function TickerSearch({ value, onChange, disabled }: TickerSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AssetSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listboxId = useId();

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await searchAssets(q);
      setResults(res);
      // Open even when nothing matched, so the list can say so.
      setIsOpen(true);
      setHighlightIdx(-1);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!query || value) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, value, doSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(result: AssetSearchResult) {
    onChange({ ticker: result.ticker, companyName: result.companyName });
    setQuery("");
    setIsOpen(false);
    setResults([]);
  }

  function handleClear() {
    onChange(null);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // The dialog stays open while this list is expanded (it checks
    // aria-expanded), so Escape only has to close the list.
    if (e.key === "Escape") {
      if (isOpen) setIsOpen(false);
      return;
    }
    if (!isOpen || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIdx]);
    }
  }

  if (value) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[oklch(0.40_0.01_260)]">
          Asset
        </span>
        <div className="flex h-9 items-center gap-2 rounded-lg border border-[oklch(0.14_0.005_260)] bg-[oklch(0.03_0.005_260)] px-3">
          <span className="text-[13px] font-semibold text-[oklch(0.90_0.005_260)]">
            {value.ticker}
          </span>
          <span className="text-[11px] text-[oklch(0.40_0.01_260)] truncate">
            {value.companyName}
          </span>
          <span className="ml-auto shrink-0 text-[11px] font-semibold tracking-[0.06em] text-[oklch(0.55_0.01_260)]">
            {currencyForTicker(value.ticker)}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear selected asset"
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[oklch(0.40_0.01_260)] transition-colors hover:bg-[oklch(0.14_0.005_260)] hover:text-[oklch(0.70_0.005_260)]"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <label
        htmlFor="ticker-search"
        className="text-[10px] font-semibold uppercase tracking-widest text-[oklch(0.40_0.01_260)]"
      >
        Search Asset
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id="ticker-search"
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            isOpen && highlightIdx >= 0 ? `${listboxId}-${highlightIdx}` : undefined
          }
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            if (!next) {
              setResults([]);
              setIsOpen(false);
            }
          }}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search ticker or company name…"
          disabled={disabled}
          autoComplete="off"
          className="h-9 w-full rounded-lg border border-[oklch(0.14_0.005_260)] bg-[oklch(0.03_0.005_260)] pl-8 pr-3 text-[13px] font-medium text-[oklch(0.90_0.005_260)] placeholder:text-[oklch(0.25_0.01_260)] outline-none transition-colors focus:border-[oklch(0.70_0.08_230)] focus:ring-1 focus:ring-[oklch(0.70_0.08_230)]/30"
        />
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[oklch(0.35_0.01_260)]">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full overflow-hidden rounded-lg border border-[oklch(0.18_0.005_260)] bg-[oklch(0.06_0.005_260)] shadow-xl">
          {results.length === 0 ? (
            <p role="status" className="px-3 py-2.5 text-[12px] text-[oklch(0.55_0.01_260)]">
              No matching US or IDX listings.
            </p>
          ) : (
            <div id={listboxId} role="listbox">
              {results.map((r, idx) => (
                <button
                  key={`${r.ticker}-${r.source}`}
                  id={`${listboxId}-${idx}`}
                  type="button"
                  role="option"
                  aria-selected={idx === highlightIdx}
                  tabIndex={-1}
                  onClick={() => handleSelect(r)}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    idx === highlightIdx
                      ? "bg-[oklch(0.10_0.01_230)]"
                      : "hover:bg-[oklch(0.08_0.005_260)]"
                  }`}
                >
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[oklch(0.90_0.005_260)]">
                        {r.ticker}
                      </span>
                      {r.source === "db" ? (
                        <span className="flex items-center gap-1 rounded bg-[oklch(0.12_0.04_155)] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.06em] text-[oklch(0.60_0.12_155)]">
                          <Database className="h-2.5 w-2.5" />
                          Portfolio
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded bg-[oklch(0.12_0.01_230)] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.06em] text-[oklch(0.55_0.06_230)]">
                          <Globe className="h-2.5 w-2.5" />
                          Yahoo
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[oklch(0.40_0.01_260)]">
                      {r.companyName}
                    </span>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold tracking-[0.06em] text-[oklch(0.55_0.01_260)]">
                    {r.currency}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
