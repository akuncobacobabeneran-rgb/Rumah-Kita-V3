# Implementation Plan — Menghapus Tombol Download Hijau di Header Atas

Menghapus tombol unduh/install hijau (*PWA Install Button*) dari bilah *header* navigasi atas (`AppHeader.tsx`), sehingga tampilan atas lebih bersih dan rapi, sementara opsi instalasi aplikasi tetap dipertahankan di menu **Lainnya / Pengaturan** (`MorePage.tsx`).

---

## User Decision & Preference
- **Header Atas**: Tombol unduh hijau dihapus sepenuhnya dari bilah navigasi atas.
- **Menu Lainnya**: Tombol pasang aplikasi (PWA) tetap tersedia dalam bentuk kartu informatif di menu **Lainnya / Pengaturan** (`MorePage.tsx`) agar pengguna yang ingin menginstal aplikasi ke layar utama ponsel tetap dapat melakukannya kapan saja.

---

## Proposed Changes

### 1. `src/components/layout/AppHeader.tsx`
- Hapus impor `PWAInstallButton` dari `../../components/ui/PWAInstallButton`.
- Hapus komponen `<PWAInstallButton variant="header" />` dari area aksi kanan *header* navigasi.
- Pastikan jarak dan tata letak ikon lainnya (Muat Ulang, Pencarian, Panel Notifikasi) tetap seimbang dan rapi di layar ponsel maupun desktop.

### 2. Verifikasi Menu Lainnya (`src/pages/settings/MorePage.tsx`)
- Pastikan kartu `<PWAInstallButton variant="card" />` tetap aktif dan terpasang dengan baik pada menu **Lainnya / Pengaturan**.

---

## Verification Plan

### Automated Build Verification
1. Jalankan `lint_applet` (`tsc --noEmit`) untuk memastikan tidak ada kesalahan impor atau variabel tak terpakai.
2. Jalankan `compile_applet` (`vite build`) untuk memverifikasi proyek terkompilasi dengan bersih.

### Visual & Functional Verification
1. Verifikasi bilah *header* atas di tampilan ponsel: tombol hijau unduh sudah hilang, hanya menyisakan tombol Muat Ulang, Pencarian, dan Panel Notifikasi.
2. Buka menu **Lainnya**: kartu "Pasang RumahKita di HP" tetap dapat diakses dengan baik bagi pengguna yang ingin menginstal PWA.
