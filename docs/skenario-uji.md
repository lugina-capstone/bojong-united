# Skenario uji dengan data demo

Data demo dibuat oleh `npm run db:seed` jika `DEMO_PASSWORD` diisi di `.env`. Hanya untuk lokal dan staging: seed menolak berjalan dengan `NODE_ENV=production`.

- Semua akun demo memakai kata sandi `DEMO_PASSWORD` dan email `@becraft.test`. Administrator memakai `ADMIN_EMAIL` dan `ADMIN_PASSWORD`.
- Seed dilewati jika organisasi `BECRAFT1` sudah ada. Untuk mengulang dari awal (menghapus seluruh isi database): `npx prisma migrate reset`, lalu `npm run db:seed`.
- Tanggal dihitung relatif dari saat seed dijalankan, jadi acara "berjalan" dan "akan datang" tetap sesuai setelah seed ulang.
- Kiriman demo berupa tautan dan teks. Unggah berkas diuji langsung lewat aplikasi karena seed tidak menulis ke object storage.

## Organisasi

| Kode       | Nama                      | Status   | Dipakai untuk                                       |
| ---------- | ------------------------- | -------- | --------------------------------------------------- |
| `BECRAFT1` | SMK Harapan Bangsa        | Aktif    | Organisasi utama semua alur                         |
| `POLTEK01` | Politeknik Karya Mandiri  | Aktif    | Organisasi kedua untuk uji isolasi antar-organisasi |
| `KREATIF1` | Lembaga Kreatif Bandung   | Menunggu | Administrator menyetujui                            |
| `YAYASAN1` | Yayasan Cipta Karya       | Menunggu | Administrator menolak dengan alasan                 |
| `DITOLAK1` | PT Contoh Ditolak         | Ditolak  | Layar ditolak dan ajukan ulang                      |
| `NONAKTF1` | Komunitas Desain Nonaktif | Nonaktif | Administrator mengaktifkan kembali                  |

## Akun

| Email                 | Nama           | Peran                                 | Kondisi awal                                                                                        |
| --------------------- | -------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `ADMIN_EMAIL`         | Administrator  | Administrator                         | 2 pengajuan organisasi menunggu, 2 notifikasi belum dibaca                                          |
| `admin.organisasi`    | Siti Rahmawati | Admin Organisasi + Trainer (BECRAFT1) | 1 pengajuan Trainer menunggu, acara yang dialihkan kepadanya, materi sendiri                        |
| `guru`                | Budi Santoso   | Guru (BECRAFT1)                       | Acara berjalan, draf awal, draf siap terbit, acara ditutup, acara arsip, pengajuan Trainer menunggu |
| `guru2`               | Sari Dewanti   | Guru (BECRAFT1)                       | Acara selesai dengan rekap dan sertifikat; rubrik sendiri                                           |
| `asesor`              | Rina Kusuma    | Asesor (BECRAFT1)                     | Acara tim berjalan dan akan datang, 1 kiriman menunggu dinilai, pengajuan Trainer ditolak           |
| `trainer`             | Andi Pratama   | Trainer (BECRAFT1)                    | Materi terbit, draf, arsip, khusus acara, tanpa acara; acara akan datang                            |
| `trainer.keluar`      | Wahyu Setiawan | Trainer (BECRAFT1)                    | 1 materi dan 1 acara; dipakai untuk uji mengeluarkan anggota                                        |
| `admin.organisasi2`   | Yoga Permana   | Admin Organisasi + Guru (POLTEK01)    | 1 acara berjalan, 1 rubrik                                                                          |
| `trainer2`            | Tari Anggraini | Trainer (POLTEK01)                    | 1 materi terbit                                                                                     |
| `peserta`             | Dimas Saputra  | Peserta                               | Lulus 2 acara, 2 sertifikat, materi selesai, ketua kelompok                                         |
| `ayu`                 | Ayu Wulandari  | Peserta                               | Revisi versi 2 menunggu; ketua tim penuh; milestone 2 terbuka; materi 50%                           |
| `rizky`               | Rizky Maulana  | Peserta                               | Nilai di bawah KKM; diminta revisi; undangan tim menunggu; materi arsip selesai                     |
| `nanda`               | Nanda Putri    | Peserta                               | Anggota 2 tim; kiriman menunggu dinilai; ikut acara organisasi lain; materi 0%                      |
| `galih`               | Galih Ramadhan | Peserta                               | Survei belum diisi; belum mengumpulkan di acara tim; ikut acara yang ditutup                        |
| `peserta.selesai`     | Putri Anjani   | Peserta                               | Hanya acara selesai dan sertifikat (boleh hapus akun)                                               |
| `peserta.baru`        | Lina Marlina   | Peserta                               | Belum ikut apa pun                                                                                  |
| `belum.verifikasi`    | Bagas Nugroho  | Peserta                               | Email belum diverifikasi                                                                            |
| `dikeluarkan`         | Fajar Hidayat  | Dikeluarkan dari BECRAFT1             | Layar "dikeluarkan"                                                                                 |
| `pemohon`, `pemohon2` | Dewi, Indra    | Pemohon organisasi                    | Layar menunggu persetujuan                                                                          |
| `ditolak`             | Hendra Wijaya  | Pemohon ditolak                       | Layar ditolak dengan alasan                                                                         |
| `nonaktif`            | Maya Sari      | Admin organisasi nonaktif             | Layar organisasi dinonaktifkan                                                                      |

Ada juga satu akun Peserta yang sudah dihapus (tanpa login): kiriman dan nilainya di "Kompetisi Infografis Kemerdekaan" tampil sebagai "Akun dihapus".

## Acara

| Acara                             | Pembuat             | Jenis    | Kondisi                                                           |
| --------------------------------- | ------------------- | -------- | ----------------------------------------------------------------- |
| Lomba Desain Poster Hari Guru     | `guru`              | Individu | Berjalan; lulus, revisi, di bawah KKM, survei belum diisi         |
| Workshop Wireframe Sehari         | `guru`              | Individu | Draf belum lengkap                                                |
| Pameran Karya Akhir Semester      | `guru`              | Individu | Draf lengkap, siap diterbitkan                                    |
| Kelas Kilat Desain Logo           | `guru`              | Individu | Ditutup lebih awal                                                |
| Lomba Maskot Sekolah 2025         | `guru`              | Individu | Diarsipkan                                                        |
| Kompetisi Infografis Kemerdekaan  | `guru2`             | Individu | Selesai; dinilai Asesor; 2 lulus, 1 tidak lulus, 1 akun dihapus   |
| Proyek Aplikasi Kantin Sekolah    | `asesor`            | Tim      | Akan datang; undangan diterima, menunggu, dan ditolak             |
| Hackathon Aplikasi Sekolah        | `asesor`            | Tim      | Berjalan; tim penuh, undangan dibatalkan, dinilai/menunggu/revisi |
| Tantangan Desain Kartu Nama       | `trainer`           | Individu | Akan datang, belum ada peserta, materi khusus acara terlampir     |
| Pelatihan Dasar Desain Presentasi | `admin.organisasi`  | Individu | Dialihkan dari anggota yang dikeluarkan; 1 kiriman teks menunggu  |
| Tantangan Sketsa Produk           | `trainer.keluar`    | Individu | Akan datang; dialihkan saat pembuatnya dikeluarkan                |
| Tantangan Riset Pengguna Kampus   | `admin.organisasi2` | Individu | Organisasi lain (POLTEK01)                                        |
| Kelas Ilustrasi Digital           | `nonaktif`          | Individu | Organisasi nonaktif; tidak tampil untuk Peserta                   |

## Skenario per peran

### Administrator

1. Setujui `Lembaga Kreatif Bandung`; masuk sebagai `pemohon` dan pastikan Ruang Kerja terbuka.
2. Tolak `Yayasan Cipta Karya` dengan alasan; masuk sebagai `pemohon2` dan pastikan alasannya tampil.
3. Aktifkan kembali `Komunitas Desain Nonaktif`; "Kelas Ilustrasi Digital" kembali tampil di Jelajah.
4. Nonaktifkan `Politeknik Karya Mandiri`; acaranya hilang dari Jelajah, dan `nanda` masih bisa membaca ruang acara dari Beranda tetapi tidak bisa mengumpulkan tugas ("Acara dijeda").
5. Buka notifikasi pengajuan organisasi dan pastikan tautannya menuju halaman persetujuan.

### Admin Organisasi (`admin.organisasi`)

1. Setujui atau tolak pengajuan Trainer milik `guru`.
2. Ubah peran `guru2`, jadikan atau cabut admin, lalu keluarkan `trainer.keluar`; acara "Tantangan Sketsa Produk" dan materi "Dasar Sketsa Produk" dialihkan.
3. Lihat "Pelatihan Dasar Desain Presentasi" yang dialihkan dari `dikeluarkan`, dan nilai kiriman `galih`.
4. Ubah profil organisasi, unggah logo, dan buat ulang kode organisasi.
5. Kelola bidang: ubah nama "Pengembangan Aplikasi" (sudah dipakai, hanya admin) dan coba hapus (ditolak).
6. Isolasi: buka URL acara, rubrik, atau materi milik POLTEK01 dan pastikan "Halaman tidak ditemukan".

### Guru (`guru`, `guru2`)

1. Lanjutkan draf "Workshop Wireframe Sehari" dan terbitkan "Pameran Karya Akhir Semester".
2. Nilai revisi versi 2 milik `ayu` dan kiriman `galih` di "Lomba Desain Poster Hari Guru"; minta revisi.
3. Buat acara baru (individu dan tim), buat rubrik baru, dan lampirkan materi Trainer.
4. Edit "Rubrik Presentasi Karya" (belum dipakai); edit "Rubrik Desain Poster" (sudah dipakai, menjadi versi baru).
5. Sebagai `guru`, pastikan tidak bisa mengubah "Rubrik Infografis" milik `guru2`.
6. Buka Pantau Progres, Rekap, dan Laporan untuk acara berjalan, ditutup, diarsipkan, dan (sebagai `guru2`) selesai.
7. Pastikan menu Materi tidak tersedia dan `/ruang-kerja/materi` ditolak; ajukan Trainer sebagai `guru2`.

### Asesor (`asesor`)

1. Nilai kiriman `nanda` di "Hackathon Aplikasi Sekolah" dengan "Rubrik Proyek Aplikasi".
2. Lihat permintaan revisi untuk `rizky` dan kiriman `ayu` yang sudah dinilai; nama tim tampil di daftar.
3. Lihat isi tim "Proyek Aplikasi Kantin Sekolah" sebelum acara mulai di Pantau Progres
   dan Peserta Acara: ketua `peserta` dan anggota `nanda` yang sudah diterima. Undangan
   yang menunggu (`rizky`) atau ditolak (`ayu`) tidak tampil bagi pengajar; periksa dari
   akun Peserta.
4. Lihat nilai yang diberikan di "Kompetisi Infografis Kemerdekaan", termasuk baris "Akun dihapus".
5. Lihat notifikasi pengajuan Trainer ditolak, lalu ajukan ulang dengan topik lain.

### Trainer (`trainer`)

1. Beranda Trainer: statistik, "Materi terpopuler", dan "Aktivitas terbaru".
2. Lanjutkan draf "Foto Produk dengan Ponsel", unggah PDF, dan terbitkan.
3. Tambah bagian ke "Dasar Tipografi untuk Poster"; `peserta` kembali "belum selesai".
4. Arsipkan materi yang punya peserta; hapus materi tanpa peserta; buka statistik materi arsip.
5. Lihat peringatan "Menata Cahaya untuk Foto Produk" (khusus acara, tanpa acara).
6. Kelola acara sendiri "Tantangan Desain Kartu Nama".
7. Pastikan materi milik `admin.organisasi` dan `trainer2` tidak bisa dibuka.

### Peserta

| Akun               | Yang diuji                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `peserta`          | Unduh 2 sertifikat, Portofolio, Riwayat belajar, kelola kelompok dan undangan, coba hapus akun (ditolak)         |
| `ayu`              | Riwayat revisi, milestone 2 hackathon terbuka, tim penuh tidak bisa mengundang, lanjutkan materi 50%             |
| `rizky`            | Nilai di bawah KKM tanpa sertifikat, kirim revisi, terima/tolak undangan tim, buka materi arsip                  |
| `nanda`            | Kiriman menunggu dinilai, anggota 2 tim, acara organisasi lain, mulai materi dari 0%                             |
| `galih`            | Isi survei untuk membuka milestone berikutnya, kumpulkan tugas tim, lihat acara yang ditutup                     |
| `peserta.selesai`  | Hapus akun diizinkan; sertifikatnya ikut terhapus                                                                |
| `peserta.baru`     | Jelajah, paginasi dan filter materi, ikut acara individu, buat tim, ikut materi, materi khusus acara tersembunyi |
| `belum.verifikasi` | Masuk diarahkan ke verifikasi email                                                                              |

Semua Peserta: `/ruang-kerja`, `/organisasi`, dan `/admin` harus ditolak.
