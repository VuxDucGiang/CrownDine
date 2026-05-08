import type { Combo } from './combo.type'

export type ItemStatus = 'AVAILABLE' | 'SOLD_OUT' | 'STOPPED'

export interface Item {
  id: number
  slug?: string
  categoryId: number
  description: string
  imageUrl: string
  name: string
  price: number
  priceAfterDiscount: number | null
  status: string
  createdAt?: string
  updatedAt?: string
  /** Tên category (map từ API categories, dùng cho filter/display) */
  category?: string
  averageRating?: number
  feedbackCount?: number
  tags?: string[]
}

/** Dữ liệu dùng chung để hiển thị card (Item hoặc Combo) */
export type MenuCardItem = Pick<
  Item,
  'id' | 'slug' | 'name' | 'description' | 'imageUrl' | 'price' | 'priceAfterDiscount' | 'status'
> & { averageRating?: number; feedbackCount?: number; soldCount?: number; tags?: string[] }

export function comboToCardItem(c: Combo): MenuCardItem {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description ?? '',
    imageUrl: c.imageUrl ?? '',
    price: Number(c.price),
    priceAfterDiscount: c.priceAfterDiscount != null ? Number(c.priceAfterDiscount) : null,
    status: c.status,
    averageRating: c.averageRating,
    feedbackCount: c.feedbackCount,
    soldCount: c.soldCount
  }
}
