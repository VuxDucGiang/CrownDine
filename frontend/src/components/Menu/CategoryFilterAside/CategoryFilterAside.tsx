import type { Category } from '@/types/category.type'

interface CategoryFilterAsideProps {
  categories: Category[]
  isLoading?: boolean
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

export default function CategoryFilterAside({
  categories,
  isLoading = false,
  selectedCategory,
  onSelectCategory
}: CategoryFilterAsideProps) {
  const categoryNames = ['Tất cả', ...categories.map((c) => c.name)]

  return (
    <aside className='border-border bg-card rounded-3xl border p-5'>
      <h3 className='text-foreground text-2xl font-semibold'>Danh mục</h3>
      <p className='text-muted-foreground mt-1 text-sm'>Chọn món theo nhóm</p>

      <div className='mt-6 space-y-2'>
        {isLoading ? (
          <p className='text-muted-foreground px-3 py-2 text-sm'>Đang tải danh mục...</p>
        ) : (
          categoryNames.map((name) => {
            const active = selectedCategory === name
            return (
              <button
                key={name}
                onClick={() => onSelectCategory(name)}
                className={`w-full rounded-2xl px-4 py-2.5 text-left text-base transition ${
                  active
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground hover:bg-muted hover:text-primary'
                }`}
              >
                {name}
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}
