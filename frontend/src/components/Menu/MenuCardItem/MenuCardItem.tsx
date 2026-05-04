import RatingStart from '@/components/RatingStart'
import { useAuthStore } from '@/stores/useAuthStore'
import { useFavoriteStore } from '@/stores/useFavoriteStore'
import type { MenuResponse } from '@/types/menu.type'
import { DEFAULT_PLACEHOLDER, formatCurrency, getImageUrl } from '@/utils/utils'
import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

interface MenuCardItemProps {
  menu: MenuResponse
}

export default function MenuCardItem({ menu }: MenuCardItemProps) {
  const {
    isFavoriteItem,
    isFavoriteCombo,
    addFavoriteItem,
    addFavoriteCombo,
    removeFavoriteItem,
    removeFavoriteCombo
  } = useFavoriteStore()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isCombo = menu.type === 'COMBO'
  const menuSlug = menu.slug

  const isFavorite = isCombo ? isFavoriteCombo(menu.id) : isFavoriteItem(menu.id)
  const hasDiscount = menu.priceAfterDiscount != null && Number(menu.priceAfterDiscount) < Number(menu.price)

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để dùng yêu thích')
      return
    }

    if (isFavorite) {
      if (isCombo) await removeFavoriteCombo(menu.id)
      else await removeFavoriteItem(menu.id)
    } else {
      if (isCombo) await addFavoriteCombo(menu.id)
      else await addFavoriteItem(menu.id)
    }
  }

  return (
    <Link
      to={menuSlug ? `/menu/${menuSlug}` : '/menu'}
      className='border-border bg-card hover:border-primary/40 group block overflow-hidden rounded-3xl border transition'
    >
      <div className='bg-muted relative h-56 overflow-hidden'>
        <img
          src={getImageUrl(menu.imageUrl ?? '')}
          alt={menu.name}
          className='h-full w-full object-cover transition duration-500 group-hover:scale-105'
          onError={(e) => {
            const target = e.target as HTMLImageElement
            if (target.src !== DEFAULT_PLACEHOLDER) target.src = DEFAULT_PLACEHOLDER
          }}
        />

        <button
          onClick={handleToggleFavorite}
          className={`absolute top-3 right-3 rounded-full p-2 backdrop-blur-sm transition ${
            isFavorite ? 'bg-primary text-white' : 'text-muted-foreground bg-white/85 hover:text-red-500'
          }`}
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className='p-4'>
        <h3 className='text-foreground line-clamp-2 text-3xl leading-tight font-semibold'>{menu.name}</h3>
        <p className='text-muted-foreground mt-2 line-clamp-2 text-sm'>{menu.description ?? ''}</p>

        <div className='mt-4 flex items-center gap-2'>
          <RatingStart rating={menu.averageRating || 0} size={16} />
          <span className='text-muted-foreground text-sm'>
            {menu.averageRating ? menu.averageRating.toFixed(1) : '0.0'} ({menu.feedbackCount || 0})
          </span>
          <span className='text-muted-foreground'>•</span>
          <span className='text-muted-foreground text-sm'>{menu.soldCount ?? 0} đã bán</span>
        </div>

        <div className='border-border mt-4 border-t pt-4'>
          {hasDiscount ? (
            <div>
              <p className='text-muted-foreground text-sm line-through'>{formatCurrency(Number(menu.price))}</p>
              <p className='text-primary text-2xl font-bold'>{formatCurrency(Number(menu.priceAfterDiscount))}</p>
            </div>
          ) : (
            <p className='text-primary text-2xl font-bold'>{formatCurrency(Number(menu.price))}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
