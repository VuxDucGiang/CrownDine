import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className='flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center'>
      <p className='text-primary text-6xl font-black'>404</p>
      <h1 className='text-2xl font-bold text-gray-900'>Không tìm thấy trang</h1>
      <p className='text-muted-foreground max-w-md text-sm'>
        Đường dẫn bạn truy cập không tồn tại hoặc đã được thay đổi.
      </p>
      <Link to='/'>
        <Button className='mt-2'>Quay về trang chủ</Button>
      </Link>
    </div>
  )
}
