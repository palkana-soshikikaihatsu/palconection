import type { ApiResponse, User, Post, Community, CommunityPost, PaginatedResponse, Session } from '../types'

const GAS_URL = import.meta.env.VITE_GAS_URL || ''

class ApiService {
  private token: string | null = null

  constructor() {
    this.token = localStorage.getItem('session_token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('session_token', token)
    } else {
      localStorage.removeItem('session_token')
    }
  }

  getToken(): string | null {
    return this.token
  }

  private async request<T>(action: string, method: 'GET' | 'POST' = 'GET', body?: Record<string, unknown>): Promise<ApiResponse<T>> {
    try {
      const url = new URL(GAS_URL)
      url.searchParams.append('action', action)
      
      if (this.token) {
        url.searchParams.append('token', this.token)
      }

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'text/plain',
        },
      }

      if (method === 'POST' && body) {
        options.body = JSON.stringify(body)
      } else if (method === 'GET' && body) {
        Object.entries(body).forEach(([key, value]) => {
          url.searchParams.append(key, String(value))
        })
      }

      const response = await fetch(url.toString(), options)
      const data = await response.json()
      
      return data as ApiResponse<T>
    } catch (error) {
      console.error('API Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async login(email: string, password: string): Promise<ApiResponse<Session>> {
    const result = await this.request<Session>('login', 'POST', { email, password })
    if (result.success && result.data) {
      this.setToken(result.data.token)
    }
    return result
  }

  async logout(): Promise<ApiResponse<void>> {
    const result = await this.request<void>('logout', 'POST')
    this.setToken(null)
    return result
  }

  async checkSession(): Promise<ApiResponse<Session>> {
    if (!this.token) {
      return { success: false, error: 'No session' }
    }
    return this.request<Session>('checkSession', 'GET')
  }

  async getPosts(page: number = 1): Promise<ApiResponse<PaginatedResponse<Post>>> {
    return this.request<PaginatedResponse<Post>>('getPosts', 'GET', { page })
  }

  async createPost(content: string, imageUrl?: string): Promise<ApiResponse<Post>> {
    return this.request<Post>('createPost', 'POST', { content, imageUrl })
  }

  async likePost(postId: string): Promise<ApiResponse<{ likes: number }>> {
    return this.request<{ likes: number }>('likePost', 'POST', { postId })
  }

  async unlikePost(postId: string): Promise<ApiResponse<{ likes: number }>> {
    return this.request<{ likes: number }>('unlikePost', 'POST', { postId })
  }

  async getCommunities(): Promise<ApiResponse<Community[]>> {
    return this.request<Community[]>('getCommunities', 'GET')
  }

  async getCommunityPosts(communityId: string, page: number = 1): Promise<ApiResponse<PaginatedResponse<CommunityPost>>> {
    return this.request<PaginatedResponse<CommunityPost>>('getCommunityPosts', 'GET', { communityId, page })
  }

  async createCommunityPost(communityId: string, content: string): Promise<ApiResponse<CommunityPost>> {
    return this.request<CommunityPost>('createCommunityPost', 'POST', { communityId, content })
  }

  async joinCommunity(communityId: string): Promise<ApiResponse<void>> {
    return this.request<void>('joinCommunity', 'POST', { communityId })
  }

  async leaveCommunity(communityId: string): Promise<ApiResponse<void>> {
    return this.request<void>('leaveCommunity', 'POST', { communityId })
  }

  async getProfile(userId?: string): Promise<ApiResponse<User>> {
    return this.request<User>('getProfile', 'GET', userId ? { userId } : undefined)
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('updateProfile', 'POST', data)
  }
}

export const api = new ApiService()
export default api
