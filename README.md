# Simulasi Dual-AI Counseling

Aplikasi simulasi yang bisa dicoba langsung di browser, dari tiga sisi:

- **Siswa:** aktivasi akun dengan kode sekolah, bercerita dengan Companion, kartu
  bantuan saat ada tanda bahaya, dan berbagi ringkasan ke guru BK dengan persetujuan.
- **Guru BK:** masuk dua faktor, menerima tanda bahaya (tanpa isi percakapan) dan
  ringkasan siswa, mengajak bertemu, dan berkonsultasi dengan Asisten Konselor
  yang setiap butirnya bersumber.
- **Orang tua:** memberi atau mencabut persetujuan, dan melihat waktu pakai tanpa
  isi percakapan.

Ketiga sisi saling terhubung: yang dilakukan di satu sisi langsung terlihat di
sisi lain. Panel simulasi memperlihatkan apa yang terjadi di dalam sistem
(penyamaran data, pemilah risiko, notifikasi, persetujuan, validasi).

**Buka:** https://mahfudm24h-web.github.io/dual-ai-counseling-demo/

## Batasan

- Jawaban Companion dan Asisten Konselor berasal dari skrip, bukan model AI.
- Nama orang, sekolah, dan dokumen rujukan adalah contoh. Nomor Healing119,
  SAPA 129, dan 112 adalah layanan nyata yang ditampilkan sebagai rujukan.
- Data simulasi hanya tersimpan di browser yang membukanya.

Tanpa langkah build: `index.html`, `gaya.css`, `mesin.js`, `app.js`.
