// ============================================================
//  CODE.GS — Album System (ระบบอัลบั้ม)
//  คลังรูปภาพกิจกรรม พร้อมระบบอัลบั้ม
// ============================================================

const SHEET_ALBUMS = 'Albums';    // ชีตเก็บข้อมูลอัลบั้ม
const SHEET_PHOTOS = 'Photos';    // ชีตเก็บรูปภาพ
const FOLDER_ID    = '1Uqy_rqyPrrONAq2-RdylbuCC1WBs8vKm';

// ============================================================
//  doGet — แสดงหน้าเว็บ หรือส่ง JSON
// ============================================================
function doGet(e) {
  const action = e.parameter.action;

  if (action === 'getAlbums')      return getAlbums();
  if (action === 'getPhotos')      return getPhotos(e.parameter.albumId);
  if (action === 'getAlbumDetail') return getAlbumDetail(e.parameter.albumId);

  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('คลังรูปภาพกิจกรรม')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================================
//  doPost — รับคำสั่ง: สร้างอัลบั้ม, อัปโหลดรูป
// ============================================================
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;

    if (action === 'createAlbum') return createAlbum(params);
    if (action === 'uploadPhoto')  return uploadPhoto(params);

    return buildJsonResponse({ success: false, error: 'ไม่รู้จัก action' });
  } catch (err) {
    return buildJsonResponse({ success: false, error: err.message });
  }
}

// ============================================================
//  createAlbum — สร้างอัลบั้มใหม่
//  params: { title, description, category, date }
// ============================================================
function createAlbum(params) {
  if (!params.title) {
    return buildJsonResponse({ success: false, error: 'กรุณาระบุชื่อกิจกรรม' });
  }

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName(SHEET_ALBUMS);
  if (!sheet) sheet = ss.insertSheet(SHEET_ALBUMS);

  // ถ้า Sheet ว่าง สร้าง Header
  if (sheet.getLastRow() === 0) {
    const headers = ['AlbumID', 'Date', 'Title', 'Description', 'Category', 'CoverImageURL', 'PhotoCount', 'Status', 'CreatedAt'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    const hr = sheet.getRange(1, 1, 1, headers.length);
    hr.setBackground('#1e3a5f');
    hr.setFontColor('#ffffff');
    hr.setFontWeight('bold');
    hr.setHorizontalAlignment('center');
  }

  // สร้าง AlbumID ใหม่ (timestamp)
  const albumId   = 'ALB' + Date.now();
  const dateVal   = params.date ? new Date(params.date) : new Date();
  const createdAt = new Date();

  sheet.appendRow([
    albumId,
    dateVal,
    params.title       || '',
    params.description || '',
    params.category    || '',
    '',  // CoverImageURL (จะอัปเดตทีหลังเมื่อมีรูปแรก)
    0,   // PhotoCount
    'แสดง',
    createdAt,
  ]);

  return buildJsonResponse({
    success: true,
    message: 'สร้างอัลบั้มสำเร็จ!',
    albumId: albumId,
  });
}

// ============================================================
//  uploadPhoto — อัปโหลดรูปเข้าอัลบั้ม
//  params: { albumId, fileData, fileName, mimeType, caption }
// ============================================================
function uploadPhoto(params) {
  if (!params.albumId)  return buildJsonResponse({ success: false, error: 'ไม่พบ Album ID' });
  if (!params.fileData) return buildJsonResponse({ success: false, error: 'ไม่พบไฟล์รูปภาพ' });

  // อัปโหลดไฟล์ลง Drive
  const folder  = DriveApp.getFolderById(FOLDER_ID);
  const decoded = Utilities.base64Decode(params.fileData);
  const blob    = Utilities.newBlob(decoded, params.mimeType || 'image/jpeg', params.fileName);
  const file    = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const fileId   = file.getId();
  const imageUrl = 'https://drive.google.com/file/d/' + fileId + '/view?usp=sharing';
  const thumbUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w800';

  // บันทึกลง Photos Sheet
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName(SHEET_PHOTOS);
  if (!sheet) sheet = ss.insertSheet(SHEET_PHOTOS);

  if (sheet.getLastRow() === 0) {
    const headers = ['PhotoID', 'AlbumID', 'ImageURL', 'Caption', 'UploadedAt'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    const hr = sheet.getRange(1, 1, 1, headers.length);
    hr.setBackground('#1e3a5f');
    hr.setFontColor('#ffffff');
    hr.setFontWeight('bold');
    hr.setHorizontalAlignment('center');
  }

  const photoId   = 'PHO' + Date.now();
  const uploadedAt = new Date();

  sheet.appendRow([
    photoId,
    params.albumId,
    imageUrl,
    params.caption || '',
    uploadedAt,
  ]);

  // อัปเดต PhotoCount และ CoverImage ของอัลบั้ม
  updateAlbumStats(params.albumId);

  return buildJsonResponse({
    success:  true,
    message:  'อัปโหลดรูปภาพสำเร็จ!',
    photoId:  photoId,
    imageUrl: thumbUrl,
  });
}

// ============================================================
//  updateAlbumStats — อัปเดตจำนวนรูป + รูปปก
// ============================================================
function updateAlbumStats(albumId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const albumsSheet = ss.getSheetByName(SHEET_ALBUMS);
  const photosSheet = ss.getSheetByName(SHEET_PHOTOS);

  if (!albumsSheet || !photosSheet) return;

  // นับจำนวนรูปในอัลบั้ม
  const photos = photosSheet.getDataRange().getValues();
  const photoRows = photos.slice(1).filter(function(row) { return row[1] === albumId; });
  const count = photoRows.length;

  // หารูปแรก (ใช้เป็นรูปปก)
  const coverUrl = count > 0 ? photoRows[0][2] : '';

  // อัปเดตใน Albums Sheet
  const albums = albumsSheet.getDataRange().getValues();
  for (var i = 1; i < albums.length; i++) {
    if (albums[i][0] === albumId) {
      albumsSheet.getRange(i + 1, 6).setValue(coverUrl);   // CoverImageURL
      albumsSheet.getRange(i + 1, 7).setValue(count);      // PhotoCount
      break;
    }
  }
}

// ============================================================
//  getAlbums — ดึงรายการอัลบั้มทั้งหมด
// ============================================================
function getAlbums() {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_ALBUMS);

    if (!sheet) return buildJsonResponse({ success: true, data: [] });

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return buildJsonResponse({ success: true, data: [] });

    const headers = data[0];
    const rows    = data.slice(1);

    const albums = rows
      .filter(function(row) { return row[7] !== 'ซ่อน'; }) // Status !== ซ่อน
      .map(function(row) {
        return {
          albumId:       row[0],
          date:          formatDate(row[1]),
          title:         row[2],
          description:   row[3],
          category:      row[4],
          coverImageUrl: convertDriveLink(row[5]),
          photoCount:    row[6] || 0,
          status:        row[7],
        };
      })
      .filter(function(item) { return item.title !== ''; })
      .reverse(); // ล่าสุดขึ้นก่อน

    return buildJsonResponse({ success: true, data: albums });

  } catch (err) {
    return buildJsonResponse({ success: false, error: err.message });
  }
}

// ============================================================
//  getAlbumDetail — ดึงข้อมูลอัลบั้ม 1 อัน (สำหรับหน้ารายละเอียด)
// ============================================================
function getAlbumDetail(albumId) {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_ALBUMS);

    if (!sheet || !albumId) return buildJsonResponse({ success: false, error: 'ไม่พบอัลบั้ม' });

    const data = sheet.getDataRange().getValues();
    const row  = data.slice(1).find(function(r) { return r[0] === albumId; });

    if (!row) return buildJsonResponse({ success: false, error: 'ไม่พบอัลบั้ม' });

    const album = {
      albumId:       row[0],
      date:          formatDate(row[1]),
      title:         row[2],
      description:   row[3],
      category:      row[4],
      coverImageUrl: convertDriveLink(row[5]),
      photoCount:    row[6] || 0,
      status:        row[7],
    };

    return buildJsonResponse({ success: true, data: album });

  } catch (err) {
    return buildJsonResponse({ success: false, error: err.message });
  }
}

// ============================================================
//  getPhotos — ดึงรูปภาพทั้งหมดในอัลบั้ม
// ============================================================
function getPhotos(albumId) {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_PHOTOS);

    if (!sheet || !albumId) return buildJsonResponse({ success: true, data: [] });

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return buildJsonResponse({ success: true, data: [] });

    const photos = data.slice(1)
      .filter(function(row) { return row[1] === albumId; })
      .map(function(row) {
        return {
          photoId:   row[0],
          albumId:   row[1],
          imageUrl:  convertDriveLink(row[2]),
          caption:   row[3],
          uploadedAt: formatDate(row[4]),
        };
      })
      .reverse(); // ล่าสุดขึ้นก่อน

    return buildJsonResponse({ success: true, data: photos });

  } catch (err) {
    return buildJsonResponse({ success: false, error: err.message });
  }
}

// ============================================================
//  Utilities
// ============================================================
function convertDriveLink(url) {
  if (!url) return '';
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return 'https://drive.google.com/thumbnail?id=' + match[1] + '&sz=w800';
  return url;
}

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

function buildJsonResponse(obj) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ============================================================
//  setupSheets — สร้างชีตตัวอย่าง (รันครั้งเดียว)
// ============================================================
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // สร้าง Albums Sheet
  let albumsSheet = ss.getSheetByName(SHEET_ALBUMS);
  if (!albumsSheet) albumsSheet = ss.insertSheet(SHEET_ALBUMS);
  
  const albumHeaders = ['AlbumID', 'Date', 'Title', 'Description', 'Category', 'CoverImageURL', 'PhotoCount', 'Status', 'CreatedAt'];
  albumsSheet.getRange(1, 1, 1, albumHeaders.length).setValues([albumHeaders]);
  const ahr = albumsSheet.getRange(1, 1, 1, albumHeaders.length);
  ahr.setBackground('#1e3a5f');
  ahr.setFontColor('#ffffff');
  ahr.setFontWeight('bold');
  ahr.setHorizontalAlignment('center');
  albumsSheet.autoResizeColumns(1, albumHeaders.length);
  
  // สร้าง Photos Sheet
  let photosSheet = ss.getSheetByName(SHEET_PHOTOS);
  if (!photosSheet) photosSheet = ss.insertSheet(SHEET_PHOTOS);
  
  const photoHeaders = ['PhotoID', 'AlbumID', 'ImageURL', 'Caption', 'UploadedAt'];
  photosSheet.getRange(1, 1, 1, photoHeaders.length).setValues([photoHeaders]);
  const phr = photosSheet.getRange(1, 1, 1, photoHeaders.length);
  phr.setBackground('#1e3a5f');
  phr.setFontColor('#ffffff');
  phr.setFontWeight('bold');
  phr.setHorizontalAlignment('center');
  photosSheet.autoResizeColumns(1, photoHeaders.length);
  
  SpreadsheetApp.getUi().alert('✅ สร้างชีต Albums และ Photos เรียบร้อยแล้ว!');
}

// ============================================================
//  requestAllPermissions — ตรวจสอบสิทธิ์
// ============================================================
function requestAllPermissions() {
  const results = [];
  try { SpreadsheetApp.getActiveSpreadsheet(); results.push('✅ Sheets'); } catch(e) { results.push('❌ Sheets'); }
  try { DriveApp.getFolderById(FOLDER_ID); results.push('✅ Drive'); } catch(e) { results.push('❌ Drive'); }
  try { Utilities.base64Decode('dA=='); results.push('✅ Utilities'); } catch(e) { results.push('❌ Utilities'); }
  Logger.log(results.join('\n'));
}
