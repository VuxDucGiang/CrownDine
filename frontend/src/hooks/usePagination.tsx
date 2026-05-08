import { useMemo, useState } from 'react'

interface UsePaginationOptions {
  initialPage?: number
  totalPages?: number
  page?: number
  onPageChange?: (page: number) => void
}

export default function usePagination(options: UsePaginationOptions = {}) {
  const { initialPage = 1, totalPages = 1, page: controlledPage, onPageChange } = options
  const [internalPage, setInternalPage] = useState(initialPage)

  const page = controlledPage ?? internalPage

  const currentPage = Math.min(Math.max(1, page), totalPages > 0 ? totalPages : 1)
  const canPrev = currentPage > 1
  const canNext = currentPage < totalPages

  const pages = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages])

  const goToPage = (nextPage: number) => {
    if (nextPage < 1) return
    if (nextPage > totalPages) return
    if (onPageChange) onPageChange(nextPage)
    else setInternalPage(nextPage)
  }

  const nextPage = () => {
    if (canNext) goToPage(currentPage + 1)
  }

  const prevPage = () => {
    if (canPrev) goToPage(currentPage - 1)
  }

  const resetPage = () => goToPage(1)

  return {
    page: currentPage,
    setPage: goToPage,
    nextPage,
    prevPage,
    resetPage,
    canPrev,
    canNext,
    totalPages,
    pages
  }
}
