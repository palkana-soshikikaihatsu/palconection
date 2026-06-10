export interface User {
  userId: string
  email: string
  displayName: string
  profileImage: string
  bio: string
  department: string
  createdAt: string
  isActive: boolean
}

export interface Post {
  postId: string
  userId: string
  userName: string
  userImage: string
  content: string
  imageUrl?: string
  likes: number
  likedByMe: boolean
  createdAt: string
}

export interface Community {
  communityId: string
  name: string
  description: string
  createdBy: string
  memberCount: number
  isJoined: boolean
}

export interface CommunityPost {
  postId: string
  communityId: string
  userId: string
  userName: string
  userImage: string
  content: string
  createdAt: string
}

export interface Session {
  token: string
  userId: string
  user: User
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  hasMore: boolean
  nextPage: number
}
