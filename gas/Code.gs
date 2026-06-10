/**
 * パルコネ SNS バックエンド
 * Google Apps Script Web App
 */

// スプレッドシートID（デプロイ時に設定）
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '';

// CORS設定（GitHub Pages URL）
const ALLOWED_ORIGIN = PropertiesService.getScriptProperties().getProperty('ALLOWED_ORIGIN') || '*';

// キャッシュ時間（秒）
const CACHE_TTL = 21600; // 6時間

// ページサイズ
const PAGE_SIZE = 20;

/**
 * GETリクエスト処理
 */
function doGet(e) {
  return handleRequest(e, 'GET');
}

/**
 * POSTリクエスト処理
 */
function doPost(e) {
  return handleRequest(e, 'POST');
}

/**
 * リクエストハンドラー
 */
function handleRequest(e, method) {
  const action = e.parameter.action || '';
  const token = e.parameter.token || '';
  
  let result;
  
  try {
    // アクションルーティング
    switch (action) {
      // 認証
      case 'login':
        result = handleLogin(e);
        break;
      case 'logout':
        result = handleLogout(token);
        break;
      case 'checkSession':
        result = handleCheckSession(token);
        break;
      
      // 投稿
      case 'getPosts':
        result = handleGetPosts(e, token);
        break;
      case 'createPost':
        result = handleCreatePost(e, token);
        break;
      case 'likePost':
        result = handleLikePost(e, token);
        break;
      case 'unlikePost':
        result = handleUnlikePost(e, token);
        break;
      
      // コミュニティ
      case 'getCommunities':
        result = handleGetCommunities(token);
        break;
      case 'getCommunityPosts':
        result = handleGetCommunityPosts(e, token);
        break;
      case 'createCommunityPost':
        result = handleCreateCommunityPost(e, token);
        break;
      case 'joinCommunity':
        result = handleJoinCommunity(e, token);
        break;
      case 'leaveCommunity':
        result = handleLeaveCommunity(e, token);
        break;
      
      // ユーザー
      case 'getProfile':
        result = handleGetProfile(e, token);
        break;
      case 'updateProfile':
        result = handleUpdateProfile(e, token);
        break;
      case 'getMembers':
        result = handleGetMembers(e, token);
        break;
      
      // 管理者
      case 'registerUser':
        result = handleRegisterUser(e, token);
        break;
      
      default:
        result = { success: false, error: 'Unknown action' };
    }
  } catch (error) {
    result = { success: false, error: error.message };
  }
  
  return createJsonResponse(result);
}

/**
 * JSONレスポンス作成
 */
function createJsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * スプレッドシート取得
 */
function getSpreadsheet() {
  if (!SPREADSHEET_ID) {
    throw new Error('SPREADSHEET_ID is not configured');
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * シート取得
 */
function getSheet(name) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  
  // シートがなければ作成
  if (!sheet) {
    sheet = ss.insertSheet(name);
    initializeSheet(sheet, name);
  }
  
  return sheet;
}

/**
 * シート初期化（ヘッダー設定）
 */
function initializeSheet(sheet, name) {
  const headers = {
    'Users': ['userId', 'email', 'passwordHash', 'displayName', 'profileImage', 'bio', 'department', 'createdAt', 'isActive', 'isAdmin'],
    'Posts': ['postId', 'userId', 'content', 'imageUrl', 'createdAt'],
    'PostLikes': ['postId', 'userId', 'createdAt'],
    'Communities': ['communityId', 'name', 'description', 'createdBy', 'createdAt'],
    'CommunityMembers': ['communityId', 'userId', 'joinedAt'],
    'CommunityPosts': ['postId', 'communityId', 'userId', 'content', 'createdAt'],
    'Sessions': ['sessionToken', 'userId', 'expiresAt']
  };
  
  if (headers[name]) {
    sheet.getRange(1, 1, 1, headers[name].length).setValues([headers[name]]);
  }
}

/**
 * UUID生成
 */
function generateUUID() {
  return Utilities.getUuid();
}

/**
 * セッショントークン生成
 */
function generateSessionToken() {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return Utilities.base64Encode(bytes);
}

/**
 * パスワードハッシュ化
 */
function hashPassword(password) {
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return hash.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

/**
 * セッション検証
 */
function validateSession(token) {
  if (!token) return null;
  
  const sheet = getSheet('Sessions');
  const data = sheet.getDataRange().getValues();
  const now = new Date();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      const expiresAt = new Date(data[i][2]);
      if (expiresAt > now) {
        return data[i][1]; // userId
      } else {
        // 期限切れセッション削除
        sheet.deleteRow(i + 1);
        return null;
      }
    }
  }
  
  return null;
}

/**
 * ユーザー取得
 */
function getUserById(userId) {
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      return {
        userId: data[i][0],
        email: data[i][1],
        displayName: data[i][3],
        profileImage: data[i][4],
        bio: data[i][5],
        department: data[i][6],
        createdAt: data[i][7],
        isActive: data[i][8],
        isAdmin: data[i][9]
      };
    }
  }
  
  return null;
}

/**
 * POSTデータ取得
 */
function getPostData(e) {
  try {
    if (e.postData && e.postData.contents) {
      return JSON.parse(e.postData.contents);
    }
  } catch (error) {
    // パース失敗
  }
  return {};
}
