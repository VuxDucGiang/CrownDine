import type { Combo } from '@/types/combo.type'
import type { ApiResponse } from '@/types/utils.type'
import http from '@/utils/http'

const COMBO_URL = 'combos'

type UpsertComboPayload = Omit<Combo, 'id'>

const comboApi = {
  getCombos() {
    return http.get<ApiResponse<Combo[]>>(COMBO_URL)
  },
  getComboById(id: number | string) {
    return http.get<ApiResponse<Combo>>(`${COMBO_URL}/${id}`)
  },
  getComboBySlug(slug: string) {
    return http.get<ApiResponse<Combo>>(`${COMBO_URL}/slug/${slug}`)
  },
  createCombo(data: UpsertComboPayload) {
    return http.post<ApiResponse<Combo>>(COMBO_URL, data)
  },
  updateCombo(id: number | string, data: UpsertComboPayload) {
    return http.put<ApiResponse<Combo>>(`${COMBO_URL}/${id}`, data)
  },
  deleteCombo(id: number | string) {
    return http.delete<ApiResponse<null>>(`${COMBO_URL}/${id}`)
  }
}

export default comboApi
