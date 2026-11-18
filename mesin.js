"use strict";
// Mesin simulasi. Semua "jawaban AI" di sini berasal dari aturan dan templat,
// bukan dari model. Tujuannya memperlihatkan alur dan pengaman sistem.

const Mesin = (() => {
  // ---------- data contoh ----------
  const KONTAK = [
    { id: "bk", nama: "Guru BK jaga", nilai: "Bu Sari · ruang BK", jam: "06.00–21.00", untuk: ["semua"] },
    { id: "healing119", nama: "Healing119 (Kemenkes)", nilai: "Telepon 119 ext. 8", jam: "24 jam", untuk: ["keselamatan_diri"] },
    { id: "sapa129", nama: "SAPA 129 (KemenPPPA)", nilai: "Telepon 129 · WA 08111-129-129", jam: "24 jam", untuk: ["kekerasan_fisik", "kekerasan_seksual", "perundungan"] },
    { id: "darurat", nama: "Darurat", nilai: "Telepon 112", jam: "24 jam", untuk: ["semua"] },
  ];

  const KONSELOR = [
    { id: "sari", nama: "Bu Sari Wulandari", gelar: "Guru BK · terverifikasi" },
    { id: "bayu", nama: "Pak Bayu Pratama", gelar: "Guru BK · terverifikasi" },
  ];

  // Nama warga sekolah untuk penyamar (contoh). Di sistem sungguhan diambil dari daftar siswa.
  const WARGA = ["Rina", "Dina", "Andi", "Bayu", "Sari", "Nadia", "Raka", "Putri", "Fajar", "Laras"];

  // Basis rujukan CONTOH. Judul dan isi rekaan untuk demo; di sistem sungguhan
  // hanya dokumen berizin yang sudah diverifikasi ahli.
  const RUJUKAN = {
    "CONTOH-BK-01": { judul: "Panduan Layanan BK (dokumen contoh)", hal: {
      14: "Langkah pengelolaan emosi: bantu murid mengenali tanda tubuh saat cemas, menamai perasaannya, lalu berlatih napas perlahan sebelum belajar.",
      22: "Konseling individual diawali membangun hubungan, menggali permasalahan dengan pertanyaan terbuka, lalu menyepakati tujuan bersama murid.",
      31: "Untuk kecemasan akademik, susun jadwal belajar bertahap bersama murid dan evaluasi kemajuannya setiap pertemuan.",
      40: "Indikator keberhasilan dirumuskan dalam perilaku yang dapat diamati, misalnya murid dapat menyebutkan dua cara menenangkan diri.",
      52: "Alih tangan kasus dilakukan bila permasalahan di luar kewenangan guru BK, dengan persetujuan murid dan koordinasi pimpinan sekolah.",
    }},
    "CONTOH-SOP-02": { judul: "SOP Penanganan Krisis Sekolah (dokumen contoh)", hal: {
      3: "Bila murid menyebut pikiran menyakiti diri: temui murid pada hari yang sama, pastikan ia tidak sendirian, hubungi pimpinan sekolah, dan rujuk ke layanan kesehatan jiwa.",
      5: "Bila ada dugaan kekerasan terhadap murid: utamakan keselamatan murid, catat keterangan tanpa menginterogasi, laporkan ke kepala sekolah, dan hubungi layanan pelindungan anak.",
      7: "Perundungan ditangani dengan memastikan keamanan korban, memanggil pihak terkait secara terpisah, dan melibatkan wali kelas.",
    }},
    "CONTOH-KAR-03": { judul: "Modul Bimbingan Karier (dokumen contoh)", hal: {
      8: "Bimbingan pemilihan jurusan dimulai dengan mengenali minat, nilai, dan kemampuan murid melalui diskusi dan lembar refleksi.",
      12: "Libatkan orang tua dalam diskusi pilihan studi lanjut dengan menyiapkan informasi jurusan dan peluangnya.",
    }},
    "CONTOH-KEL-04": { judul: "Panduan Kerja Sama Sekolah dan Keluarga (dokumen contoh)", hal: {
      6: "Komunikasi dengan orang tua dilakukan dengan persetujuan murid, kecuali ada risiko keselamatan yang diatur SOP pelindungan anak.",
      9: "Bantu murid berlatih menyampaikan perasaan kepada orang tua dengan kalimat 'aku merasa ... ketika ...'.",
    }},
  };

  const KARTU = {
    napas: { id: "K-01", judul: "Napas perlahan 4–4", langkah: ["Tarik napas lewat hidung selama 4 hitungan.", "Hembuskan perlahan selama 4 hitungan.", "Ulangi 5 kali sambil memperhatikan bahu yang mengendur."] },
    pecah: { id: "K-02", judul: "Pecah jadi langkah kecil", langkah: ["Tulis satu tugas yang paling dekat waktunya.", "Bagi jadi tiga langkah yang masing-masing selesai dalam 20 menit.", "Kerjakan langkah pertama saja malam ini."] },
    bicara: { id: "K-03", judul: "Kalimat 'aku merasa'", langkah: ["Tulis: 'Aku merasa ... ketika ...'.", "Tambahkan: 'Aku berharap ...'.", "Pilih waktu tenang untuk menyampaikannya."] },
    orang: { id: "K-04", judul: "Satu orang tepercaya", langkah: ["Tulis nama satu orang dewasa yang kamu percaya.", "Pilih satu hal kecil yang ingin kamu ceritakan padanya.", "Tentukan kapan kamu bisa menemuinya."] },
  };

  // ---------- penyamar ----------
  const POLA = [
    ["EMAIL", /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g],
    ["AKUN", /(^|[^\w@])@[A-Za-z0-9_.]{3,}/g],
    ["TELP", /(?<!\d)(?:\+62|62|0)8\d(?:[\s.-]?\d){6,11}(?!\d)/g],
    ["NOMOR", /(?<!\d)\d{8,}(?!\d)/g],
  ];
  const RE_WARGA = new RegExp(`\\b(${WARGA.join("|")})\\b`, "gi");
  const RE_SAPAAN = /\b(Pak|Bu|Ibu|Bapak|Kak|Mas|Mbak)\s+([A-Z][\w'-]+)/g;

  function samarkan(teks) {
    const peta = new Map();
    const catatan = [];
    const token = (jenis, nilai) => {
      const k = nilai.toLowerCase();
      if (!peta.has(k)) {
        const n = [...peta.values()].filter((t) => t.startsWith(`[${jenis}_`)).length + 1;
        peta.set(k, `[${jenis}_${n}]`);
        catatan.push([nilai, `[${jenis}_${n}]`]);
      }
      return peta.get(k);
    };
    let t = teks;
    for (const [jenis, re] of POLA) {
      t = t.replace(re, (m, awal) => (jenis === "AKUN" ? (awal || "") + token(jenis, m.slice((awal || "").length)) : token(jenis, m)));
    }
    t = t.replace(RE_WARGA, (m) => token("NAMA", m));
    t = t.replace(RE_SAPAAN, (m, s, n) => (n.startsWith("[") ? m : `${s} ${token("NAMA", n)}`));
    return { teks: t, catatan };
  }

  const adaNomorInduk = (teks) => /(?<!\d)(\d{10}|\d{16})(?!\d)/.test(teks.replace(POLA[2][1], " "));

  // ---------- pemilah risiko (kamus contoh, belum disetujui ahli) ----------
  const KAMUS = [
    [3, "keselamatan_diri", /bunuh diri|mengakhiri hidup|akhiri hidup|mau mati malam ini|(udah|sudah) (siapin|siapkan|nyiapin) (tali|obat|pisau|cara)|loncat dari|ingin mati sekarang|mau mati sekarang/],
    [3, "kekerasan_fisik", /(lagi|sedang) dipukul|dia mau mukul aku sekarang|aku dikunci|tidak aman sekarang|gak aman sekarang|ga aman sekarang/],
    [3, "bahaya_bagi_orang_lain", /mau (bunuh|nusuk|melukai) (dia|mereka|orang)|bawa pisau ke sekolah/],
    [2, "keselamatan_diri", /pengen (ngilang|hilang|mati)|ingin (menghilang|mati|hilang)|mau ngilang|capek hidup|lelah hidup|gak ada gunanya hidup|ga ada gunanya( aku)? hidup|nyakitin diri|menyakiti diri|melukai diri|nyilet|silet tangan|tidak ada jalan keluar|ga ada jalan keluar|gak ada jalan keluar|mending aku gak ada|lebih baik aku tidak ada/],
    [2, "kekerasan_fisik", /dipukul|ditampar|dipukuli|ditendang|disiksa|dikurung/],
    [2, "kekerasan_seksual", /dilecehkan|dipegang-pegang|dipaksa (cium|buka)|pelecehan/],
    [2, "perundungan", /dibully|di-bully|dirundung|diejek terus|dikucilkan|dipalak|diancam/],
    [2, "penelantaran", /gak dikasih makan|ga dikasih makan|ditinggal sendirian berhari/],
  ];
  const TERTEKAN = /cemas|takut|sedih|stres|stress|capek|lelah|marah|kesal|bingung|kesepian|nangis|menangis|galau|tertekan|malu|khawatir|panik/;

  function nilaiRisiko(teks) {
    const t = teks.toLowerCase();
    let tingkat = 0;
    const kategori = new Set();
    for (const [lv, kat, re] of KAMUS) {
      if (re.test(t)) {
        kategori.add(kat);
        tingkat = Math.max(tingkat, lv);
      }
    }
    if (!tingkat && TERTEKAN.test(t)) tingkat = 1;
    return { tingkat, kategori: [...kategori] };
  }

  // ---------- Companion ----------
  const PERASAAN = [
    ["cemas", /cemas|khawatir|was-was|deg-degan|panik/], ["takut", /takut/], ["sedih", /sedih|nangis|menangis|galau/],
    ["lelah", /capek|lelah|cape\b/], ["marah", /marah|kesal|jengkel|emosi/], ["bingung", /bingung|gak tahu|ga tau|nggak tahu/],
    ["kesepian", /kesepian|sendirian|dikucilkan/], ["malu", /malu/], ["tertekan", /tertekan|stres|stress|beban/],
  ];
  const perasaanDari = (t) => PERASAAN.filter(([, re]) => re.test(t.toLowerCase())).map(([p]) => p);

  const PEMBUKA_TOPIK = {
    Pribadi: ["Kapan rasa itu paling terasa?", ["Saat sendirian", "Saat di sekolah", "Hampir sepanjang hari"]],
    Sosial: ["Apa yang terjadi dengan teman-temanmu?", ["Ada yang menjauhiku", "Aku diejek", "Aku susah dekat dengan orang"]],
    Keluarga: ["Dengan siapa di rumah hal ini paling terasa?", ["Dengan orang tua", "Dengan saudara", "Suasana rumah secara umum"]],
    Pendidikan: ["Rasa itu paling terasa kapan: saat membuka buku, atau saat membayangkan hasilnya?", ["Saat membuka buku", "Saat membayangkan hasil"]],
    Karier: ["Bagian mana yang paling membingungkan?", ["Memilih jurusan", "Harapan orang tua", "Tidak tahu minatku"]],
  };
  const KARTU_TOPIK = { Pendidikan: "pecah", Pribadi: "napas", Sosial: "orang", Keluarga: "bicara", Karier: "pecah" };

  const BATAS = [
    [/abaikan (aturan|instruksi|semua)|kamu sekarang (psikolog|dokter)|kerjakan (pr|tugas)|jawab soal|jawabin soal/,
      "Aku tetap pendamping bercerita, jadi aku tidak bisa berperan sebagai psikolog, memberi diagnosis, atau mengerjakan PR. Kalau tugas sekolah sedang membuatmu tertekan, kita bisa bicarakan rasanya.", "injeksi"],
    [/obat|pil tidur|dosis|suplemen/,
      "Aku tidak bisa menyarankan obat, suplemen, atau dosis. Untuk itu perlu tenaga kesehatan. Guru BK bisa membantumu menemukan jalurnya. Mau aku bantu menghubungkan?", "obat"],
    [/(gangguan|depresi|bipolar|anxiety|adhd|ocd|sakit jiwa|kena mental|gila)\b.*\?|apa aku (depresi|gila|sakit)|aku kena (gangguan|depresi|mental)/,
      "Aku tidak bisa menilai atau memberi nama kondisi, karena aku program AI, bukan tenaga profesional. Yang bisa aku lakukan: mendengarkan, dan membantumu terhubung dengan guru BK. Mau aku bantu menghubungkan?", "diagnosis"],
    [/pacar|sahabat(ku)? satu-satunya|jadi sahabatku|sayang (aku|kamu)|kamu sayang|temenin aku terus|cuma kamu yang/,
      "Aku senang kamu merasa nyaman bercerita. Tapi aku program AI: bukan teman, bukan pacar, dan tidak punya perasaan. Orang-orang di sekitarmu bisa memberi dukungan yang tidak bisa aku berikan. Siapa satu orang yang biasanya kamu percaya?", "keterikatan"],
    [/rahasia|janji (jangan|gak|ga)|jangan bilang|jangan kasih tahu/,
      "Isi ceritamu tidak dibagikan tanpa persetujuanmu. Tapi aku harus jujur: bila ada tanda kamu atau orang lain dalam bahaya, guru BK diberi tahu bahwa kamu perlu ditemui. Isi ceritamu tidak ikut dikirim.", "rahasia"],
  ];

  function balas(sesi, teks, risiko) {
    const t = teks.toLowerCase();
    const sebelumnya = sesi.pesan.filter((p) => p.dari === "saya").length - 1;
    const kat = risiko.kategori;

    if (risiko.tingkat >= 3) {
      return { teks: "Terima kasih sudah memberitahuku. Aku khawatir dengan keselamatanmu sekarang. Apakah kamu aman di tempatmu saat ini? Tolong hubungi orang dewasa yang kamu percaya sekarang, atau pakai pilihan bantuan di layar. Aku tetap di sini.", tetap: true };
    }
    if (risiko.tingkat === 2) {
      if (kat.includes("keselamatan_diri")) return { teks: "Terima kasih sudah bilang. Kedengarannya kamu sedang sangat lelah, dan itu berat. Aku mau tanya langsung: apakah kamu aman saat ini? Apakah ada pikiran untuk menyakiti dirimu?", tetap: true };
      if (kat.some((k) => k.startsWith("kekerasan"))) return { teks: "Terima kasih sudah berani cerita. Yang terjadi padamu tidak benar, dan itu bukan salahmu. Apakah kamu aman saat ini?", tetap: true };
      if (kat.includes("perundungan")) return { teks: "Terima kasih sudah cerita. Diperlakukan seperti itu memang menyakitkan, dan itu bukan salahmu. Apakah kamu merasa aman di sekolah saat ini?", tetap: true };
      return { teks: "Terima kasih sudah cerita. Itu terdengar berat. Apakah kamu aman saat ini?", tetap: true };
    }
    if (/^aku aman sekarang/.test(t)) {
      return { teks: "Syukurlah. Terima kasih sudah jujur. Kalau kamu mau, aku bisa bantu menghubungkanmu ke guru BK, supaya ada orang dewasa yang menemanimu menghadapi ini.", cepat: ["Hubungkan ke guru BK", "Nanti dulu"], tawarkan: true };
    }
    for (const [re, jawab, jenis] of BATAS) {
      if (re.test(t)) return { teks: jawab, batas: jenis, tawarkan: jenis === "obat" || jenis === "diagnosis", cepat: jenis === "obat" || jenis === "diagnosis" ? ["Hubungkan ke guru BK", "Nanti dulu"] : [] };
    }
    if (/^nanti dulu/.test(t)) return { teks: "Baik, tidak apa-apa. Tombol \"Butuh konselor?\" di atas selalu ada kalau kamu berubah pikiran. Ada hal lain yang ingin kamu ceritakan?" };

    const semua = sesi.pesan.filter((p) => p.dari === "saya").map((p) => p.teks).join(" ");
    const rasa = perasaanDari(semua);
    const rasaTeks = rasa.length ? rasa.slice(0, 2).join(" dan ") : "tertekan";
    const angka = t.match(/\b(10|[1-9])\b/);
    const berat = (angka && Number(angka[1]) >= 7) || /7-10|7 sampai 10/.test(t);

    if (sebelumnya <= 0) {
      const [tanya, cepat] = PEMBUKA_TOPIK[sesi.topik] || ["Boleh ceritakan sedikit lagi apa yang terjadi?", []];
      const r = perasaanDari(teks);
      return { teks: r.length ? `Kedengarannya kamu sedang merasa ${r.slice(0, 2).join(" dan ")}, dan itu berat. ${tanya}` : `Terima kasih sudah mau cerita. ${tanya}`, cepat };
    }
    if (sebelumnya === 1) return { teks: "Aku menangkap bahwa ini cukup mengganggumu. Sejak kapan kamu merasakannya?", cepat: ["Beberapa hari ini", "Sudah beberapa minggu", "Sudah lama"] };
    if (sebelumnya === 2) return { teks: "Terima kasih. Kalau dinilai dari 1 sampai 10, seberapa mengganggu rasanya buat kegiatanmu sehari-hari?", cepat: ["1–3", "4–6", "7–10"] };
    if (sebelumnya === 3) {
      const tambahan = berat ? " Angka itu cukup tinggi, jadi aku ingin memastikan kamu tidak menghadapinya sendirian." : "";
      return { teks: `Yang aku tangkap: kamu merasa ${rasaTeks} terkait hal ${String(sesi.topik).toLowerCase()}, dan ini sudah terasa beberapa waktu.${tambahan} Apakah itu tepat?`, cepat: ["Iya, tepat", "Belum tepat"], tawarkan: berat };
    }
    if (sebelumnya === 4) {
      if (/belum tepat|tidak tepat|bukan/.test(t)) return { teks: "Maaf kalau aku keliru. Bagian mana yang belum tepat?" };
      const kartu = KARTU[KARTU_TOPIK[sesi.topik] || "napas"];
      return { teks: "Ada satu langkah kecil yang bisa kamu coba, dari kartu keterampilan yang sudah disetujui ahli. Kalau masalah ini terus terasa berat, guru BK bisa membantu lebih jauh. Mau aku bantu menghubungkan?", kartu, cepat: ["Hubungkan ke guru BK", "Nanti dulu"], tawarkan: true };
    }
    return { teks: "Aku masih di sini mendengarkan. Ada hal lain yang ingin kamu ceritakan, atau mau aku bantu menghubungkan ke guru BK?", cepat: ["Hubungkan ke guru BK"], tawarkan: true };
  }

  // ---------- peringkas untuk berbagi ----------
  function ringkas(sesi) {
    const kalimat = sesi.pesan.filter((p) => p.dari === "saya" && !/^(iya|belum|aku aman|nanti dulu|hubungkan|\d|beberapa|sudah|saat |dengan |memilih|ada yang|aku diejek|aku susah|harapan|tidak tahu|hampir)/i.test(p.teks))
      .map((p) => p.teks.trim()).filter((x) => x.length > 12);
    const ganti = (x) => x.replace(RE_WARGA, "seorang teman").replace(POLA[2][1], "[nomor]").replace(POLA[0][1], "[email]");
    const kapital = (x) => x.charAt(0).toUpperCase() + x.slice(1);
    let inti = kalimat.slice(0, 2).map((x) => ganti(x).replace(/[.!?]*$/, ".").split(/(?<=[.!?]\s)/).map(kapital).join("")).join(" ");
    if (!inti) inti = `Aku ingin bercerita tentang hal ${String(sesi.topik).toLowerCase()}.`;
    const rasa = perasaanDari(sesi.pesan.filter((p) => p.dari === "saya").map((p) => p.teks).join(" "));
    const teks = `${inti}${rasa.length ? ` Aku merasa ${rasa.slice(0, 3).join(", ")}.` : ""} Aku berharap guru BK bisa membantuku.`;
    const kata = teks.split(/\s+/);
    return { topik: sesi.topik, perasaan: rasa, ringkasan: kata.length > 120 ? kata.slice(0, 120).join(" ") + "…" : teks };
  }

  // ---------- Asisten Konselor ----------
  const S = (doc, hal) => ({ doc, hal });
  const PAKET = {
    akademik: {
      ringkasan: "Kecemasan yang berkaitan dengan tuntutan belajar dan hasil ujian.",
      masalah: ["Kecemasan akademik", "Sulit fokus", "Tekanan harapan"],
      gali: ["Sejak kapan sulit fokus muncul?", "Bagaimana pola tidur dan jadwal belajarnya?", "Apa yang dikatakan orang tua tentang hasil ujian?"],
      pendekatan: [
        { nama: "Pengelolaan emosi", alasan: "Keluhan utama berupa cemas yang mengganggu fokus belajar.", teknik: ["Mengenali tanda tubuh", "Latihan napas perlahan"], sumber: [S("CONTOH-BK-01", 14)] },
        { nama: "Perencanaan belajar bertahap", alasan: "Waktu persiapan terbatas dan murid merasa kewalahan.", teknik: ["Jadwal belajar bertahap", "Evaluasi tiap pertemuan"], sumber: [S("CONTOH-BK-01", 31)] },
      ],
    },
    sosial: {
      ringkasan: "Masalah relasi dengan teman sebaya yang membuat murid merasa tidak nyaman di sekolah.",
      masalah: ["Relasi teman sebaya", "Rasa tidak aman di sekolah"],
      gali: ["Siapa saja yang terlibat, dan sejak kapan?", "Di mana kejadiannya biasa terjadi?", "Apakah wali kelas sudah tahu?"],
      pendekatan: [
        { nama: "Konseling individual", alasan: "Murid perlu ruang aman untuk menceritakan kejadian secara utuh.", teknik: ["Pertanyaan terbuka", "Menyepakati tujuan"], sumber: [S("CONTOH-BK-01", 22)] },
        { nama: "Penanganan perundungan", alasan: "Ada indikasi perlakuan berulang dari teman.", teknik: ["Memastikan keamanan korban", "Memanggil pihak terkait terpisah"], sumber: [S("CONTOH-SOP-02", 7)] },
      ],
    },
    keluarga: {
      ringkasan: "Ketegangan komunikasi dengan keluarga yang memengaruhi suasana hati murid.",
      masalah: ["Komunikasi dengan orang tua", "Beban perasaan"],
      gali: ["Hal apa yang paling sulit disampaikan ke orang tua?", "Apakah murid ingin orang tua dilibatkan?"],
      pendekatan: [
        { nama: "Latihan menyampaikan perasaan", alasan: "Murid kesulitan menyampaikan perasaannya kepada orang tua.", teknik: ["Kalimat 'aku merasa ... ketika ...'"], sumber: [S("CONTOH-KEL-04", 9)] },
        { nama: "Konseling individual", alasan: "Perlu memahami situasi rumah dari sudut murid lebih dulu.", teknik: ["Pertanyaan terbuka"], sumber: [S("CONTOH-BK-01", 22)] },
      ],
    },
    karier: {
      ringkasan: "Kebingungan memilih jurusan atau arah studi lanjut.",
      masalah: ["Pilihan jurusan", "Mengenali minat"],
      gali: ["Mata pelajaran apa yang paling dinikmati?", "Apa harapan orang tua, dan apakah sejalan dengan minat murid?"],
      pendekatan: [
        { nama: "Bimbingan karier", alasan: "Murid belum mengenali minat dan kemampuannya.", teknik: ["Diskusi minat dan nilai", "Lembar refleksi"], sumber: [S("CONTOH-KAR-03", 8)] },
        { nama: "Melibatkan orang tua", alasan: "Ada perbedaan harapan dengan orang tua.", teknik: ["Menyiapkan informasi jurusan bersama"], sumber: [S("CONTOH-KAR-03", 12)] },
      ],
    },
  };

  function jenisKasus(t) {
    if (/jurusan|kuliah|karier|karir|cita-cita|minat/.test(t)) return "karier";
    if (/teman|bully|rundung|diejek|dikucilkan|dijauhi|sebaya/.test(t)) return "sosial";
    if (/orang tua|ayah|ibu|keluarga|rumah|saudara/.test(t) && !/ujian|belajar|nilai/.test(t)) return "keluarga";
    return "akademik";
  }

  function asisten(mode, uraianTersamar) {
    const t = uraianTersamar.toLowerCase();
    const kosong = { status: "ok", pesan: "", tanda_risiko: [], ringkasan: "", permasalahan_utama: [], fakta_dari_kasus: [], hal_yang_perlu_digali: [], alternatif_pendekatan: [], rencana_sesi: [], tindak_lanjut: [], dibuang: [] };
    const log = [];
    if (/obat|dosis|resep|diagnosis apa|diagnosisnya/.test(t)) {
      log.push(["Validasi", "Rujukan tidak memuat obat atau dosis; status tidak_ditemukan."]);
      return { hasil: { ...kosong, status: "tidak_ditemukan", pesan: "Basis rujukan tidak memuat obat, dosis, atau diagnosis. Bila perlu, pertimbangkan alih tangan kasus ke tenaga kesehatan.", tindak_lanjut: [{ uraian: "Pertimbangkan alih tangan kasus ke tenaga kesehatan dengan persetujuan murid.", sumber: [S("CONTOH-BK-01", 52)] }] }, log };
    }
    const p = PAKET[jenisKasus(t)];
    const h = { ...kosong };
    const r = nilaiRisiko(t);
    if (r.tingkat >= 2) {
      const diri = r.kategori.includes("keselamatan_diri");
      h.tanda_risiko.push({ uraian: diri ? "Uraian menyebut pikiran atau tindakan menyakiti diri." : "Uraian menyebut dugaan kekerasan atau perundungan.",
        prosedur: diri ? "Temui murid hari ini, pastikan ia tidak sendirian, hubungi pimpinan sekolah, dan rujuk ke layanan kesehatan jiwa." : "Utamakan keselamatan murid, catat keterangan tanpa menginterogasi, dan laporkan ke kepala sekolah.",
        sumber: [S("CONTOH-SOP-02", diri ? 3 : 5)] });
      log.push(["Risiko", `Tanda bahaya ditemukan di uraian; prosedur diambil dari SOP contoh hlm. ${diri ? 3 : 5}.`]);
    }
    const fakta = uraianTersamar.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter((x) => x.length > 8).slice(0, 4);
    if (mode === "analisis_kasus") {
      Object.assign(h, { ringkasan: p.ringkasan, permasalahan_utama: p.masalah, fakta_dari_kasus: fakta, hal_yang_perlu_digali: p.gali });
    } else if (mode === "pendekatan") {
      h.alternatif_pendekatan = p.pendekatan.map((x) => ({ ...x, batas_kewenangan: "" }));
      h.dibuang = ["Satu butir pendekatan dibuang karena tidak bersumber dari basis rujukan."];
      log.push(["Validasi", "K1: 1 butir tanpa sumber dibuang. K2 dan K3 lulus."]);
    } else if (mode === "rencana_sesi") {
      h.rencana_sesi = [
        { ke: 1, tujuan: "Membangun hubungan dan memahami permasalahan dari sudut murid.", kegiatan: "Wawancara dengan pertanyaan terbuka; sepakati tujuan bersama.", indikator: "Murid menyebutkan satu hal yang ingin ia ubah.", sumber: [S("CONTOH-BK-01", 22)] },
        { ke: 2, tujuan: p.pendekatan[0].nama + ".", kegiatan: p.pendekatan[0].teknik.join("; ") + ".", indikator: "Murid dapat menyebutkan dua cara menenangkan diri.", sumber: [...p.pendekatan[0].sumber, S("CONTOH-BK-01", 40)] },
        { ke: 3, tujuan: "Evaluasi dan rencana lanjutan.", kegiatan: "Tinjau kemajuan; putuskan dilanjutkan, dihentikan, atau dialihtangankan.", indikator: "Ada kesepakatan langkah berikutnya.", sumber: [S("CONTOH-BK-01", 52)] },
      ];
    } else {
      h.tindak_lanjut = [
        { uraian: "Evaluasi kemajuan murid pada pertemuan berikutnya dengan indikator yang disepakati.", sumber: [S("CONTOH-BK-01", 40)] },
        { uraian: "Bila permasalahan di luar kewenangan guru BK, lakukan alih tangan kasus dengan persetujuan murid.", sumber: [S("CONTOH-BK-01", 52)] },
      ];
      if (jenisKasus(t) === "keluarga" || jenisKasus(t) === "karier") h.tindak_lanjut.push({ uraian: "Libatkan orang tua hanya dengan persetujuan murid.", sumber: [S("CONTOH-KEL-04", 6)] });
    }
    if (!log.some(([a]) => a === "Validasi")) log.push(["Validasi", "K1 (tiap butir bersumber), K2 (tanpa diagnosis), K3 (tanpa data pribadi): lulus."]);
    return { hasil: h, log };
  }

  const kutipan = (s) => {
    const d = RUJUKAN[s.doc];
    return d ? { judul: d.judul, teks: d.hal[s.hal] || "" } : { judul: s.doc, teks: "" };
  };

  return { KONTAK, KONSELOR, KARTU, samarkan, adaNomorInduk, nilaiRisiko, balas, ringkas, asisten, kutipan };
})();
