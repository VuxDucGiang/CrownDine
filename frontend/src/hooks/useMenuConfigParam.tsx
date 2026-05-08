import type { MenuParamsConfig, MenuSortBy, MenuType } from '@/types/menu.type'
import isUndefined from 'lodash/isUndefined'
import omitBy from 'lodash/omitBy'
import { useMemo } from 'react'
import useQueryParams from './useQueryParams'

const ALLOWED_TYPES: MenuType[] = ['ALL', 'ITEM', 'COMBO']
const ALLOWED_SORT: MenuSortBy[] = ['id', 'name', 'price', 'rating', 'soldCount']
const ALLOWED_DIR: Array<'asc' | 'desc'> = ['asc', 'desc']

export default function useMenuConfigParam() {
  const queryParams = useQueryParams()

  return useMemo(
    () =>
      omitBy(
        {
          page: queryParams.page ? Number(queryParams.page) : 1,
          size: queryParams.size ? Number(queryParams.size) : 12,
          categoryId: queryParams.categoryId ? Number(queryParams.categoryId) : undefined,
          search: queryParams.search,
          type: ALLOWED_TYPES.includes(queryParams.type as MenuType) ? queryParams.type : 'ALL',
          sortBy: ALLOWED_SORT.includes(queryParams.sortBy as MenuSortBy) ? queryParams.sortBy : 'id',
          dir: ALLOWED_DIR.includes(queryParams.dir as 'asc' | 'desc') ? queryParams.dir : 'desc'
        },
        isUndefined
      ) as MenuParamsConfig,
    [queryParams]
  )
}
