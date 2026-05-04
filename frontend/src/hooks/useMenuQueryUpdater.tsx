import { createSearchParams, useLocation, useNavigate } from 'react-router-dom'

export default function useMenuQueryUpdater() {
  const location = useLocation()
  const navigate = useNavigate()

  return (overrides: Record<string, string | undefined>) => {
    const currentParams = Object.fromEntries(new URLSearchParams(location.search))
    const nextParams = {
      ...currentParams,
      ...overrides
    }

    Object.keys(nextParams).forEach((key) => {
      if (!nextParams[key]) {
        delete nextParams[key]
      }
    })

    navigate({
      pathname: location.pathname,
      search: createSearchParams(nextParams as Record<string, string>).toString()
    })
  }
}
