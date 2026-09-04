# 👥 Kelompokin - Pengacakan & Pertukaran Kelompok Mahasiswa Realtime

Aplikasi web modern untuk **pembagian kelompok mahasiswa secara acak** dan **pertukaran kelompok mandiri berbasis kode persetujuan (Mutual Code Approval)** dengan teknologi 100% **Firebase Free Tier (Spark Plan)**.

---

## ✨ Fitur Utama

### 👨‍🎓 Mahasiswa (Student)
1. **Google Sign-In**: Login cepat dengan akun Google via Firebase Auth.
2. **Wajib Lengkapi Profil**: Modal yang mewajibkan pengisian **NIM** dan **Nama Lengkap** resmi pada saat pertama kali login.
3. **Kartu Kelompok Saya**: Melihat kelompok, topik projek, dan rekan satu kelompok lengkap dengan NIM & kontak.
4. **Pertukaran Kelompok Berbasis Kode (Mutual Swap)**:
   - **Ajukan Tukar**: Mahasiswa membuat kode unik (misal `KP-8X2M`) berdurasi 30 menit dan dapat langsung dibagikan ke WhatsApp.
   - **Tukar dengan Kode**: Mahasiswa lain memasukkan kode tersebut, melihat tinjauan pertukaran (Student A $\leftrightarrow$ Student B), dan menyetujui pertukaran. Posisi kelompok langsung tertukar seketika secara realtime!
5. **Papan Susunan Semua Kelompok**: Pencarian rekan kelas berdasarkan nama/NIM untuk mencari teman barter kelompok.

### 👨‍🏫 Dosen / Pengampu (Lecturer)
1. **Generator Pengacakan Merata**: Algoritma Fisher-Yates untuk membagi 42 mahasiswa secara adil ke dalam $N$ kelompok dengan efek visual dan selebrasi confetti.
2. **Kunci / Buka Pertukaran**: Dosen dapat menutup fitur pertukaran kelompok jika batas waktu sudah habis (*Swap Lock*).
3. **Live Board & Manual Move**: Dosen dapat memindahkan mahasiswa antar kelompok secara manual kapan saja dan mengubah topik projek kelompok.
4. **Riwayat Pertukaran (Audit Trail)**: Catatan log realtime lengkap setiap ada mahasiswa yang bertukar kelompok.
5. **Ekspor ke Excel (.xlsx)**: Unduh susunan kelompok resmi ke dalam format spreadsheet yang rapi.
6. **Data 42 Mahasiswa UNDHI**: Sudah terintegrasi data 42 mahasiswa Universitas Dharma Indonesia.

---

## 🚀 Cara Menjalankan di Lokal

1. Masuk ke direktori:
   ```bash
   cd /Users/nb-mac-fj2n0x/Work/wproject/kuliah/kelompokin
   ```
2. Jalankan server development:
   ```bash
   npm run dev
   ```
3. Buka di browser: `http://localhost:5174`

---

## 🔒 Keamanan & Free Tier Firebase (100% Spark Plan)

Aplikasi ini menggunakan:
- **Firebase Auth** (Google Provider) $\rightarrow$ *Unlimited Gratis*
- **Cloud Firestore** $\rightarrow$ Kuota harian 50.000 read & 20.000 write (kebutuhan 42 mahasiswa hanya < 2% kuota)
- **Firebase Hosting** $\rightarrow$ Gratis

### Aturan Firestore (firestore.rules) Rekomendasi:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if true;
    }
    match /groups/{groupId} {
      allow read, write: if true;
    }
    match /swap_codes/{codeId} {
      allow read, write: if true;
    }
    match /swap_logs/{logId} {
      allow read, write: if true;
    }
    match /app_settings/{docId} {
      allow read, write: if true;
    }
  }
}
```
