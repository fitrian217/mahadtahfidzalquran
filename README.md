# Rapor Tahfidz · Ma'had Tahfidz Al-Qur'an UIN Sunan Gunung Djati Bandung

Situs statis untuk rapor, dashboard, dan laporan tahfidz mahasantri.
Repositori ini menggabungkan `mahadtahfidzalquran`, `rapotmahasantri` (isinya identik), dan `examples`.

## Struktur

```
index.html          kerangka halaman
assets/style.css    gaya tampilan
assets/app.js       logika aplikasi
assets/wadrag.js    tombol WhatsApp yang bisa digeser
assets/img*.{png,jpg}  logo dan latar sertifikat
data/data.js        data rekap santri (window.RAPOR_DATA)
data/quran.js       teks Al-Qur'an untuk kuis (window.QURAN_DATA)
examples/ai-executive-summaries/   contoh Netlify Functions + Claude (terpisah dari aplikasi rapor)
baca-bareng-hewan/  aplikasi belajar membaca untuk anak TK (halaman terpisah)
netlify.toml        konfigurasi deploy statis
```

## Menjalankan

Buka lewat server statis, mis. `npx serve .` atau `python3 -m http.server`, lalu buka `http://localhost:8000`.
Perlu internet untuk memuat pustaka xlsx, jsPDF, dan JSZip dari CDN.

## Memperbarui data

1. Masuk **Mode Admin**, unggah file Excel absensi halaqah.
2. Perubahan tersimpan di browser admin. Klik **⬇ Unduh data.js**.
3. Ganti `data/data.js` di repositori dengan file itu lalu commit. Data baru berlaku untuk semua santri.
