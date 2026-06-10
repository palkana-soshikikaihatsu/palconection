/**
 * 認証関連API
 */

/**
 * ログイン処理
 */
function handleLogin(e) {
  const postData = getPostData(e);
  const email = postData.email || '';
  const password = postData.password || '';
  
  if (!email || !password) {
    return { success: false, error: 'メールアドレスとパスワードを入力してください' };
  }
  
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  const passwordHash = hashPassword(password);
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email && data[i][2] === passwordHash) {
      // アクティブチェック
      if (data[i][8] !== true && data[i][8] !== 'TRUE') {
        return { success: false, error: 'アカウントが無効です' };
      }
      
      const userId = data[i][0];
      const token = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24時間有効
      
      // セッション保存
      const sessionSheet = getSheet('Sessions');
      sessionSheet.appendRow([token, userId, expiresAt.toISOString()]);
      
      const user = getUserById(userId);
      
      return {
        success: true,
        data: {
          token: token,
          userId: userId,
          user: user
        }
      };
    }
  }
  
  return { success: false, error: 'メールアドレスまたはパスワードが正しくありません' };
}

/**
 * ログアウト処理
 */
function handleLogout(token) {
  if (!token) {
    return { success: true };
  }
  
  const sheet = getSheet('Sessions');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  
  return { success: true };
}

/**
 * セッション確認
 */
function handleCheckSession(token) {
  const userId = validateSession(token);
  
  if (!userId) {
    return { success: false, error: 'Invalid session' };
  }
  
  const user = getUserById(userId);
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  return {
    success: true,
    data: {
      token: token,
      userId: userId,
      user: user
    }
  };
}

/**
 * ユーザー登録（管理者のみ）
 */
function handleRegisterUser(e, token) {
  const adminUserId = validateSession(token);
  if (!adminUserId) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const adminUser = getUserById(adminUserId);
  if (!adminUser || !adminUser.isAdmin) {
    return { success: false, error: 'Not authorized' };
  }
  
  const postData = getPostData(e);
  const email = postData.email || '';
  const password = postData.password || '';
  const displayName = postData.displayName || '';
  
  if (!email || !password || !displayName) {
    return { success: false, error: '必須項目を入力してください' };
  }
  
  // メール重複チェック
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email) {
      return { success: false, error: 'このメールアドレスは既に登録されています' };
    }
  }
  
  const userId = generateUUID();
  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();
  
  sheet.appendRow([
    userId,
    email,
    passwordHash,
    displayName,
    '', // profileImage
    '', // bio
    postData.department || '', // department
    now, // createdAt
    true, // isActive
    false // isAdmin
  ]);
  
  return {
    success: true,
    data: {
      userId: userId,
      email: email,
      displayName: displayName
    }
  };
}

/**
 * 初期管理者作成（スクリプトから直接実行）
 */
function createInitialAdmin() {
  const email = 'admin@example.com'; // 変更してください
  const password = 'admin123'; // 変更してください
  const displayName = '管理者';
  
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  
  // 既存チェック
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email) {
      Logger.log('Admin already exists');
      return;
    }
  }
  
  const userId = generateUUID();
  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();
  
  sheet.appendRow([
    userId,
    email,
    passwordHash,
    displayName,
    '',
    '',
    '管理部',
    now,
    true,
    true // isAdmin
  ]);
  
  Logger.log('Initial admin created: ' + email);
}
