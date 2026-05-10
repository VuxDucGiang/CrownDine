import comboApi from '@/apis/combo.api'
import categoryApi from '@/apis/category.api'
import itemApi from '@/apis/item.api'
import favoritesApi from '@/apis/favorites.api'
import type { Item } from '@/types/item.type'
import { comboToCardItem, type MenuCardItem } from '@/types/item.type'
import { formatCurrency, getImageUrl, DEFAULT_PLACEHOLDER } from '@/utils/utils'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Search, Heart } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/useAuthStore'

interface MenuSelectorProps {
  onSelectItem: (item: MenuCardItem, type: 'item' | 'combo') => void
  isSidebar?: boolean
}

export default function MenuSelector({ onSelectItem, isSidebar = false }: MenuSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tất cả')
  const { isAuthenticated } = useAuthStore()

  // --- Fetching Data ---
  const { data: categories = [], isPending: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getCategories(),
    select: (res) => res.data.data
  })

  const { data: rawItems = [], isPending: itemsLoading } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemApi.getItems(),
    select: (res) => res.data.data
  })

  const { data: combos = [], isPending: combosLoading } = useQuery({
    queryKey: ['combos'],
    queryFn: () => comboApi.getCombos(),
    select: (res) => res.data.data
  })

  const { data: favorites = [], isPending: favoritesLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.getMyFavorites(),
    select: (res) => res.data.data,
    enabled: isAuthenticated
  })

  const categoryMap = useMemo(() => {
    const map: Record<number, string> = {}
    categories.forEach((c) => {
      map[c.id] = c.name
    })
    return map
  }, [categories])

  const itemsWithCategory: Item[] = useMemo(
    () =>
      rawItems.map((item) => ({
        ...item,
        category: categoryMap[item.categoryId] ?? ''
      })),
    [rawItems, categoryMap]
  )

  const combosAsCardItems: MenuCardItem[] = useMemo(() => combos.map(comboToCardItem), [combos])

  const categoryNames = useMemo(() => {
    const names = ['Tất cả', 'Combo']
    if (isAuthenticated) {
      names.push('Yêu thích')
    }
    return [...names, ...categories.map((c) => c.name)]
  }, [categories, isAuthenticated])

  // --- Filtering ---
  const filteredItems = useMemo(() => {
    return itemsWithCategory.filter((item) => {
      let matchCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory

      if (selectedCategory === 'Yêu thích') {
        matchCategory = favorites.some((f) => f.item?.id === item.id)
      }

      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [itemsWithCategory, searchQuery, selectedCategory, favorites])

  const filteredCombos = useMemo(() => {
    return combosAsCardItems.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase())

      let matchCategory = selectedCategory === 'Tất cả' || selectedCategory === 'Combo'
      if (selectedCategory === 'Yêu thích') {
        matchCategory = favorites.some((f) => f.combo?.id === c.id)
      }

      return matchCategory && matchSearch
    })
  }, [combosAsCardItems, searchQuery, selectedCategory, favorites])

  const displayList = useMemo(() => {
    if (selectedCategory === 'Combo') {
      return filteredCombos.map((item) => ({ key: `combo-${item.id}`, item, type: 'combo' as const }))
    }
    if (selectedCategory === 'Tất cả' || selectedCategory === 'Yêu thích') {
      return [
        ...filteredCombos.map((item) => ({ key: `combo-${item.id}`, item, type: 'combo' as const })),
        ...filteredItems.map((item) => ({ key: `item-${item.id}`, item, type: 'item' as const }))
      ]
    }
    return filteredItems.map((item) => ({ key: `item-${item.id}`, item, type: 'item' as const }))
  }, [selectedCategory, filteredItems, filteredCombos])

  if (categoriesLoading || itemsLoading || combosLoading || (isAuthenticated && favoritesLoading)) {
    return (
      <div className='flex h-[400px] w-full items-center justify-center'>
        <p className='text-muted-foreground animate-pulse text-sm font-medium'>Đang tải thực đơn...</p>
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col'>
      {/* Top Search only if not sidebar (if sidebar, we might put it elsewhere or keep it) */}
      {!isSidebar && (
        <div className='relative mb-4'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='Tìm món hoặc combo...'
            className='bg-background pl-9 shadow-sm'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {isSidebar ? (
        <div className='flex flex-1 gap-4 overflow-hidden'>
          {/* Vertical Sidebar Categories */}
          <div className='scrollbar-thin flex w-40 flex-col gap-1.5 overflow-y-auto pr-1'>
            <div className='relative mb-2'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2' />
              <Input
                placeholder='Tìm...'
                className='h-8 border-slate-200 bg-white pl-8 text-xs'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {categoryNames.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-md'
                    : 'border border-slate-100 bg-white text-slate-500 hover:bg-slate-100'
                }`}
              >
                {cat === 'Yêu thích' && (
                  <Heart size={10} className={selectedCategory === cat ? 'fill-current' : 'text-red-500'} />
                )}
                <span className='truncate'>{cat}</span>
              </button>
            ))}
          </div>

          {/* Grid Menu (Vertical Scroll) */}
          <div className='scrollbar-thin flex-1 overflow-y-auto pr-1'>
            {displayList.length > 0 ? (
              <div className='grid grid-cols-2 gap-3 pb-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
                {displayList.map(({ key, item, type }) => (
                  <MenuCard key={key} item={item} onClick={() => onSelectItem(item, type)} />
                ))}
              </div>
            ) : (
              <div className='flex h-40 flex-col items-center justify-center text-center'>
                <p className='text-muted-foreground text-sm font-medium'>Không tìm thấy món ăn nào</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Category Tabs (Horizontal Scroll) */}
          <div className='mb-4'>
            <div className='scrollbar-hide w-full overflow-x-auto'>
              <div className='flex w-max gap-2 pb-2'>
                {categoryNames.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                      selectedCategory === cat
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted text-foreground border-border'
                    }`}
                  >
                    {cat === 'Yêu thích' && (
                      <Heart size={12} className={selectedCategory === cat ? 'fill-current' : 'text-red-500'} />
                    )}
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className='flex-1 overflow-y-auto pr-2'>
            {displayList.length > 0 ? (
              <div className='grid grid-cols-2 gap-4 pb-4 sm:grid-cols-3 md:grid-cols-4'>
                {displayList.map(({ key, item, type }) => (
                  <MenuCard key={key} item={item} onClick={() => onSelectItem(item, type)} />
                ))}
              </div>
            ) : (
              <div className='flex h-40 flex-col items-center justify-center text-center'>
                <p className='text-muted-foreground text-sm font-medium'>Không tìm thấy món ăn nào</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// --- Internal Small Card Component ---
function MenuCard({ item, onClick }: { item: MenuCardItem; onClick: () => void }) {
  const hasDiscount = item.priceAfterDiscount != null && Number(item.priceAfterDiscount) < Number(item.price)
  const currentPrice = hasDiscount ? Number(item.priceAfterDiscount) : Number(item.price)

  return (
    <div
      onClick={onClick}
      className='bg-card hover:border-primary cursor-pointer overflow-hidden rounded-xl border transition-all hover:shadow-md'
    >
      <div className='bg-muted relative aspect-square overflow-hidden'>
        <img
          src={getImageUrl(item.imageUrl)}
          alt={item.name}
          className='h-full w-full object-cover transition-transform duration-300 hover:scale-110'
          onError={(e) => {
            const target = e.target as HTMLImageElement
            if (target.src !== DEFAULT_PLACEHOLDER) {
              target.src = DEFAULT_PLACEHOLDER
            }
          }}
        />
        {item.status === 'SOLD_OUT' && (
          <div className='absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
            <span className='bg-destructive rounded px-2 py-1 text-xs font-bold tracking-wider text-white uppercase'>
              Hết món
            </span>
          </div>
        )}
      </div>
      <div className='p-2 text-center' title={item.name}>
        <h3 className='text-foreground mb-0.5 line-clamp-1 text-[11px] font-bold'>{item.name}</h3>
        <div className='mx-auto flex flex-col items-center leading-tight'>
          {hasDiscount && (
            <span className='text-muted-foreground text-[9px] line-through'>{formatCurrency(Number(item.price))}</span>
          )}
          <span className='text-primary text-[11px] font-black'>{formatCurrency(Number(currentPrice))}</span>
        </div>
      </div>
    </div>
  )
}
