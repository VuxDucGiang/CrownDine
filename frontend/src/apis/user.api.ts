import http from '@/utils/http'
import type { ApiResponse } from '@/types/utils.type'
import type { UpdateUserRequest, User, PointHistory, ChangePasswordRequest } from '@/types/profile.type'
import type { PageResponse } from '@/types/utils.type'
import type { MyVoucherResponse } from '@/types/voucher.type'

type UserProfileResponse = User & { avatarUrl?: string }

const userApi = {
  getPointHistory(page: number = 1, size: number = 5) {
    return http.get<ApiResponse<PageResponse<PointHistory>>>(`users/profile/point-history`, {
      params: { page, size }
    })
  },
  getProfile() {
    return http.get<ApiResponse<UserProfileResponse>>('users/profile', {}).then((res) => {
      if (res.data?.data && res.data.data.avatarUrl) {
        res.data.data.avatar = res.data.data.avatarUrl
      }
      return res
    })
  },
  updateProfile(data: UpdateUserRequest) {
    return http.put<ApiResponse<User>>('users', data)
  },
  uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('image', file)
    return http.patch<ApiResponse<string>>('users/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  getCustomerByPhone(phone: string) {
    return http.get<ApiResponse<User>>(`users/customer/${phone}`)
  },
  getAllCustomers() {
    return http.get<ApiResponse<User[]>>('users')
  },
  getAvailableVouchers(customerId: number) {
    return http.get<ApiResponse<MyVoucherResponse[]>>(`user-vouchers/customer/${customerId}`)
  },
  changePassword(data: ChangePasswordRequest) {
    return http.post<ApiResponse<null>>('users/change-password', data)
  },
  sendEmailOtp(newEmail: string) {
    return http.post<ApiResponse<null>>('users/profile/email-otp/send', { newEmail })
  },
  verifyEmailOtp(data: { otp: string; newEmail: string }) {
    return http.post<ApiResponse<null>>('users/profile/email-otp/verify', data)
  }
}

export default userApi
