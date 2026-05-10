import { useMutation, useQueryClient } from '@tanstack/react-query'
import http from '@/utils/http'
import type { ApiResponse } from '@/types/utils.type'
import { toast } from 'sonner'

export const useDeleteStaff = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => http.delete<ApiResponse<null>>(`/admin/staff/${id}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['staffs'] })
      toast.success(res.data?.message || 'Xóa nhân viên thành công')
    }
  })
}
