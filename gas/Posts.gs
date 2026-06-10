/**
 * 投稿関連API
 */

/**
 * タイムライン取得
 */
function handleGetPosts(e, token) {
  const userId = validateSession(token);
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const page = parseInt(e.parameter.page) || 1;
  const offset = (page - 1) * PAGE_SIZE;
  
  // キャッシュ確認
  const cache = CacheService.getScriptCache();
  const cacheKey = 'posts_page_' + page;
  const cached = cache.get(cacheKey);
  
  if (cached && page === 1) {
    const posts = JSON.parse(cached);
    // いいね状態を更新
    const postsWithLikes = addLikeStatus(posts, userId);
    return {
      success: true,
      data: {
        items: postsWithLikes,
        hasMore: posts.length === PAGE_SIZE,
        nextPage: page + 1
      }
    };
  }
  
  const postsSheet = getSheet('Posts');
  const postsData = postsSheet.getDataRange().getValues();
  
  // ヘッダー除外、新しい順にソート
  const posts = [];
  for (let i = postsData.length - 1; i >= 1 && posts.length < offset + PAGE_SIZE + 1; i--) {
    posts.push({
      postId: postsData[i][0],
      userId: postsData[i][1],
      content: postsData[i][2],
      imageUrl: postsData[i][3],
      createdAt: postsData[i][4]
    });
  }
  
  // ページング
  const pagePosts = posts.slice(offset, offset + PAGE_SIZE);
  const hasMore = posts.length > offset + PAGE_SIZE;
  
  // ユーザー情報とイイネ数を追加
  const enrichedPosts = enrichPosts(pagePosts, userId);
  
  // キャッシュ保存（1ページ目のみ）
  if (page === 1) {
    cache.put(cacheKey, JSON.stringify(enrichedPosts), CACHE_TTL);
  }
  
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
 * 投稿にユーザー情報といいね情報を追加
 */
function enrichPosts(posts, currentUserId) {
  const usersSheet = getSheet('Users');
  const usersData = usersSheet.getDataRange().getValues();
  const usersMap = {};
  
  for (let i = 1; i < usersData.length; i++) {
    usersMap[usersData[i][0]] = {
      displayName: usersData[i][3],
      profileImage: usersData[i][4]
    };
  }
  
  // いいね数取得
  const likesSheet = getSheet('PostLikes');
  const likesData = likesSheet.getDataRange().getValues();
  const likesCount = {};
  const likedByUser = {};
  
  for (let i = 1; i < likesData.length; i++) {
    const postId = likesData[i][0];
    const likeUserId = likesData[i][1];
    
    likesCount[postId] = (likesCount[postId] || 0) + 1;
    
    if (likeUserId === currentUserId) {
      likedByUser[postId] = true;
    }
  }
  
  return posts.map(post => ({
    ...post,
    userName: usersMap[post.userId]?.displayName || 'Unknown',
    userImage: usersMap[post.userId]?.profileImage || '',
    likes: likesCount[post.postId] || 0,
    likedByMe: likedByUser[post.postId] || false
  }));
}

/**
 * いいね状態のみ更新
 */
function addLikeStatus(posts, userId) {
  const likesSheet = getSheet('PostLikes');
  const likesData = likesSheet.getDataRange().getValues();
  const likesCount = {};
  const likedByUser = {};
  
  for (let i = 1; i < likesData.length; i++) {
    const postId = likesData[i][0];
    const likeUserId = likesData[i][1];
    
    likesCount[postId] = (likesCount[postId] || 0) + 1;
    
    if (likeUserId === userId) {
      likedByUser[postId] = true;
    }
  }
  
  return posts.map(post => ({
    ...post,
    likes: likesCount[post.postId] || 0,
    likedByMe: likedByUser[post.postId] || false
  }));
}

/**
 * 投稿作成
 */
function handleCreatePost(e, token) {
  const userId = validateSession(token);
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const postData = getPostData(e);
  const content = (postData.content || '').trim();
  const imageUrl = (postData.imageUrl || '').trim();
  
  if (!content) {
    return { success: false, error: '内容を入力してください' };
  }
  
  if (content.length > 500) {
    return { success: false, error: '内容は500文字以内にしてください' };
  }
  
  const postId = generateUUID();
  const now = new Date().toISOString();
  
  const sheet = getSheet('Posts');
  sheet.appendRow([postId, userId, content, imageUrl, now]);
  
  // キャッシュクリア
  const cache = CacheService.getScriptCache();
  cache.remove('posts_page_1');
  
  const user = getUserById(userId);
  
  return {
    success: true,
    data: {
      postId: postId,
      userId: userId,
      userName: user?.displayName || 'Unknown',
      userImage: user?.profileImage || '',
      content: content,
      imageUrl: imageUrl,
      likes: 0,
      likedByMe: false,
      createdAt: now
    }
  };
}

/**
 * いいね
 */
function handleLikePost(e, token) {
  const userId = validateSession(token);
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const postData = getPostData(e);
  const postId = postData.postId || e.parameter.postId || '';
  
  if (!postId) {
    return { success: false, error: 'Post ID required' };
  }
  
  const sheet = getSheet('PostLikes');
  const data = sheet.getDataRange().getValues();
  
  // 既にいいね済みかチェック
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === postId && data[i][1] === userId) {
      // 既にいいね済み
      const likes = countLikes(postId);
      return { success: true, data: { likes: likes } };
    }
  }
  
  // いいね追加
  const now = new Date().toISOString();
  sheet.appendRow([postId, userId, now]);
  
  const likes = countLikes(postId);
  
  return { success: true, data: { likes: likes } };
}

/**
 * いいね取り消し
 */
function handleUnlikePost(e, token) {
  const userId = validateSession(token);
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const postData = getPostData(e);
  const postId = postData.postId || e.parameter.postId || '';
  
  if (!postId) {
    return { success: false, error: 'Post ID required' };
  }
  
  const sheet = getSheet('PostLikes');
  const data = sheet.getDataRange().getValues();
  
  // いいね削除
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === postId && data[i][1] === userId) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  
  const likes = countLikes(postId);
  
  return { success: true, data: { likes: likes } };
}

/**
 * いいね数カウント
 */
function countLikes(postId) {
  const sheet = getSheet('PostLikes');
  const data = sheet.getDataRange().getValues();
  let count = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === postId) {
      count++;
    }
  }
  
  return count;
}
