import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import path from '@/constants/path'

export default function Forbidden() {
  return (
    <div className='flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center'>
      <div className='bg-destructive/10 text-destructive flex h-16 w-16 items-center justify-center rounded-full'>
        <ShieldAlert className='h-8 w-8' />
      </div>
      <p className='text-destructive text-5xl font-black'>403</p>
      <h1 className='text-2xl font-bold text-gray-900'>Bạn không có quyền truy cập</h1>
      <p className='text-muted-foreground max-w-md text-sm'>
        Tài khoản hiện tại không có quyền truy cập tài nguyên này. Vui lòng liên hệ quản trị viên nếu bạn nghĩ đây là
        nhầm lẫn.
      </p>
      <Link to={path.home}>
        <Button className='mt-2'>Quay về trang chủ</Button>
      </Link>
    </div>
  )
}
