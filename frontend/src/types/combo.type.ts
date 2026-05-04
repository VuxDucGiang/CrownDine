export interface ComboItem {
  itemId: number
  itemName: string
  quantity: number
}

export interface Combo {
  id: number
  slug?: string
  name: string
  description: string
  price: number
  priceAfterDiscount: number | null
  status: string
  imageUrl: string | null
  averageRating?: number
  feedbackCount?: number
  soldCount?: number
  items?: ComboItem[]
}
