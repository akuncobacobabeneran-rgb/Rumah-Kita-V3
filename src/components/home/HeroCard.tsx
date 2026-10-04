import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Sparkles, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';

export function HeroCard() {
  const family = useFamilyStore((s) => s.family);
  const profile = useFamilyStore((s) => s.profile);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = now.getHours();
  let greeting = 'Selamat Pagi';
  let TimeIcon = Sunrise;
  if (hour >= 11 && hour < 15) {
    greeting = 'Selamat Siang';
    TimeIcon = Sun;
  } else if (hour >= 15 && hour < 18) {
    greeting = 'Selamat Sore';
    TimeIcon = Sunset;
  } else if (hour >= 18 || hour < 4) {
    greeting = 'Selamat Malam';
    TimeIcon = Moon;
  }

  const timeString = format(now, 'HH:mm:ss');
  const dateString = format(now, 'EEEE, dd/MM/yyyy', { locale: localeId });

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2A4D3E] via-[#325A49] to-[#1E3A2E] text-[#FAF7F2] p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#F4D393]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>RumahKita · Ruang Keluarga</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {greeting}, {family?.name || profile?.full_name || 'Keluarga Kita'}
          </h1>
          <p className="text-xs text-[#FAF7F2]/80">
            {family?.couple_motto || 'Kelola rumah tangga dengan tenang, teratur, dan penuh kasih.'}
          </p>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center bg-white/10 backdrop-blur-xs rounded-2xl px-4 py-3 border border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <TimeIcon className="w-4 h-4 text-[#F4D393]" />
            <span className="text-lg sm:text-xl font-mono-num font-bold tracking-tight text-white">
              {timeString}
            </span>
          </div>
          <span className="text-xs text-[#FAF7F2]/85 mt-0.5 capitalize">{dateString}</span>
        </div>
      </div>
    </section>
  );
}
