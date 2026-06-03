
🔗 [เปิดแอปพลิเคชัน](https://aod3826.github.io/App-picture/)

---

# 📸 คู่มือการติดตั้งระบบคลังรูปภาพกิจกรรม
**Gallery System — Google Apps Script + GitHub Pages**

---

## สิ่งที่ต้องมีก่อนเริ่ม

| รายการ | รายละเอียด |
|--------|-----------|
| Google Account | บัญชีที่เชื่อมกับ Google Drive และ Google Sheets |
| GitHub Account | สำหรับ Deploy หน้าเว็บ (ฟรี) |
| Browser | Chrome หรือ Edge รุ่นล่าสุด |

---

## ขั้นตอนที่ 1 — ตั้งค่า Google Sheets & Apps Script

### 1.1 สร้าง Google Sheet
1. ไปที่ [sheets.google.com](https://sheets.google.com) → **+ สร้างชีตใหม่**
2. ตั้งชื่อไฟล์ (เช่น `ระบบคลังรูปภาพ`)
3. **ยังไม่ต้องสร้าง Sheet ชื่อ Gallery** — จะใช้ฟังก์ชันสร้างให้อัตโนมัติ

### 1.2 เปิด Apps Script Editor
1. ในไฟล์ Google Sheet → เมนู **Extensions** → **Apps Script**
2. ลบโค้ดเดิมทั้งหมดออก
3. **คัดลอกโค้ดทั้งหมดจากไฟล์ `Code.gs`** แล้ววางลงในช่อง Editor
4. คลิก **Save** (💾) หรือ `Ctrl + S`
5. ตั้งชื่อ Project (เช่น `Gallery Backend`)

### 1.3 รันฟังก์ชัน Setup ครั้งแรก
1. ที่ dropdown เลือก Function → เลือก **`setupGallerySheet`**
2. คลิกปุ่ม **▶ Run**
3. ครั้งแรกจะมีหน้าต่างขอสิทธิ์ → คลิก **Review Permissions**
4. เลือก Google Account ของคุณ → **Advanced** → **Go to (App Name)** → **Allow**
5. รอสักครู่ → จะเห็นข้อความ "Execution completed" ใน Log
6. **กลับไปที่ Google Sheet** → จะเห็น Sheet ชื่อ `Gallery` พร้อมข้อมูลตัวอย่าง ✅

---

## ขั้นตอนที่ 2 — Deploy Web App (Google Apps Script)

### 2.1 สร้าง Deployment
1. ใน Apps Script Editor → คลิก **Deploy** (ปุ่มสีน้ำเงินขวาบน)
2. เลือก **New Deployment**
3. คลิกไอคอนฟันเฟือง ⚙️ → เลือก **Web App**
4. กรอกข้อมูล:
   - **Description**: `Gallery v1.0`
   - **Execute as**: `Me` (บัญชีของคุณ)
   - **Who has access**: `Anyone` ← **สำคัญมาก!**
5. คลิก **Deploy**
6. **คัดลอก Web App URL** ที่ขึ้นต้นด้วย `https://script.google.com/macros/s/...` เก็บไว้

> ⚠️ **ข้อควรระวัง**: ถ้าแก้ไขโค้ด `Code.gs` ภายหลัง ต้อง Deploy ใหม่ทุกครั้ง
> (Deploy → Manage Deployments → แก้ไข → เปลี่ยน Version → Deploy)

---

## ขั้นตอนที่ 3 — ตั้งค่า Frontend (index.html)

### 3.1 แก้ไข URL ใน index.html
เปิดไฟล์ `index.html` และหาบรรทัดนี้:

```javascript
const GAS_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
```

แทนที่ด้วย URL จากขั้นตอน 2.1:

```javascript
const GAS_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
```

---

## ขั้นตอนที่ 4 — Deploy บน GitHub Pages

### 4.1 สร้าง Repository ใหม่
1. ไปที่ [github.com](https://github.com) → **New Repository**
2. ตั้งชื่อ Repository (เช่น `gallery-activity`)
3. เลือก **Public**
4. ติ๊ก **Add a README file**
5. คลิก **Create repository**

### 4.2 อัปโหลดไฟล์
1. ในหน้า Repository → คลิก **Add file** → **Upload files**
2. ลาก `index.html` ไปวาง (ชื่อต้องเป็น `index.html` เท่านั้น!)
3. เขียน Commit message (เช่น `Add gallery page`)
4. คลิก **Commit changes**

### 4.3 เปิดใช้งาน GitHub Pages
1. ไปที่ **Settings** (แถบด้านบนของ Repository)
2. เลื่อนลงหา **Pages** ในแถบซ้าย
3. ที่ **Source** → เลือก **Deploy from a branch**
4. **Branch**: เลือก `main` → Folder: `/ (root)`
5. คลิก **Save**
6. รอ 1-3 นาที → URL ของเว็บจะปรากฏ เช่น:
   `https://yourusername.github.io/gallery-activity/`

---

## ขั้นตอนที่ 5 — เพิ่มรูปภาพเข้าระบบ

### 5.1 อัปโหลดรูปภาพขึ้น Google Drive
1. ไปที่ [drive.google.com](https://drive.google.com)
2. สร้างโฟลเดอร์ (เช่น `รูปกิจกรรม`)
3. อัปโหลดรูปภาพที่ต้องการ

### 5.2 รับลิงก์แชร์
1. คลิกขวาที่รูปภาพ → **Share** → **Get link**
2. เปลี่ยนเป็น **Anyone with the link** → คลิก **Copy link**
3. ลิงก์จะมีรูปแบบ: `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`

### 5.3 เพิ่มข้อมูลใน Google Sheet
เปิด Sheet `Gallery` แล้วเพิ่มแถวใหม่:

| คอลัมน์ | ตัวอย่าง |
|---------|---------|
| A - Date | 15/06/2568 |
| B - Title | ประชุมประจำเดือนมิถุนายน |
| C - Description | สรุปผลการดำเนินงาน พร้อมวางแผนงานไตรมาสถัดไป |
| D - Category | ประชุม |
| E - ImageURL | https://drive.google.com/file/d/ABC123/view?usp=sharing |
| F - Status | แสดง |

> 💡 **Status**: ใส่ `แสดง` เพื่อแสดงผล หรือ `ซ่อน` เพื่อซ่อน

---

## โครงสร้างไฟล์

```
your-repository/
└── index.html          ← หน้าเว็บหลัก (อัปโหลดไฟล์นี้ไปที่ GitHub)

Google Apps Script:
└── Code.gs             ← Backend (อยู่ใน Apps Script Editor)

Google Sheet:
└── Gallery             ← ตารางข้อมูล (สร้างโดยฟังก์ชัน setupGallerySheet)
```

---

## การแก้ไขปัญหาที่พบบ่อย

### ❌ รูปภาพไม่แสดง
- ตรวจสอบว่า Google Drive ตั้งค่า **Anyone with the link can view** แล้ว
- ลอง Copy ลิงก์ใหม่จาก Drive แล้วใส่อีกครั้ง

### ❌ ข้อมูลไม่โหลด / CORS Error
- ตรวจสอบ `GAS_URL` ใน `index.html` ว่าถูกต้อง
- ต้อง Deploy ใหม่หลังแก้ไขโค้ด `Code.gs`
- ตรวจสอบ **Who has access** ต้องเป็น `Anyone`

### ❌ ข้อมูลเก่าไม่อัปเดต
- ระบบมี Cache 5 นาที → รอสักครู่แล้วกด **รีเฟรช**
- หรือเรียก `clearCache()` ใน Apps Script → Run

### ❌ GitHub Pages ไม่แสดงผล
- ตรวจสอบชื่อไฟล์ต้องเป็น `index.html` (ตัวเล็กทั้งหมด)
- รอ 5-10 นาทีหลัง Deploy ครั้งแรก

---

## ฟีเจอร์ทั้งหมดของระบบ

| ฟีเจอร์ | รายละเอียด |
|---------|-----------|
| 🖼️ Card Grid Layout | แสดงรูปภาพแบบตาราง ปรับอัตโนมัติตามขนาดหน้าจอ |
| 🔍 ระบบค้นหา | ค้นหาจากชื่อ, รายละเอียด, หมวดหมู่ |
| 🏷️ กรองหมวดหมู่ | ปุ่มกรองอัตโนมัติจากข้อมูลใน Sheet |
| 🔍 Lightbox | คลิกรูปเพื่อดูขนาดใหญ่ + เลื่อนดูรูปถัดไปได้ |
| ⌨️ Keyboard Nav | กด ← → เพื่อเลื่อนรูป, Esc เพื่อปิด |
| 📱 Responsive | รองรับมือถือ, แท็บเล็ต, คอมพิวเตอร์ |
| 🚀 Lazy Loading | โหลดรูปเมื่อเลื่อนถึง ประหยัด Bandwidth |
| ⚡ Cache | Cache 5 นาที ลดการเรียก API ซ้ำ |
| 🇹🇭 วันที่ไทย | แปลงวันที่เป็นรูปแบบ พ.ศ. อัตโนมัติ |
| 🔗 Google Drive | แปลง Share Link → Direct URL อัตโนมัติ |

---

*สร้างโดย Google Apps Script + GitHub Pages*
