import { Clock3 } from 'lucide-react'
import { useEffect, useMemo, useSyncExternalStore } from 'react'

type Props = {
  expiratedAt: string | null // ISO string format
  onExpire: () => void
}

const CountdownTimer = ({ expiratedAt, onExpire }: Props) => {
  const now = useSyncExternalStore(
    (onStoreChange) => {
      if (!expiratedAt) return () => {}
      const timer = setInterval(onStoreChange, 1000)
      return () => clearInterval(timer)
    },
    () => Date.now(),
    () => Date.now()
  )

  const seconds = useMemo(() => {
    if (!expiratedAt) return 0
    const expiry = new Date(expiratedAt).getTime()
    return Math.max(0, Math.floor((expiry - now) / 1000))
  }, [expiratedAt, now])

  useEffect(() => {
    if (expiratedAt && seconds <= 0) onExpire()
  }, [expiratedAt, onExpire, seconds])

  const fmt = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  if (!expiratedAt || seconds <= 0) {
    return null
  }

  return (
    <div className='flex animate-pulse items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-red-600'>
      <Clock3 size={16} />
      <span className='text-sm font-bold'>Giữ bàn trong: {fmt(seconds)}</span>
    </div>
  )
}

export default CountdownTimer
