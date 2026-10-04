# Rencana Perbaikan Penyimpanan Nama Keluarga Saat Reload

## Mengapa Nama Keluarga Kembali ke Awal Saat Di-Reload?
1. **Balapan Request (*Race Condition*) Saat Simpan Profil & Nama Keluarga**:
   - Pada form **Ubah Profil & Nama Keluarga**, fungsi `updateProfile` dan `updateFamily` dijalankan secara berurutan.
   - Pemanggilan pertama (`updateProfile`) mengirim seluruh bundel keluarga di latar belakang yang masih membawa **nama keluarga lama** ke Server & Supabase, sehingga menimpa kembali nama keluarga baru yang dikirim oleh `updateFamily`.
2. **Fungsi Sinkronisasi Server (`mergeFamilyBundles`) Mengutamakan Nama Lama**:
   - Saat halaman di-*reload*, fungsi `mergeFamilyBundles` di server menggabungkan data menggunakan `base.family.name` (data lama di server) tanpa membandingkan waktu perubahan (`updated_at`) terbaru.
3. **Pembacaan Supabase Tidak Membandingkan `updated_at` Lokal**:
   - Saat memuat ulang dari Supabase, jika proses penyimpanan ke Supabase belum selesai atau gagal karena kebijakan tabel, data lama dari Supabase langsung menimpa data terbaru yang baru saja disimpan di browser/server.

---

## Solusi yang Akan Diimplementasikan

### 1. Gabungkan & Tunggu (*Await*) Penyimpanan Profil dan Nama Keluarga
- Memperbarui penyimpanan pada form **Ubah Profil & Nama Keluarga** agar pembaruan `profile` dan `family.name` disimpan dalam **satu transaksi state tunggal** yang ditunggu (*await*) hingga selesai tersimpan di LocalStorage, Server (`/api/families/save`), dan Supabase sebelum modal ditutup.

### 2. Gunakan Waktu Perubahan Terbaru (`updated_at`) Saat Sinkronisasi Server
- Memperbarui fungsi `mergeFamilyBundles` pada `server.ts` agar membandingkan timestamp `updated_at` antara data server dan data yang dikirim dari aplikasi, sehingga `family.name`, `couple_motto`, dan profil keluarga selalu menggunakan versi yang paling baru diubah oleh pengguna.

### 3. Prioritaskan Versi `family` Terbaru Antara Lokal, Server & Supabase
- Memperbarui `fetchFamilyBundleFromSupabase` pada `src/services/familyService.ts` agar membandingkan `updated_at` antara `workingCopy.family` (Lokal/Server) dan `familyData` (Supabase), serta langsung memperbarui Supabase apabila versi lokal/server memiliki `updated_at` yang lebih baru.
