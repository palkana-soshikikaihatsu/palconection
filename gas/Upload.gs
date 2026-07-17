/**
 * 画像アップロードAPI（Google Drive保存）
 */

/**
 * 画像アップロード処理
 */
function handleUploadImage(e, token) {
  const userId = validateSession(token);
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }

  const postData = getPostData(e);
  const base64 = postData.base64 || '';
  const mimeType = postData.mimeType || 'image/jpeg';
  const fileName = postData.fileName || 'image.jpg';

  if (!base64) {
    return { success: false, error: '画像データがありません' };
  }

  // Base64サイズ制限（約1.5MB相当）
  if (base64.length > 2000000) {
    return { success: false, error: '画像が大きすぎます。別の画像を選んでください' };
  }

  try {
    const folder = getUploadFolder();
    const bytes = Utilities.base64Decode(base64);
    const blob = Utilities.newBlob(bytes, mimeType, sanitizeFileName(fileName));
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const url = 'https://drive.google.com/uc?export=view&id=' + file.getId();

    return {
      success: true,
      data: {
        url: url,
        fileId: file.getId()
      }
    };
  } catch (error) {
    return { success: false, error: 'アップロードに失敗しました: ' + error.message };
  }
}

/**
 * アップロード用フォルダを取得（なければ作成）
 */
function getUploadFolder() {
  const folderId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID');

  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (e) {
      // フォルダIDが無効な場合は新規作成
    }
  }

  // 「パルコネ画像」フォルダを検索または作成
  const folders = DriveApp.getFoldersByName('パルコネ画像');
  if (folders.hasNext()) {
    const folder = folders.next();
    PropertiesService.getScriptProperties().setProperty('DRIVE_FOLDER_ID', folder.getId());
    return folder;
  }

  const folder = DriveApp.createFolder('パルコネ画像');
  PropertiesService.getScriptProperties().setProperty('DRIVE_FOLDER_ID', folder.getId());
  return folder;
}

/**
 * ファイル名のサニタイズ
 */
function sanitizeFileName(name) {
  const safe = String(name || 'image.jpg').replace(/[^\w.\-]/g, '_');
  const stamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd_HHmmss');
  const ext = safe.indexOf('.') >= 0 ? safe.split('.').pop() : 'jpg';
  return 'palcone_' + stamp + '.' + ext;
}
