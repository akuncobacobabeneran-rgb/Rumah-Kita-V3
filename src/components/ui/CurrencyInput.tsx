import React, { useId, useMemo } from 'react';
import { formatRupiah, formatRupiahInput, parseRupiahInput, terbilangRupiah } from '../../utils/format';

export interface CurrencyInputProps {
  id?: string;
  label?: string;
  value: string | number;
  onChange: (formattedValue: string, numericValue: number) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  error?: string;
  showQuickButtons?: boolean;
  showTerbilang?: boolean;
  quickAmounts?: number[];
}

const DEFAULT_QUICK_AMOUNTS = [10_000, 50_000, 100_000, 500_000, 1_000_000];

export function CurrencyInput({
  id: propId,
  label,
  value,
  onChange,
  placeholder = '0',
  required = false,
  disabled = false,
  autoFocus = false,
  className = '',
  error,
  showQuickButtons = true,
  showTerbilang = true,
  quickAmounts = DEFAULT_QUICK_AMOUNTS,
}: CurrencyInputProps) {
  const generatedId = useId();
  const inputId = propId || generatedId;

  const stringValue = useMemo(() => {
    if (value === undefined || value === null || value === '') return '';
    return formatRupiahInput(value);
  }, [value]);

  const numericValue = useMemo(() => {
    return parseRupiahInput(stringValue);
  }, [stringValue]);

  const terbilangText = useMemo(() => {
    if (!showTerbilang || numericValue <= 0) return '';
    return terbilangRupiah(numericValue);
  }, [numericValue, showTerbilang]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatRupiahInput(raw);
    const num = parseRupiahInput(formatted);
    onChange(formatted, num);
  };

  const handleQuickAdd = (delta: number) => {
    const current = parseRupiahInput(stringValue);
    const next = current + delta;
    const formatted = formatRupiahInput(next);
    onChange(formatted, next);
  };

  const handleReset = () => {
    onChange('', 0);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#1E2D24]">
            {label}
          </label>
          {numericValue > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-semibold text-[#C84B31] hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      )}

      <div className="relative flex items-center rounded-xl bg-white border border-[#E8E2D5] focus-within:border-[#2A4D3E] focus-within:ring-2 focus-within:ring-[#2A4D3E]/10 transition-all overflow-hidden">
        <div className="px-3.5 py-2.5 bg-[#FAF7F2] border-r border-[#E8E2D5] text-xs font-bold text-[#2A4D3E] select-none shrink-0 flex items-center">
          Rp
        </div>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          pattern="[0-9.]*"
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          value={stringValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 bg-transparent text-sm font-mono-num font-semibold text-[#1E2D24] placeholder-[#A8B3AA] focus:outline-none"
        />
      </div>

      {/* Terbilang & Preview */}
      {numericValue > 0 && (
        <div className="px-1 text-[11px] space-y-0.5 animate-fadeIn">
          <p className="font-semibold text-[#2A4D3E]">
            {formatRupiah(numericValue)}
          </p>
          {terbilangText && (
            <p className="text-[#5C6B62] italic text-[11px]">
              &ldquo;{terbilangText}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Quick Increment Buttons */}
      {showQuickButtons && !disabled && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] font-medium text-[#5C6B62] mr-0.5">Tambah:</span>
          {quickAmounts.map((amt) => {
            const labelStr =
              amt >= 1_000_000
                ? `+${amt / 1_000_000} jt`
                : `+${amt / 1_000} rb`;
            return (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAdd(amt)}
                className="px-2 py-0.5 rounded-lg bg-[#F4EFE6] hover:bg-[#E8DFCE] active:scale-95 text-[#1E2D24] text-[11px] font-medium transition-all cursor-pointer"
              >
                {labelStr}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs text-[#C84B31]">{error}</p>}
    </div>
  );
}
