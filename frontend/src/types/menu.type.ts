import type { ApiResponse, PageResponse } from '@/types/utils.type'

export type MenuType = 'ALL' | 'ITEM' | 'COMBO'

export type MenuSortBy = 'id' | 'name' | 'price' | 'rating' | 'soldCount'

export interface MenuResponse {
  id: number
  type: Exclude<MenuType, 'ALL'>
  slug: string | null
  name: string
  description: string | null
  imageUrl: string | null
  price: number
  priceAfterDiscount: number | null
  displayPrice: number
  status: string | null
  categoryId: number | null
  categoryName: string | null
  soldCount: number | null
  averageRating: number | null
  feedbackCount: number | null
}

export interface MenuParamsConfig {
  categoryId?: number | null
  search?: string
  type?: MenuType
  sortBy?: MenuSortBy
  dir?: 'asc' | 'desc'
  page?: number
  size?: number
}

export type MenuListApiResponse = ApiResponse<PageResponse<MenuResponse>>
