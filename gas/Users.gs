/**
 * ユーザー関連API
 */

/**
 * プロフィール取得
 */
function handleGetProfile(e, token) {
  const currentUserId = validateSession(token);
  if (!currentUserId) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // 指定ユーザーIDがあればそのユーザー、なければ自分
  const targetUserId = e.parameter.userId || currentUserId;
  
  const user = getUserById(targetUserId);
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  return {
    success: true,
    data: user
  };
}

/**
 * プロフィール更新
 */
function handleUpdateProfile(e, token) {
  const userId = validateSession(token);
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const postData = getPostData(e);
  
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      // 更新可能なフィールド
      if (postData.displayName !== undefined) {
        const displayName = (postData.displayName || '').trim();
        if (!displayName) {
          return { success: false, error: '表示名は必須です' };
        }
        if (displayName.length > 50) {
          return { success: false, error: '表示名は50文字以内にしてください' };
        }
        sheet.getRange(i + 1, 4).setValue(displayName);
      }
      
      if (postData.profileImage !== undefined) {
        sheet.getRange(i + 1, 5).setValue(postData.profileImage || '');
      }
      
      if (postData.bio !== undefined) {
        const bio = (postData.bio || '').trim();
        if (bio.length > 500) {
          return { success: false, error: '自己紹介は500文字以内にしてください' };
        }
        sheet.getRange(i + 1, 6).setValue(bio);
      }
      
      if (postData.department !== undefined) {
        const department = (postData.department || '').trim();
        if (department.length > 50) {
          return { success: false, error: '部署名は50文字以内にしてください' };
        }
        sheet.getRange(i + 1, 7).setValue(department);
      }
      
      // 更新後のユーザー情報を返す
      const updatedUser = getUserById(userId);
      return {
        success: true,
        data: updatedUser
      };
    }
  }
  
  return { success: false, error: 'User not found' };
}

/**
 * ユーザー一覧取得（管理者のみ）
 */
function handleGetUsers(token) {
  const userId = validateSession(token);
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const user = getUserById(userId);
  if (!user || !user.isAdmin) {
    return { success: false, error: 'Not authorized' };
  }
  
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  
  const users = [];
  for (let i = 1; i < data.length; i++) {
    users.push({
      userId: data[i][0],
      email: data[i][1],
      displayName: data[i][3],
      profileImage: data[i][4],
      department: data[i][6],
      createdAt: data[i][7],
      isActive: data[i][8],
      isAdmin: data[i][9]
    });
  }
  
  return {
    success: true,
    data: users
  };
}

/**
 * ユーザー有効/無効切り替え（管理者のみ）
 */
function handleToggleUserActive(e, token) {
  const adminUserId = validateSession(token);
  if (!adminUserId) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const adminUser = getUserById(adminUserId);
  if (!adminUser || !adminUser.isAdmin) {
    return { success: false, error: 'Not authorized' };
  }
  
  const postData = getPostData(e);
  const targetUserId = postData.userId || '';
  const isActive = postData.isActive;
  
  if (!targetUserId) {
    return { success: false, error: 'User ID required' };
  }
  
  // 自分自身は無効化できない
  if (targetUserId === adminUserId) {
    return { success: false, error: '自分自身は無効化できません' };
  }
  
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === targetUserId) {
      sheet.getRange(i + 1, 9).setValue(isActive);
      
      // 無効化した場合、セッションも削除
      if (!isActive) {
        deleteUserSessions(targetUserId);
      }
      
      return { success: true };
    }
  }
  
  return { success: false, error: 'User not found' };
}

/**
 * ユーザーのセッション全削除
 */
function deleteUserSessions(userId) {
  const sheet = getSheet('Sessions');
  const data = sheet.getDataRange().getValues();
  
  // 後ろから削除（行番号がずれないように）
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === userId) {
      sheet.deleteRow(i + 1);
    }
  }
}

/**
 * パスワード変更
 */
function handleChangePassword(e, token) {
  const userId = validateSession(token);
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const postData = getPostData(e);
  const currentPassword = postData.currentPassword || '';
  const newPassword = postData.newPassword || '';
  
  if (!currentPassword || !newPassword) {
    return { success: false, error: '現在のパスワードと新しいパスワードを入力してください' };
  }
  
  if (newPassword.length < 6) {
    return { success: false, error: 'パスワードは6文字以上にしてください' };
  }
  
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  const currentPasswordHash = hashPassword(currentPassword);
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      if (data[i][2] !== currentPasswordHash) {
        return { success: false, error: '現在のパスワードが正しくありません' };
      }
      
      const newPasswordHash = hashPassword(newPassword);
      sheet.getRange(i + 1, 3).setValue(newPasswordHash);
      
      // 他のセッションを削除（セキュリティのため）
      deleteUserSessionsExcept(userId, token);
      
      return { success: true };
    }
  }
  
  return { success: false, error: 'User not found' };
}

/**
 * 指定トークン以外のセッション削除
 */
function deleteUserSessionsExcept(userId, keepToken) {
  const sheet = getSheet('Sessions');
  const data = sheet.getDataRange().getValues();
  
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === userId && data[i][0] !== keepToken) {
      sheet.deleteRow(i + 1);
    }
  }
}
