**Tugas: Recreate UI Project dari Awal Menggunakan Template OpenUI**

Recreate seluruh UI project yang sedang terbuka dari awal dengan mengacu pada template, design system, komponen, dan pola desain yang tersedia di https://www.openui.com/.

### 1. Analisis Project Existing
- Periksa seluruh struktur project, source code, halaman, komponen, routing, aset, dan dependensi yang sudah ada sebelum melakukan perubahan.
- Identifikasi seluruh halaman, fitur, alur navigasi, dan interaksi yang sudah berjalan.
- Jadikan implementasi existing sebagai referensi fungsionalitas, bukan sebagai batasan desain.
- Jangan langsung mengubah kode sebelum memahami struktur dan kebutuhan project.

### 2. Gunakan OpenUI sebagai Acuan Utama
- Pelajari template dan referensi desain dari https://www.openui.com/.
- Gunakan template atau komponen OpenUI yang paling relevan dengan kebutuhan project.
- Ikuti design system secara konsisten, termasuk layout, spacing, typography, warna, border, radius, shadows, ikon, tombol, form, tabel, cards, dan elemen UI lainnya.
- Jika template menyediakan source code atau komponen yang dapat digunakan, manfaatkan secara langsung sesuai kompatibilitas stack project.
- Jangan sekadar meniru tampilannya secara kasar atau membuat desain generik yang tidak mengikuti referensi.
- Jangan mengklaim menggunakan template atau komponen OpenUI secara langsung jika implementasinya hanya dibuat ulang secara manual.

### 3. Rebuild UI Secara Menyeluruh
- Bangun ulang seluruh halaman dan komponen UI dari awal berdasarkan desain yang telah ditentukan.
- Terapkan desain yang konsisten pada semua halaman, termasuk dashboard, halaman detail, formulir, navigasi, modal, dropdown, tabel, dan halaman pendukung yang memang ada di project.
- Pastikan semua halaman memiliki hierarki visual yang jelas, layout rapi, serta pengalaman pengguna yang konsisten.
- Hindari mempertahankan UI lama hanya dengan mengganti warna, font, atau beberapa komponen.
- Gunakan komponen reusable agar implementasi mudah dipelihara dan tidak memiliki duplikasi yang tidak perlu.

### 4. Pertahankan Fungsionalitas Existing
- Pertahankan fitur, business logic, API integration, autentikasi, routing, state management, dan alur kerja yang sudah ada.
- Pisahkan perubahan UI dari logic aplikasi sebisa mungkin.
- Jangan menghapus fitur atau mengganti implementasi backend hanya demi mempermudah redesign.
- Pastikan semua tombol, form, navigasi, filter, pencarian, modal, dan interaksi lainnya tetap berfungsi.
- Jika menemukan bug atau dependensi yang tidak kompatibel, identifikasi penyebabnya sebelum memperbaiki.

### 5. Responsiveness dan Accessibility
- Pastikan UI responsif pada desktop, tablet, dan mobile.
- Gunakan layout adaptif, bukan sekadar mengecilkan ukuran elemen desktop.
- Pastikan navigasi mobile, form, tabel, dialog, dan komponen interaktif tetap nyaman digunakan.
- Perhatikan kontras warna, fokus keyboard, label form, semantic elements, dan aksesibilitas dasar.

### 6. Implementasi dan Quality Control
- Ikuti stack, framework, struktur project, dan konvensi coding yang sudah digunakan, kecuali ada alasan teknis yang jelas untuk mengubahnya.
- Jangan mengganti framework atau menginisialisasi project baru tanpa kebutuhan yang kuat.
- Jangan membuat halaman atau data dummy sebagai pengganti fitur existing yang sebenarnya sudah terhubung.
- Setelah implementasi, jalankan build dan pemeriksaan yang tersedia.
- Perbaiki error, broken imports, masalah routing, layout overflow, serta komponen yang tidak berfungsi.
- Periksa kembali setiap halaman untuk memastikan desain konsisten dan tidak ada halaman yang tertinggal menggunakan UI lama.

### 7. Urutan Pengerjaan
Kerjakan secara bertahap:
1. Audit project existing dan identifikasi seluruh halaman serta fitur.
2. Analisis template OpenUI yang relevan dan tentukan pendekatan implementasinya.
3. Susun mapping halaman existing ke desain dan komponen baru.
4. Bangun design system dan komponen dasar.
5. Rebuild seluruh halaman dan integrasikan kembali dengan logic existing.
6. Implementasikan responsive layout dan seluruh interaksi.
7. Jalankan build, testing, dan perbaiki masalah yang ditemukan.
8. Berikan ringkasan hasil implementasi, file utama yang diubah, fitur yang tetap dipertahankan, serta kendala yang belum terselesaikan.

**Kriteria keberhasilan:** seluruh UI project berhasil dibangun ulang dengan desain yang konsisten berdasarkan template OpenUI, seluruh halaman tercakup, fungsionalitas existing tetap berjalan, dan project dapat dijalankan tanpa error build yang belum terselesaikan.

Mulai dengan mengaudit project dan mempelajari referensi OpenUI. Setelah itu, langsung implementasikan perubahan pada source code project yang ada. Jangan berhenti pada analisis, mockup, rekomendasi, atau rencana pengerjaan saja.