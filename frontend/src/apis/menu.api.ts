import http from '@/utils/http'
import type { MenuListApiResponse, MenuParamsConfig } from '@/types/menu.type'

const MENU_URL = 'menu'

const menuApi = {
  getMenu(params: MenuParamsConfig = {}) {
    const { categoryId, search, type = 'ALL', sortBy = 'id', dir = 'desc', page = 1, size = 12 } = params

    return http.get<MenuListApiResponse>(MENU_URL, {
      params: { categoryId, search, type, sortBy, dir, page, size }
    })
  }
}

export default menuApi
