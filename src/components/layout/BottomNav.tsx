import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Calendar, Heart, Home, LayoutGrid, Wallet } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Beranda', icon: Home, matchPrefix: '/' },
  { to: '/keuangan', label: 'Keuangan', icon: Wallet, matchPrefix: '/keuangan' },
  { to: '/kalender', label: 'Kalender', icon: Calendar, matchPrefix: '/kalender' },
  { to: '/berdua', label: 'Berdua', icon: Heart, matchPrefix: '/berdua' },
  { to: '/lainnya', label: 'Lainnya', icon: LayoutGrid, matchPrefix: '/lainnya' },
];

export function BottomNav() {
  const location = useLocation();

  const isRouteActive = (itemPrefix: string) => {
    if (itemPrefix === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(itemPrefix);
  };

  return (
    <nav
      aria-label="Navigasi Utama"
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E8E2D5]"
    >
      <div className="max-w-5xl mx-auto px-2 h-16 grid grid-cols-5 items-center">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isRouteActive(item.matchPrefix);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="min-h-[48px] flex flex-col items-center justify-center rounded-2xl transition-colors select-none group"
            >
              <div
                className={`px-3.5 py-1 rounded-full transition-colors ${
                  active
                    ? 'bg-[#2A4D3E] text-[#FAF7F2]'
                    : 'text-[#5C6B62] group-hover:text-[#1E2D24]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[11px] mt-1 tracking-tight whitespace-nowrap ${
                  active ? 'font-bold text-[#2A4D3E]' : 'font-medium text-[#5C6B62]'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
