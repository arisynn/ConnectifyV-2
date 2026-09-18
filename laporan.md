# Laporan Audit Sistem PWA - Connectify

## 1. Analisis Kendala Instalasi (Event `beforeinstallprompt`)

### Akar Masalah: Resolusi Ikon Tidak Memenuhi Syarat Chrome
Berdasarkan spesifikasi yang Anda sebutkan, logo yang digunakan berukuran **256x256**. Inilah alasan utama mengapa Google Chrome **menolak** menampilkan prompt instalasi dan event `beforeinstallprompt` tidak pernah terbaca. 

Menurut standar *Installability Criteria* dari Chromium (Google Chrome, Edge, dll), sebuah PWA **DIWAJIBKAN** memiliki minimal dua ukuran ikon di dalam `manifest.json`:
1. **192x192 px**
2. **512x512 px**

Sebuah ikon berukuran 256x256 tidak dianggap valid sebagai pengganti kedua ukuran absolut tersebut. Akibatnya, PWA dianggap tidak memenuhi syarat (*not installable*).

---

## 2. Solusi & Konfigurasi File

### A. Perbaikan `manifest.json` (Force Fullscreen & Perbaikan Ikon)

Untuk membuat PWA menjadi *fullscreen* tanpa gangguan UI browser (termasuk menghilangkan *toast* keluar dari layar penuh yang biasa muncul di *standalone* mode pada beberapa versi OS), `display: "fullscreen"` adalah properti yang tepat. 

Anda perlu mengubah ukuran gambar `connectify_logo.png` menggunakan *image editor* menjadi dua versi eksak (192x192 dan 512x512), lalu simpan di folder publik (misalnya `/icons/`). Berikut adalah `manifest.json` yang paling tepat:

```json
{
  "id": "/connectify",
  "name": "Connectify",
  "short_name": "Connectify",
  "description": "Connectify - Puzzle Game",
  "start_url": "/",
  "scope": "/",
  "display": "fullscreen",
  "orientation": "portrait",
  "background_color": "#FFC5D3",
  "theme_color": "#FF6B8A",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192-maskable.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```
*(Catatan: Varian `maskable` wajib ditambahkan agar ikon tidak terpotong di perangkat Android).*

### B. Service Worker Sederhana (`sw.js`)

Chrome mensyaratkan Service Worker (dengan `fetch` event handler) agar sebuah app lolos kriteria *installability*. Simpan ini di root folder publik (`public/sw.js`):

```javascript
// sw.js
const CACHE_NAME = 'connectify-static-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Langsung aktifkan SW baru
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); // Langsung handle client
});

self.addEventListener('fetch', (event) => {
  // Syarat minimal lolos Chrome Installability: Harus ada fetch handler.
  // Strategi Network-First fallback ke Cache.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
```

### C. Registrasi dan Logika PWA Guard (JavaScript)

Letakkan script ini di `index.html` (bagian `<head>`) **sedini mungkin** untuk menangkap event dari OS sebelum komponen React di-*render*. Jika menunggu komponen UI termuat, event `beforeinstallprompt` seringkali sudah lewat.

**1. Di dalam `<head>` `index.html`:**
```html
<script>
  // 1. Simpan event instalasi dari Chrome sedini mungkin
  window.deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // Cegah prompt bawaan muncul otomatis
    window.deferredPrompt = e;
    
    // (Opsional) Beritahu UI React bahwa PWA siap diinstal
    window.dispatchEvent(new Event('pwa-prompt-ready'));
  });

  // 2. Registrasi Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js');
    });
  }
</script>
```

**2. Di dalam Logika Komponen UI Anda (React/Vanilla JS):**
```javascript
const handleInstallClick = async () => {
  // Cek apakah prompt dari OS sudah ditangkap
  if (window.deferredPrompt) {
    // Munculkan popup instalasi native
    window.deferredPrompt.prompt();
    
    // Tunggu persetujuan/penolakan pengguna
    const { outcome } = await window.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA berhasil di-install!');
      // Jangan tampilkan PWA Guard lagi
    }
    
    // Kosongkan prompt karena hanya bisa dipanggil satu kali
    window.deferredPrompt = null;
  } else {
    // Fallback jika belum tersedia (misal di iOS atau jika syarat manifest tidak terpenuhi)
    alert("Install prompt belum tersedia. Pastikan menggunakan Chrome/Safari dan gunakan fitur 'Tambahkan ke Layar Utama'.");
  }
};
```

---

## 3. Catatan Tambahan Terkait Environment AI Studio
Jika Anda mencoba fitur instalasi ini langsung dari panel editor Google AI Studio, **Chrome akan memblokir fitur instalasi (`beforeinstallprompt` tidak akan muncul)**. 
Hal ini disebabkan *preview* AI Studio berjalan di dalam `<iframe>` keamanan. Agar kode instalasi native berfungsi sempurna, **Anda wajib membuka Shared URL aplikasi Anda di Tab/Jendela browser baru** (bukan di dalam iframe editor).
