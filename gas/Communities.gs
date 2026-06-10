/**
 * コミュニティ関連API
 */

/**
 * コミュニティ一覧取得
 */
function handleGetCommunities(token) {
  const userId = validateSession(token);
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const communitiesSheet = getSheet('Communities');
  const communitiesData = communitiesSheet.getDataRange().getValues();
  
  const membersSheet = getSheet('CommunityMembers');
  const membersData = membersSheet.getDataRange().getValues();
  
  // メンバー数とユーザーの参加状況をカウント
  const memberCounts = {};
  const userJoined = {};
  
  for (let i = 1; i < membersData.length; i++) {
    const communityId = membersData[i][0];
    const memberId = membersData[i][1];
    
    memberCounts[communityId] = (memberCounts[communityId] || 0) + 1;
    
    if (memberId === userId) {
      userJoined[communityId] = true;
    }
  }
  
  const communities = [];
  for (let i = 1; i < communitiesData.length; i++) {
    const communityId = communitiesData[i][0];
    communities.push({
      communityId: communityId,
      name: communitiesData[i][1],
      description: communitiesData[i][2],
      createdBy: communitiesData[i][3],
      memberCount: memberCounts[communityId] || 0,
      isJoined: userJoined[communityId] || false
    });
  }
  
  return {
    success: true,
    data: communities
  };
}

/**
 * コミュニティ投稿取得
 */
function handleGetCommunityPosts(e, token) {
  const userId = validateSession(token);
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const communityId = e.parameter.communityId || '';
  const page = parseInt(e.parameter.page) || 1;
  const offset = (page - 1) * PAGE_SIZE;
  
  if (!communityId) {
    return { success: false, error: 'Community ID required' };
  }
  
  const postsSheet = getSheet('CommunityPosts');
  const postsData = postsSheet.getDataRange().getValues();
  
  // 該当コミュニティの投稿を新しい順に取得
  const posts = [];
  for (let i = postsData.length - 1; i >= 1; i--) {
    if (postsData[i][1] === communityId) {
      posts.push({
        postId: postsData[i][0],
        communityId: postsData[i][1],
        userId: postsData[i][2],
        content: postsData[i][3],
        createdAt: postsData[i][4]
      });
    }
  }
  
  // ページング
  const pagePosts = posts.slice(offset, offset + PAGE_SIZE);
  const hasMore = posts.length > offset + PAGE_SIZE;
  
  // ユーザー情報を追加
  const enrichedPosts = enrichCommunityPosts(pagePosts);
  
  return {
    success: true,
    data: {
      items: enrichedPosts,
      hasMore: hasMore,
      nextPage: page + 1
    }
  };
}

/**
 * コミュニティ投稿にユーザー情報を追加
 */
function enrichCommunityPosts(posts) {
  const usersSheet = getSheet('Users');
  const usersData = usersSheet.getDataRange().getValues();
  const usersMap = {};
  
  for (let i = 1; i < usersData.length; i++) {
    usersMap[usersData[i][0]] = {
      displayName: usersData[i][3],
      profileImage: usersData[i][4]
    };
  }
  
  return posts.map(post => ({
    ...post,
    userName: usersMap[post.userId]?.displayName || 'Unknown',
    userImage: usersMap[post.userId]?.profileImage || ''
  }));
}

/**
 * コミュニティ投稿作成
 */
function handleCreateCommunityPost(e, token) {
  const userId = validateSession(token);
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const postData = getPostData(e);
  const communityId = postData.communityId || '';
  const content = (postData.content || '').trim();
  
  if (!communityId) {
    return { success: false, error: 'Community ID required' };
  }
  
  if (!content) {
    return { success: false, error: '内容を入力してください' };
  }
  
  // コミュニティメンバーかチェック
  const membersSheet = getSheet('CommunityMembers');
  const membersData = membersSheet.getDataRange().getValues();
  let isMember = false;
  
  for (let i = 1; i < membersData.length; i++) {
    if (membersData[i][0] === communityId && membersData[i][1] === userId) {
      isMember = true;
      break;
    }
  }
  
  if (!isMember) {
    return { success: false, error: 'コミュニティに参加してください' };
  }
  
  const postId = generateUUID();
  const now = new Date().toISOString();
  
  const postsSheet = getSheet('CommunityPosts');
  postsSheet.appendRow([postId, communityId, userId, content, now]);
  
  const user = getUserById(userId);
  
  return {
    success: true,
    data: {
      postId: postId,
      communityId: communityId,
      userId: userId,
      userName: user?.displayName || 'Unknown',
      userImage: user?.profileImage || '',
      content: content,
      createdAt: now
    }
  };
}

/**
 * コミュニティ参加
 */
function handleJoinCommunity(e, token) {
  const userId = validateSession(token);
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const postData = getPostData(e);
  const communityId = postData.communityId || e.parameter.communityId || '';
  
  if (!communityId) {
    return { success: false, error: 'Community ID required' };
  }
  
  const sheet = getSheet('CommunityMembers');
  const data = sheet.getDataRange().getValues();
  
  // 既に参加しているかチェック
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === communityId && data[i][1] === userId) {
      return { success: true }; // 既に参加済み
    }
  }
  
  const now = new Date().toISOString();
  sheet.appendRow([communityId, userId, now]);
  
  return { success: true };
}

/**
 * コミュニティ退出
 */
function handleLeaveCommunity(e, token) {
  const userId = validateSession(token);
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const postData = getPostData(e);
  const communityId = postData.communityId || e.parameter.communityId || '';
  
  if (!communityId) {
    return { success: false, error: 'Community ID required' };
  }
  
  const sheet = getSheet('CommunityMembers');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === communityId && data[i][1] === userId) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  
  return { success: true };
}

/**
 * コミュニティ作成（管理者のみ）
 */
function handleCreateCommunity(e, token) {
  const userId = validateSession(token);
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const user = getUserById(userId);
  if (!user || !user.isAdmin) {
    return { success: false, error: 'Not authorized' };
  }
  
  const postData = getPostData(e);
  const name = (postData.name || '').trim();
  const description = (postData.description || '').trim();
  
  if (!name) {
    return { success: false, error: 'コミュニティ名を入力してください' };
  }
  
  const communityId = generateUUID();
  const now = new Date().toISOString();
  
  const sheet = getSheet('Communities');
  sheet.appendRow([communityId, name, description, userId, now]);
  
  // 作成者を自動的にメンバーに追加
  const membersSheet = getSheet('CommunityMembers');
  membersSheet.appendRow([communityId, userId, now]);
  
  return {
    success: true,
    data: {
      communityId: communityId,
      name: name,
      description: description,
      createdBy: userId,
      memberCount: 1,
      isJoined: true
    }
  };
}

/**
 * サンプルコミュニティ作成（初期データ）
 */
function createSampleCommunities() {
  const communities = [
    { name: '雑談', description: '何でも話せるコミュニティです' },
    { name: '技術部屋', description: '技術的な話題を共有しましょう' },
    { name: 'ランチ部', description: 'おすすめのランチ情報を共有！' },
    { name: '趣味の部屋', description: '趣味について語り合いましょう' }
  ];
  
  const sheet = getSheet('Communities');
  const now = new Date().toISOString();
  
  communities.forEach(c => {
    const communityId = generateUUID();
    sheet.appendRow([communityId, c.name, c.description, 'system', now]);
  });
  
  Logger.log('Sample communities created');
}
