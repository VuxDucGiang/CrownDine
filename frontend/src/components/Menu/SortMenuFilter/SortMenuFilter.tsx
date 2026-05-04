import { Search } from 'lucide-react'
import useMenuQueryUpdater from '@/hooks/useMenuQueryUpdater'

interface SortMenuFilterProps {
  search: string
  sortBy: string
}

const SORT_OPTIONS = [
  { value: 'default', label: 'Phổ biến' },
  { value: 'rating', label: 'Đánh giá' },
  { value: 'price_asc', label: 'Giá tăng' },
  { value: 'price_desc', label: 'Giá giảm' }
]

export default function SortMenuFilter({ search, sortBy }: SortMenuFilterProps) {
  const updateMenuQueryParams = useMenuQueryUpdater()

  const handleSearchInputChange = (value: string) => {
    updateMenuQueryParams({
      page: '1',
      search: value.trim() || undefined
    })
  }

  const handleSortChange = (value: string) => {
    if (value === 'rating') {
      updateMenuQueryParams({ page: '1', sortBy: 'rating', dir: 'desc' })
      return
    }
    if (value === 'price_asc') {
      updateMenuQueryParams({ page: '1', sortBy: 'price', dir: 'asc' })
      return
    }
    if (value === 'price_desc') {
      updateMenuQueryParams({ page: '1', sortBy: 'price', dir: 'desc' })
      return
    }
    updateMenuQueryParams({ page: '1', sortBy: 'id', dir: 'desc' })
  }

  return (
    <section className='border-border bg-card rounded-3xl border p-4'>
      <p className='text-muted-foreground mb-3 text-xs font-semibold tracking-[0.14em] uppercase'>Sắp xếp & Lọc</p>

      <div className='flex flex-col gap-3 xl:flex-row xl:items-center'>
        <div className='relative flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2' />
          <input
            value={search}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            placeholder='Tìm món ăn, combo...'
            className='border-border bg-muted/60 w-full rounded-2xl border py-3 pr-4 pl-10 text-sm outline-none'
          />
        </div>

        <div className='flex flex-wrap gap-2'>
          {SORT_OPTIONS.map((option) => {
            const active = sortBy === option.value
            return (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:border-primary/40'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
