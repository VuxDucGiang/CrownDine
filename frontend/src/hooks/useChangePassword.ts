import userApi from '@/apis/user.api'
import type { ChangePasswordRequest } from '@/types/profile.type'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => userApi.changePassword(data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!')
    }
  })
}

export default useChangePassword
