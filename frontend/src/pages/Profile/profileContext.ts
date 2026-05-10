import type React from 'react'
import type { User } from '@/types/profile.type'

export type ProfileOutletContext = {
  user: User
  setUser: React.Dispatch<React.SetStateAction<User>>
}
