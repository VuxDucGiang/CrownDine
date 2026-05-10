import type { Item } from '@/types/item.type'
import type { ApiResponse, PageResponse } from '@/types/utils.type'
import http from '@/utils/http'

const ITEM_URL = 'items'

export interface GetListItemsParams {
  categoryId?: number | null
  search?: string
  sortBy?: string
  dir?: 'asc' | 'desc'
  page?: number
  size?: number
}

type UpsertItemPayload = Omit<Item, 'id'>

const itemApi = {
  getItems() {
    return http.get<ApiResponse<Item[]>>(ITEM_URL)
  },
  getItemById(id: number | string) {
    return http.get<ApiResponse<Item>>(`${ITEM_URL}/${id}`)
  },
  getItemBySlug(slug: string) {
    return http.get<ApiResponse<Item>>(`${ITEM_URL}/slug/${slug}`)
  },
  /** Lọc theo category + search ở backend (phân trang) */
  getListItems(params: GetListItemsParams = {}) {
    const { categoryId, search, sortBy = 'id', dir = 'desc', page = 1, size = 100 } = params
    return http.get<ApiResponse<PageResponse<Item>>>(`${ITEM_URL}/list`, {
      params: { categoryId, search, sortBy, dir, page, size }
    })
  },
  getItemsByCategory(categoryId: number) {
    return http.get<ApiResponse<PageResponse<Item>>>(`${ITEM_URL}/list`, {
      params: { categoryId, size: 100 }
    })
  },
  createItem(data: UpsertItemPayload) {
    return http.post<ApiResponse<Item>>(ITEM_URL, data)
  },
  updateItem(id: number | string, data: UpsertItemPayload) {
    return http.put<ApiResponse<Item>>(`${ITEM_URL}/${id}`, data)
  },
  deleteItem(id: number | string) {
    return http.delete<ApiResponse<null>>(`${ITEM_URL}/${id}`)
  }
}

export default itemApi
