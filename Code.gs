// ============================================================
//  CODE.GS — Google Apps Script Backend
//  ระบบคลังรูปภาพกิจกรรม (พร้อมระบบอัปโหลด)
// ============================================================

const SHEET_NAME   = 'Gallery';
const FOLDER_ID    = '1Uqy_rqyPrrONAq2-RdylbuCC1WBs8vKm'; // โฟลเดอร์ Google Drive

// ============================================================
//  doGet — แสดงหน้าเว็บ HTML หรือส่ง JSON
// ============================================================
function doGet(e) {
  const action = e.parameter.action;

  if (action === 'getGallery') return getGalleryData();

  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('คลังรูปภาพกิจกรรม')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================================
//  doPost — รับข้อมูลอัปโหลดรูปภาพ
// ============================================================
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;

    if (action === 'uploadImage') return uploadImage(params);

    return buildJsonResponse({ success: false, error: 'ไม่รู้จัก action นี้' });
  } catch (err) {
    return buildJsonResponse({ success: false, error: err.message });
  }
}

// ============================================================
//  uploadImage — บันทึกรูปลง Drive และบันทึกข้อมูลลง Sheet
//  params: { title, description, category, date, fileData, fileName, mimeType }
// ============================================================
function uploadImage(params) {
  if (!params.fileData || !params.fileName) {
    return buildJsonResponse({ success: false, error: 'ไม่พบไฟล์รูปภาพ' });
  }
  if (!params.title) {
    return buildJsonResponse({ success: false, error: 'กรุณาระบุชื่อกิจกรรม' });
  }

  // อัปโหลดไฟล์ไปยัง Google Drive
  const folder  = DriveApp.getFolderById(FOLDER_ID);
  const decoded = Utilities.base64Decode(params.fileData);
  const blob    = Utilities.newBlob(decoded, params.mimeType || 'image/jpeg', params.fileName);
  const file    = folder.createFile(blob);

  // ตั้งสิทธิ์เป็น "ทุกคนที่มีลิงก์ดูได้"
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const fileId   = file.getId();
  const imageUrl = 'https://drive.google.com/file/d/' + fileId + '/view?usp=sharing';
  const thumbUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w800';

  // บันทึกลง Google Sheet
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  // ถ้า Sheet ว่าง สร้าง Header ก่อน
  if (sheet.getLastRow() === 0) {
    const headers = ['Date', 'Title', 'Description', 'Category', 'ImageURL', 'Status'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    const hr = sheet.getRange(1, 1, 1, headers.length);
    hr.setBackground('#1e3a5f');
    hr.setFontColor('#ffffff');
    hr.setFontWeight('bold');
    hr.setHorizontalAlignment('center');
  }

  const dateVal = params.date ? new Date(params.date) : new Date();

  sheet.appendRow([
    dateVal,
    params.title       || '',
    params.description || '',
    params.category    || '',
    imageUrl,
    'แสดง',
  ]);

  return buildJsonResponse({
    success:  true,
    message:  'อัปโหลดสำเร็จ!',
    fileId:   fileId,
    imageUrl: thumbUrl,
  });
}

// ============================================================
//  getGalleryData — ดึงข้อมูลจาก Sheet ส่งเป็น JSON
// ============================================================
function getGalleryData() {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) return buildJsonResponse({ success: true, data: [] });

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return buildJsonResponse({ success: true, data: [] });

    const headers  = data[0].map(function(h){ return h.toString().trim(); });
    const rows     = data.slice(1);
    const colIndex = {
      date:        headers.indexOf('Date'),
      title:       headers.indexOf('Title'),
      description: headers.indexOf('Description'),
      category:    headers.indexOf('Category'),
      imageUrl:    headers.indexOf('ImageURL'),
      status:      headers.indexOf('Status'),
    };

    const gallery = rows
      .filter(function(row) {
        const status = colIndex.status >= 0 ? row[colIndex.status].toString().trim() : '';
        return status !== 'ซ่อน';
      })
      .map(function(row, idx) {
        return {
          id:          idx + 1,
          date:        formatDate(colIndex.date >= 0 ? row[colIndex.date] : ''),
          title:       colIndex.title       >= 0 ? row[colIndex.title].toString()       : '',
          description: colIndex.description >= 0 ? row[colIndex.description].toString() : '',
          category:    colIndex.category    >= 0 ? row[colIndex.category].toString()    : '',
          imageUrl:    colIndex.imageUrl    >= 0 ? convertDriveLink(row[colIndex.imageUrl].toString()) : '',
          status:      colIndex.status      >= 0 ? row[colIndex.status].toString()      : '',
        };
      })
      .filter(function(item){ return item.title !== ''; })
      .reverse(); // ล่าสุดขึ้นก่อนเสมอ

    return buildJsonResponse({ success: true, data: gallery });

  } catch (err) {
    return buildJsonResponse({ success: false, error: err.message });
  }
}

// ============================================================
//  convertDriveLink
// ============================================================
function convertDriveLink(url) {
  if (!url) return '';
  const matchFile = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile) return 'https://drive.google.com/thumbnail?id=' + matchFile[1] + '&sz=w800';
  const matchOpen = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchOpen) return 'https://drive.google.com/thumbnail?id=' + matchOpen[1] + '&sz=w800';
  return url;
}

// ============================================================
//  formatDate — DD/MM/YYYY พ.ศ.
// ============================================================
function formatDate(value) {
  if (!value) return '';
  if (value instanceof Date) {
    const d = value.getDate().toString().padStart(2, '0');
    const m = (value.getMonth() + 1).toString().padStart(2, '0');
    const y = value.getFullYear() + 543;
    return d + '/' + m + '/' + y;
  }
  return value.toString();
}

// ============================================================
//  buildJsonResponse
// ============================================================
function buildJsonResponse(obj) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ============================================================
//  setupSheet — รันครั้งเดียวเพื่อสร้างแผ่นงาน
// ============================================================
function setupSheet() {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  let sheet  = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  const headers = ['Date', 'Title', 'Description', 'Category', 'ImageURL', 'Status'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const hr = sheet.getRange(1, 1, 1, headers.length);
  hr.setBackground('#1e3a5f');
  hr.setFontColor('#ffffff');
  hr.setFontWeight('bold');
  hr.setHorizontalAlignment('center');
  sheet.autoResizeColumns(1, headers.length);

  SpreadsheetApp.getUi().alert('✅ สร้างแผ่นงาน Gallery เรียบร้อยแล้ว!');
}

// ============================================================
//  🔐 requestAllPermissions
//  ► รันใน Apps Script Editor: เลือก function นี้ แล้วกด ▶ Run
//  ► Google จะแสดงหน้าต่างขอสิทธิ์ → กด Allow
//  ► ดูผลได้ที่ View → Logs (Ctrl+Enter)
// ============================================================
function requestAllPermissions() {
  const results = [];

  // 1) Google Sheets
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    sheet.getRange(1, 1).getValue();
    results.push('✅ Google Sheets — OK');
  } catch (e) {
    results.push('❌ Google Sheets — ' + e.message);
  }

  // 2) Google Drive อ่านโฟลเดอร์
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    results.push('✅ Google Drive อ่านโฟลเดอร์ "' + folder.getName() + '" — OK');
  } catch (e) {
    results.push('❌ Google Drive อ่านโฟลเดอร์ — ' + e.message);
  }

  // 3) สร้างไฟล์ทดสอบใน Drive แล้วลบทันที
  try {
    const folder  = DriveApp.getFolderById(FOLDER_ID);
    const tmpBlob = Utilities.newBlob('test', 'text/plain', '__perm_test__.txt');
    const tmpFile = folder.createFile(tmpBlob);
    tmpFile.setTrashed(true);
    results.push('✅ สร้าง/ลบไฟล์ใน Drive — OK');
  } catch (e) {
    results.push('❌ สร้างไฟล์ใน Drive — ' + e.message);
  }

  // 4) ตั้งค่าการแชร์
  try {
    const folder  = DriveApp.getFolderById(FOLDER_ID);
    const tmpBlob = Utilities.newBlob('x', 'text/plain', '__share_test__.txt');
    const tmpFile = folder.createFile(tmpBlob);
    tmpFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    tmpFile.setTrashed(true);
    results.push('✅ ตั้งค่าสิทธิ์แชร์ไฟล์ — OK');
  } catch (e) {
    results.push('❌ ตั้งค่าสิทธิ์แชร์ไฟล์ — ' + e.message);
  }

  // 5) Utilities Base64
  try {
    Utilities.base64Decode('dGVzdA==');
    results.push('✅ Utilities Base64 — OK');
  } catch (e) {
    results.push('❌ Utilities Base64 — ' + e.message);
  }

  // 6) ContentService
  try {
    ContentService.createTextOutput('{}').setMimeType(ContentService.MimeType.JSON);
    results.push('✅ ContentService JSON — OK');
  } catch (e) {
    results.push('❌ ContentService — ' + e.message);
  }

  // แสดงผลใน Logger (View → Logs)
  const allPass = results.every(function(r){ return r.startsWith('✅'); });
  Logger.log('=== ผลการตรวจสอบสิทธิ์ ===');
  results.forEach(function(r){ Logger.log(r); });
  Logger.log(allPass
    ? '\n🎉 สิทธิ์ทุกรายการพร้อมใช้งาน! พร้อม Deploy ได้เลย'
    : '\n⚠️ บางสิทธิ์ยังมีปัญหา ดูรายละเอียดด้านบน'
  );

  // ถ้าเรียกจาก Spreadsheet UI ได้ ให้แสดง alert ด้วย
  try {
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      allPass ? '✅ สิทธิ์ครบทุกรายการ' : '⚠️ บางสิทธิ์มีปัญหา',
      results.join('\n') + '\n\n' + (allPass ? '🎉 พร้อม Deploy!' : 'ดู Logs เพิ่มเติม'),
      ui.ButtonSet.OK
    );
  } catch(uiErr) {
    // รันจาก Editor โดยตรง → ดูผลที่ View → Logs แทน
    Logger.log('(เปิด View → Logs เพื่อดูผลทั้งหมด)');
  }
}

// ============================================================
//  🔄 forceReauthorize
//  ► ใช้เมื่อ Deploy แล้วไม่มีหน้าต่างขอสิทธิ์
//  ► รันฟังก์ชันนี้ใน Editor → ดูผลที่ View → Logs
// ============================================================
function forceReauthorize() {
  Logger.log('=== บังคับ Re-authorize ===');

  try { SpreadsheetApp.getActiveSpreadsheet(); Logger.log('✅ Sheets scope — loaded'); } catch(e) { Logger.log('❌ Sheets — ' + e.message); }
  try { DriveApp.getRootFolder();              Logger.log('✅ Drive scope — loaded');  } catch(e) { Logger.log('❌ Drive — ' + e.message); }
  try { Utilities.base64Decode('dA==');        Logger.log('✅ Utilities scope — loaded'); } catch(e) { Logger.log('❌ Utilities — ' + e.message); }
  try { ContentService.createTextOutput('');   Logger.log('✅ ContentService scope — loaded'); } catch(e) { Logger.log('❌ ContentService — ' + e.message); }

  Logger.log('\n✅ เรียก scope ทั้งหมดเสร็จแล้ว');
  Logger.log('ขั้นตอนถัดไป:');
  Logger.log('1. ไปที่ Deploy → Manage Deployments');
  Logger.log('2. Edit → New Version → Deploy');
  Logger.log('3. กด "Allow" ในหน้าต่างขอสิทธิ์');

  try {
    const ui = SpreadsheetApp.getUi();
    ui.alert('🔄 Re-authorize เสร็จแล้ว',
      'ขั้นตอนถัดไป:\n1. Deploy → Manage Deployments\n2. Edit → New Version → Deploy\n3. กด Allow',
      ui.ButtonSet.OK);
  } catch(e) {
    Logger.log('(เปิด View → Logs เพื่อดูผล)');
  }
}
