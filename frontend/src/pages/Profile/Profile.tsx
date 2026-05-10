import { useState } from 'react'
import { Navigate, Outlet, useSearchParams } from 'react-router-dom'
import { mockCurrentUser } from '@/lib/mock-user'
import ProfileSidebar from '@/components/ProfileSidebar/ProfileSidebar'
import { useAuthStore } from '@/stores/useAuthStore'
import type { User } from '@/types/profile.type'
import type { ProfileOutletContext } from '@/pages/Profile/profileContext'
import path from '@/constants/path'

const LEGACY_TAB_TO_PATH: Record<string, string> = {
  info: path.profileInfo,
  reservations: path.profileReservations,
  favorites: path.profileFavorites,
  'reward-points': path.profileRewardPoints,
  vouchers: path.profileVouchers,
  security: path.profileSecurity
}

export default function Profile() {
  const authUser = useAuthStore((state) => state.user)
  const [searchParams] = useSearchParams()
  const [user, setUser] = useState<User>(authUser || mockCurrentUser)

  const legacyTab = searchParams.get('tab')
  if (legacyTab && LEGACY_TAB_TO_PATH[legacyTab]) {
    return <Navigate to={LEGACY_TAB_TO_PATH[legacyTab]} replace />
  }

  return (
    <main className='bg-background min-h-screen py-12'>
      <div className='container mx-auto px-4'>
        <div className='mb-12'>
          <h1 className='mb-2 text-4xl font-bold'>Tài Khoản Của Tôi</h1>
          <p className='text-foreground/60'>Quản lý hồ sơ, lịch sử đặt bàn và bảo mật tài khoản</p>
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-4 md:gap-8'>
          <div className='md:col-span-1'>
            <ProfileSidebar user={user} />
          </div>

          <div className='md:col-span-3'>
            <Outlet context={{ user, setUser } satisfies ProfileOutletContext} />
          </div>
        </div>
      </div>
    </main>
  )
}
