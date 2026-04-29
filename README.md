# 📸 คลังรูปภาพกิจกรรม (Activity Gallery)

ระบบคลังรูปภาพกิจกรรมสำหรับหน่วยงาน สร้างด้วย Google Apps Script + GitHub Pages

---

## 🌐 Demo

🔗 [เปิดแอปพลิเคชัน](https://aod3826.github.io/App-picture/)

---

## ✨ ฟีเจอร์หลัก

- 🖼️ **แสดงรูปภาพแบบ Card Grid** — รองรับทุกขนาดหน้าจอ (Responsive)
- 📤 **อัปโหลดรูปภาพ** — เลือกจากแกลเลอรีหรือถ่ายภาพได้เลย
- 🔍 **กรองตามหมวดหมู่** — คลิกเพื่อแสดงเฉพาะประเภทที่ต้องการ
- 🔎 **Lightbox** — คลิกรูปเพื่อดูขนาดใหญ่พร้อมรายละเอียด
- 📱 **PWA** — Add to Home Screen ใช้งานได้เหมือนแอปจริง
- ⚡ **Offline Support** — ดูหน้าเว็บได้แม้ไม่มีอินเทอร์เน็ต

---

## 🏗️ โครงสร้างระบบ

```
Frontend (GitHub Pages)          Backend (Google Apps Script)
┌─────────────────────┐          ┌──────────────────────────┐
│  index.html         │──fetch──▶│  Code.gs                 │
│  manifest.json      │          │  - doGet()  → HTML/JSON  │
│  sw.js              │          │  - doPost() → อัปโหลด    │
│  icons/             │          │                          │
└─────────────────────┘          └──────────┬───────────────┘
                                            │
                              ┌─────────────▼──────────────┐
                              │  Google Drive               │
                              │  (เก็บรูปภาพ)              │
                              └─────────────┬──────────────┘
                                            │
                              ┌─────────────▼──────────────┐
                              │  Google Sheets              │
                              │  (เก็บข้อมูล Gallery)      │
                              └────────────────────────────┘
```

---

## 📁 โครงสร้างไฟล์

```
App-picture/
├── index.html          → หน้าเว็บหลัก (Frontend + PWA)
├── manifest.json       → ข้อมูล PWA (ชื่อแอป, ไอคอน, สี)
├── sw.js               → Service Worker (Offline support)
├── README.md           → ไฟล์นี้
└── icons/
    ├── icon-72x72.png
    ├── icon-96x96.png
    ├── icon-128x128.png
    ├── icon-144x144.png
    ├── icon-152x152.png
    ├── icon-192x192.png
    ├── icon-384x384.png
    ├── icon-512x512.png
    └── apple-touch-icon.png
```

---

## 🛠️ เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | HTML5, Tailwind CSS, JavaScript |
| Font | Google Fonts (Kanit) |
| Backend | Google Apps Script |
| ฐานข้อมูล | Google Sheets |
| เก็บรูปภาพ | Google Drive |
| Hosting | GitHub Pages |
| PWA | Web App Manifest + Service Worker |

---

## ⚙️ โครงสร้างข้อมูล Google Sheet

ชีตชื่อ **Gallery** มีคอลัมน์ดังนี้:

| คอลัมน์ | ประเภท | ตัวอย่าง |
|---|---|---|
| Date | Date | 29/04/2568 |
| Title | Text | กิจกรรมวันสงกรานต์ |
| Description | Text | รายละเอียดกิจกรรม... |
| Category | Text | งานประเพณี |
| ImageURL | URL | https://drive.google.com/... |
| Status | Text | แสดง / ซ่อน |

> แถวที่มี Status = `ซ่อน` จะไม่แสดงในหน้าเว็บ

---

## 🚀 วิธีติดตั้ง

### ขั้นที่ 1 — ตั้งค่า Google Apps Script

1. เปิด [Google Sheets](https://sheets.google.com) → สร้าง Spreadsheet ใหม่
2. **Extensions → Apps Script**
3. วางโค้ดจาก `Code.gs` แทนโค้ดเดิม
4. สร้างไฟล์ใหม่ชื่อ `Index` (HTML file) → วางโค้ดจาก `Index.html`
5. รันฟังก์ชัน `requestAllPermissions` เพื่อขอสิทธิ์ทั้งหมด
6. **Deploy → New Deployment → Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. คัดลอก **Web App URL**

### ขั้นที่ 2 — ตั้งค่า GitHub Pages

1. Fork หรือ Clone repo นี้
2. แก้ `SCRIPT_URL` ใน `index.html` บรรทัดนี้:
   ```javascript
   const SCRIPT_URL = 'YOUR_WEB_APP_URL_HERE';
   ```
3. **Settings → Pages → Source: main branch → Save**
4. รอ 2-3 นาที → เปิด URL ที่ได้รับ

### ขั้นที่ 3 — Add to Home Screen

**Android:** เปิด Chrome → เมนู 3 จุด → ติดตั้งแอป

**iOS:** เปิด Safari → Share → Add to Home Screen

---

## 📋 Google Apps Script Functions

| ฟังก์ชัน | หน้าที่ |
|---|---|
| `doGet()` | แสดงหน้าเว็บ หรือส่ง JSON ข้อมูล |
| `doPost()` | รับการอัปโหลดรูปภาพ |
| `uploadImage()` | บันทึกรูปลง Drive + Sheet |
| `getGalleryData()` | ดึงข้อมูลจาก Sheet |
| `convertDriveLink()` | แปลง Share Link → Thumbnail URL |
| `requestAllPermissions()` | ตรวจสอบและขอสิทธิ์ทั้งหมด |
| `setupSheet()` | สร้างแผ่นงานตัวอย่าง |

---

## 👨‍💻 พัฒนาด้วย

- [Google Apps Script](https://script.google.com)
- [Tailwind CSS](https://tailwindcss.com)
- [GitHub Pages](https://pages.github.com)

---

*อัปเดตล่าสุด: 2568*
