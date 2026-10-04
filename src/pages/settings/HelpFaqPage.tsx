import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, HelpCircle } from 'lucide-react';

const FAQ_LIST = [
  {
    q: 'Bagaimana cara kerja perhitungan Kekayaan Bersih pada Neraca Keluarga?',
    a: 'Kekayaan bersih dihitung secara otomatis menggunakan formula: Total Harta (Saldo seluruh Wallet + Nilai Aset & Investasi + Saldo Tabungan Goal + Piutang belum tertagih) dikurangi Total Utang yang belum lunas.',
  },
  {
    q: 'Apakah transfer antar wallet dihitung sebagai pemasukan atau pengeluaran?',
    a: 'Tidak. Ketika Anda memindahkan dana melalui fitur Transfer Antar Wallet, saldo dompet asal berkurang dan saldo dompet tujuan bertambah tanpa mengubah angka total pemasukan maupun pengeluaran keluarga.',
  },
  {
    q: 'Apa yang terjadi jika saya menghapus kategori transaksi yang sudah memiliki riwayat transaksi?',
    a: 'RumahKita dilengkapi perlindungan integritas data. Jika kategori yang dihapus sudah digunakan oleh transaksi, transaksi tersebut otomatis dialihkan ke kategori cadangan (Lainnya) agar laporan keuangan Anda tidak rusak.',
  },
  {
    q: 'Bagaimana cara mengundang pasangan atau anggota keluarga lain?',
    a: 'Buka menu Lainnya, salin Kode Undangan / Family ID keluarga Anda, lalu berikan kepada pasangan saat mereka mendaftar dengan memilih opsi "Gabung Kode Keluarga".',
  },
  {
    q: 'Bagaimana cara menyembunyikan angka nominal keuangan saat membuka aplikasi di tempat umum?',
    a: 'Klik ikon mata (Eye icon) pada bagian Ringkasan Keuangan di Beranda atau pada kartu Neraca Keluarga di halaman Keuangan. Semua angka akan otomatis disamarkan menjadi ••••••••.',
  },
];

export function HelpFaqPage() {
  const navigate = useNavigate();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="min-h-[40px] min-w-[40px] rounded-xl bg-white border border-[#E8E2D5] flex items-center justify-center text-[#1E2D24] hover:bg-[#F4EFE6]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-[#1E2D24]">Bantuan & FAQ</h1>
          <p className="text-xs text-[#5C6B62]">
            Pertanyaan yang sering diajukan seputar penggunaan RumahKita
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {FAQ_LIST.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={item.q}
              className="bg-white rounded-3xl border border-[#E8E2D5] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-5 flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-[#2A4D3E] shrink-0" />
                  <span className="text-sm font-bold text-[#1E2D24]">{item.q}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[#5C6B62] shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-0 text-xs text-[#5C6B62] leading-relaxed border-t border-[#F0EBE1]">
                  <p className="pt-3">{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
