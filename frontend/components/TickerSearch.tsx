'use client';

import { useState } from 'react';
import { Combobox } from '@headlessui/react';
import { Search, X } from 'lucide-react';
import tickers from '@/lib/tickers.json';
import { theme } from '@/lib/theme';

interface Ticker {
  symbol: string;
  name: string;
}

interface TickerSearchProps {
  onTickerSelect: (ticker: string | null) => void;
  selectedTicker: string | null;
}

// Popular tickers for quick filtering
const POPULAR_TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'NFLX'];

export default function TickerSearch({ onTickerSelect, selectedTicker }: TickerSearchProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Ticker | null>(null);

  // Filter tickers as user types
  const filteredTickers =
    query === ''
      ? [] // Don't show dropdown until user types
      : tickers
          .filter((ticker) => {
            const q = query.toLowerCase();
            return (
              ticker.symbol.toLowerCase().includes(q) ||
              ticker.name.toLowerCase().includes(q)
            );
          })
          .slice(0, 10); // Show top 10 matches

  const handleSelect = (ticker: Ticker | null) => {
    setSelected(ticker);
    setQuery('');
    onTickerSelect(ticker?.symbol || null);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery('');
    onTickerSelect(null);
  };

  const handleQuickFilter = (symbol: string) => {
    const ticker = tickers.find(t => t.symbol === symbol);
    if (ticker) {
      setSelected(ticker);
      onTickerSelect(symbol);
    }
  };

  return (
    <div className="w-full mb-6">
      {/* Search Input */}
      <Combobox value={selected} onChange={handleSelect}>
        <div className="relative">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-300"
            style={{
              backgroundColor: theme.colors.background.secondary,
              borderColor: selected ? theme.colors.stocks.primary : theme.colors.stocks.border,
            }}>
            <Search className="w-5 h-5 text-green-400" />

            <Combobox.Input
              className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none"
              placeholder="Search ticker (e.g., AAPL, Tesla)"
              displayValue={(ticker: Ticker) =>
                ticker ? `${ticker.symbol} - ${ticker.name}` : ''
              }
              onChange={(event) => setQuery(event.target.value)}
            />

            {selected && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-slate-700 rounded-full transition-colors"
                type="button"
              >
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            )}
          </div>

          {/* Dropdown Results */}
          {filteredTickers.length > 0 && (
            <Combobox.Options className="absolute z-50 w-full mt-2 py-2 rounded-xl border-2 overflow-hidden shadow-2xl max-h-80 overflow-y-auto"
              style={{
                backgroundColor: theme.colors.background.secondary,
                borderColor: theme.colors.stocks.border,
              }}>
              {filteredTickers.map((ticker) => (
                <Combobox.Option
                  key={ticker.symbol}
                  value={ticker}
                  className={({ active }) =>
                    `px-4 py-3 cursor-pointer transition-colors ${
                      active ? 'bg-green-500/10' : ''
                    }`
                  }
                >
                  {({ active }) => (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-green-400 text-base">
                          {ticker.symbol}
                        </span>
                        <span className="text-slate-300 ml-3 text-sm">
                          {ticker.name}
                        </span>
                      </div>
                      {active && (
                        <div className="text-xs text-green-400 font-semibold">
                          ↵
                        </div>
                      )}
                    </div>
                  )}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          )}

          {/* No Results */}
          {query !== '' && filteredTickers.length === 0 && (
            <div className="absolute z-50 w-full mt-2 p-4 rounded-xl border-2 text-center"
              style={{
                backgroundColor: theme.colors.background.secondary,
                borderColor: theme.colors.stocks.border,
              }}>
              <p className="text-slate-400 text-sm">
                No tickers found for "{query}"
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Try a different ticker symbol or company name
              </p>
            </div>
          )}
        </div>
      </Combobox>

      {/* Popular Tickers Quick Filter */}
      <div className="mt-4">
        <p className="text-sm text-slate-400 mb-2 font-medium">Popular Tickers:</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TICKERS.map((symbol) => {
            const isActive = selectedTicker === symbol;
            return (
              <button
                key={symbol}
                onClick={() => isActive ? handleClear() : handleQuickFilter(symbol)}
                className="px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 border-2"
                style={{
                  backgroundColor: isActive ? theme.colors.stocks.glow : theme.colors.background.tertiary,
                  borderColor: isActive ? theme.colors.stocks.border : 'transparent',
                  color: isActive ? theme.colors.stocks.primary : theme.colors.text.secondary,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = theme.colors.stocks.border;
                    e.currentTarget.style.color = theme.colors.stocks.secondary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.color = theme.colors.text.secondary;
                  }
                }}
              >
                {symbol}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
