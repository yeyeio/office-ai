# Office AI Assistant (Word Add-in)

Add-in Microsoft Word dengan antarmuka AI Copilot cerdas:
- **Bring Your Own Key (BYOK):** Mendukung OpenAI, DeepSeek, Groq, OpenRouter, atau custom provider lainnya.
- **Custom Endpoint & Offline Support:** Mendukung Ollama (`http://localhost:11434/v1`) dan LM Studio (`http://localhost:1234/v1`).
- **Baca & Edit Dokumen Langsung:** AI membaca teks yang diblok atau seluruh dokumen, lalu hasilnya bisa langsung menggantikan teks di dokumen (*one-click replace*) atau disisipkan di posisi kursor (*insert*).
- **Streaming Response:** Respon AI muncul secara langsung (mengetik real-time).
- **Zero Heavy Dependencies:** Server menggunakan Node.js bawaan dengan HTTPS lokal.

---

## 🚀 Cara Menjalankan Add-in

### Langkah 1: Jalankan Server Lokal
Pastikan Node.js terpasang, lalu jalankan di terminal folder proyek:
```bash
npm start
```
Server akan aktif di:
- `https://localhost:3000/taskpane.html`
- Manifest: `https://localhost:3000/manifest.xml`

> **Catatan Sertifikat SSL Lokal:**
> Saat pertama kali membuka `https://localhost:3000/taskpane.html` di browser Anda (Chrome/Edge), jika muncul peringatan *"Your connection is not private"* (karena self-signed cert), klik **Advanced -> Proceed to localhost (unsafe)** satu kali agar browser dan Office mempercayai koneksi lokal tersebut.

---

## 📂 Cara Memasang (Sideload) ke Microsoft Word

### Opsi A: Lewat Word di Web (Office 365 Browser) — Paling Mudah & Cepat
1. Buka [Microsoft Word Online](https://word.new) di browser Anda.
2. Buka dokumen baru atau dokumen yang ada.
3. Klik menu **Insert** -> **Add-ins** (atau ikon kotak bertuliskan *Add-ins*).
4. Pilih tab **Manage My Add-ins** -> klik tautan **Upload My Add-in**.
5. Pilih file `manifest.xml` yang ada di folder proyek ini (`C:\Users\Monster\office-ai-addin\manifest.xml`).
6. Add-in akan muncul di tab pita/ribbon dengan nama **AI Assistant** atau tombol **Buka AI Copilot**.

---

### Opsi B: Lewat Word Desktop (Windows)
1. Buka File Explorer, klik kanan folder proyek `C:\Users\Monster\office-ai-addin` -> **Properties** -> tab **Sharing** -> **Share...** (atau buat network share sederhana).
2. Salin path jaringan share folder tersebut (misal `\\localhost\office-ai-addin`).
3. Buka Microsoft Word Desktop -> **File** -> **Options** -> **Trust Center** -> **Trust Center Settings**.
4. Pilih **Trusted Add-in Catalogs**.
5. Masukkan path share tadi di kolom *Catalog URL*, klik **Add catalog**, dan centang **Show in Menu**.
6. Restart Microsoft Word.
7. Di Word, buka dokumen -> **Insert** -> **My Add-ins** -> pilih tab **Shared Folder**, lalu klik add-in Anda.

---

## ⚙️ Konfigurasi Provider AI (BYOK)

1. Klik ikon **⚙️ (Pengaturan)** di pojok kanan atas sidebar add-in.
2. Pilih preset yang diinginkan:
   - **OpenAI:** Endpoint `https://api.openai.com/v1`, Model `gpt-4o-mini` atau `gpt-4o`. Masukkan OpenAI API Key Anda.
   - **DeepSeek:** Endpoint `https://api.deepseek.com`, Model `deepseek-chat`. Masukkan DeepSeek API Key.
   - **Groq Cloud:** Endpoint `https://api.groq.com/openai/v1`, Model `llama-3.3-70b-versatile` (Super cepat dan hemat).
   - **OpenRouter:** Endpoint `https://openrouter.ai/api/v1`.
   - **Ollama (Lokal/Offline):** Endpoint `http://localhost:11434/v1`, Model `llama3.2` (API key dikosongkan).
   - **Custom:** Masukkan base URL dan model sesuai proxy/gateway Anda.
3. Klik tombol **Tes Koneksi** untuk memastikan konfigurasi bekerja, lalu klik **Simpan**.

---

## 💡 Cara Pakai di Dokumen

1. **Rapikan / Perbaiki Grammar:**
   - Blok teks di dokumen Word.
   - Klik chip cepat **✍️ Rapikan / Grammar** di sidebar.
   - AI akan memproses teks tersebut.
   - Klik tombol **✍️ Ganti Teks Terpilih** di bawah respon AI untuk langsung mengganti teks di Word tanpa copy-paste!

2. **Lanjutkan Penulisan:**
   - Letakkan kursor di akhir paragraf yang ingin dilanjutkan.
   - Ketik di chat: *"Lanjutkan paragraf ini dengan argumen pendukung..."*
   - Klik tombol **➕ Sisipkan di Kursor** untuk menaruh hasil teks baru langsung ke posisi kursor Anda.
