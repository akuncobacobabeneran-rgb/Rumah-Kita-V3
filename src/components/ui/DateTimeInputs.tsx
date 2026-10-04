import React, { useRef } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { formatDateId, formatTime24 } from '../../utils/format';

interface DateInputProps {
  value: string;
  onChange: (nextIsoDate: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
}

/**
 * Displays date strictly in dd/mm/yyyy format across all browsers/OS locales,
 * while opening the native calendar picker when clicked.
 */
export function DateInput({
  value,
  onChange,
  required = false,
  className = '',
  placeholder = 'dd/mm/yyyy',
  ariaLabel = 'Pilih tanggal (dd/mm/yyyy)',
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const displayValue = value ? formatDateId(value, 'dd/MM/yyyy') : '';

  const handleContainerClick = () => {
    const el = inputRef.current;
    if (!el) return;
    try {
      if (typeof (el as any).showPicker === 'function') {
        (el as any).showPicker();
      } else {
        el.focus();
      }
    } catch {
      el.focus();
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`relative flex items-center justify-between cursor-pointer select-none ${
        className ||
        'w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]'
      }`}
    >
      <span
        className={`font-mono-num truncate ${
          displayValue ? 'text-[#1E2D24]' : 'text-[#8A968E]'
        }`}
      >
        {displayValue || placeholder}
      </span>
      <Calendar className="w-4 h-4 text-[#5C6B62] shrink-0 ml-2 pointer-events-none" />
      <input
        ref={inputRef}
        type="date"
        lang="id-ID"
        required={required}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  );
}

interface Time24InputProps {
  value: string;
  onChange: (nextTime24: string) => void;
  className?: string;
  ariaLabel?: string;
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

/**
 * Strict 24-hour time input (00:00 - 23:59) that never renders AM/PM regardless of browser locale.
 */
export function Time24Input({
  value,
  onChange,
  className = '',
  ariaLabel = 'Pilih jam (format 24 jam)',
}: Time24InputProps) {
  const normalized = formatTime24(value || '09:00');
  const [hh = '09', mm = '00'] = normalized.split(':');

  const handleHourChange = (nextHour: string) => {
    onChange(`${nextHour}:${mm}`);
  };

  const handleMinuteChange = (nextMin: string) => {
    onChange(`${hh}:${nextMin}`);
  };

  return (
    <div
      aria-label={ariaLabel}
      className={`flex items-center justify-between gap-1.5 ${
        className ||
        'w-full px-3 py-2 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]'
      }`}
    >
      <div className="flex items-center gap-1 font-mono-num font-semibold text-[#1E2D24]">
        <select
          value={hh}
          onChange={(e) => handleHourChange(e.target.value)}
          aria-label="Jam (00-23)"
          className="bg-transparent focus:outline-none cursor-pointer pr-0.5 text-center"
        >
          {HOURS_24.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span>:</span>
        <select
          value={mm}
          onChange={(e) => handleMinuteChange(e.target.value)}
          aria-label="Menit (00-59)"
          className="bg-transparent focus:outline-none cursor-pointer pl-0.5 text-center"
        >
          {MINUTES_60.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1 text-[11px] font-medium text-[#5C6B62] shrink-0">
        <span>24j</span>
        <Clock className="w-3.5 h-3.5 text-[#5C6B62]" />
      </div>
    </div>
  );
}
