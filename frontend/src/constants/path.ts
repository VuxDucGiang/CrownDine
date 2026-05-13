const path = {
  home: '/',
  login: '/login',
  register: '/register',
  verifyRegister: '/verify-register',
  forbidden: '/access-denied',
  menu: '/menu',
  profile: '/profile',
  profileInfo: '/profile/info',
  profileReservations: '/profile/reservations',
  profileFavorites: '/profile/favorites',
  profileRewardPoints: '/profile/reward-points',
  profileVouchers: '/profile/vouchers',
  profileSecurity: '/profile/security',
  reservation: '/reservation',
  paymentSuccess: '/thanh-toan/thanh-cong',
  paymentFailure: '/thanh-toan/that-bai',
  dashboard: '/admin/dashboard',
  chat: '/chat'
} as const
export default path
