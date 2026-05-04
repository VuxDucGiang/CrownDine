import categoryApi from '@/apis/category.api'
import menuApi from '@/apis/menu.api'
import CategoryFilterAside from '@/components/Menu/CategoryFilterAside/CategoryFilterAside'
import MenuCardItem from '@/components/Menu/MenuCardItem/MenuCardItem'
import SortMenuFilter from '@/components/Menu/SortMenuFilter/SortMenuFilter'
import useMenuConfigParam from '@/hooks/useMenuConfigParam'
import usePagination from '@/hooks/usePagination'
import useMenuQueryUpdater from '@/hooks/useMenuQueryUpdater'
import type { Category } from '@/types/category.type'
import type { MenuResponse } from '@/types/menu.type'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'

const ITEMS_PER_PAGE = 12
export default function Menu() {
  const menuConfig = useMenuConfigParam()
  const updateMenuQueryParams = useMenuQueryUpdater()

  const { data: categories = [], isPending: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getCategories(),
    select: (res) => res.data.data as Category[]
  })

  const selectedCategoryId = menuConfig.categoryId ?? null
  const selectedCategory = useMemo(
    () =>
      selectedCategoryId != null ? (categories.find((c) => c.id === selectedCategoryId)?.name ?? 'Tất cả') : 'Tất cả',
    [categories, selectedCategoryId]
  )
  const searchQuery = menuConfig.search ?? ''
  const sortBy = useMemo(() => {
    const sortKey = `${menuConfig.sortBy ?? 'id'}_${menuConfig.dir ?? 'desc'}`
    if (sortKey === 'rating_desc') return 'rating'
    if (sortKey === 'price_asc') return 'price_asc'
    if (sortKey === 'price_desc') return 'price_desc'
    return 'default'
  }, [menuConfig.sortBy, menuConfig.dir])
  const currentPage = menuConfig.page ?? 1

  const { data: menuPageData, isPending: menuLoading } = useQuery({
    queryKey: ['menu', menuConfig],
    queryFn: () =>
      menuApi.getMenu({
        ...menuConfig,
        page: currentPage,
        size: ITEMS_PER_PAGE,
        categoryId: selectedCategoryId
      }),
    select: (res) => res.data.data
  })

  const totalPages = menuPageData?.totalPages ?? 1
  const { page, setPage, nextPage, prevPage, canPrev, canNext, pages } = usePagination({
    page: currentPage,
    onPageChange: (nextPageValue) => updateMenuQueryParams({ page: String(nextPageValue) }),
    totalPages
  })

  const paginatedList: MenuResponse[] = useMemo(() => menuPageData?.data ?? [], [menuPageData])

  const handleCategoryChange = (cat: string) => {
    const nextCategoryId = cat === 'Tất cả' ? undefined : String(categories.find((c) => c.name === cat)?.id ?? '')
    updateMenuQueryParams({
      page: '1',
      categoryId: nextCategoryId
    })
  }

  if (categoriesLoading || menuLoading) {
    return (
      <div className='bg-background text-foreground flex min-h-screen items-center justify-center px-4'>
        <p className='text-muted-foreground'>Đang tải menu...</p>
      </div>
    )
  }

  return (
    <div className='bg-background text-foreground min-h-screen px-4 pt-10 pb-20 md:px-8'>
      {/* Header Page */}
      <div className='mx-auto mb-8 max-w-7xl text-center'>
        <p className='text-primary mb-2 text-sm font-bold tracking-widest uppercase'>• Đặt món ngay</p>
        <h1 className='mb-3 text-3xl font-bold md:text-4xl'>Khám phá thực đơn</h1>
        <p className='text-muted-foreground mx-auto max-w-2xl text-sm md:text-base'>
          Thưởng thức thế giới ẩm thực phong phú với các món ăn hấp dẫn, từ các món khai vị tươi ngon đến các món chính
          đặc sắc.
        </p>
      </div>

      <div className='mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-12'>
        <div className='lg:col-span-3'>
          <CategoryFilterAside
            categories={categories}
            isLoading={categoriesLoading}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
          />
        </div>

        <div className='lg:col-span-9'>
          <SortMenuFilter search={searchQuery} sortBy={sortBy} />

          {paginatedList.length > 0 ? (
            <>
              <div className='mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
                {paginatedList.map((menu) => (
                  <MenuCardItem key={`${menu.type.toLowerCase()}-${menu.id}`} menu={menu} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='mt-10'>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={(e) => {
                            e.preventDefault()
                            prevPage()
                          }}
                          className={!canPrev ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {pages.map((pageNumber) => (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            isActive={page === pageNumber}
                            onClick={(e) => {
                              e.preventDefault()
                              setPage(pageNumber)
                            }}
                            className='cursor-pointer'
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={(e) => {
                            e.preventDefault()
                            nextPage()
                          }}
                          className={!canNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className='bg-card/50 border-border rounded-xl border border-dashed py-20 text-center'>
              <p className='text-muted-foreground text-xl font-bold'>Không tìm thấy món ăn nào</p>
              <p className='text-muted-foreground mt-2 text-sm'>Vui lòng điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
              <button
                onClick={() => {
                  updateMenuQueryParams({
                    page: '1',
                    categoryId: undefined,
                    search: undefined,
                    sortBy: 'id',
                    dir: 'desc'
                  })
                }}
                className='text-primary mt-4 font-bold hover:underline'
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
