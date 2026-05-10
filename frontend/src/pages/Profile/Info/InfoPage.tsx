import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { EGender } from '@/types/profile.type'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MembershipBenefits from '@/pages/Profile/Info/MembershipBenefits'
import useUpdateProfile from '@/hooks/useUpdateProfile'
import type { ProfileOutletContext } from '@/pages/Profile/profileContext'

type GenderOption = 'male' | 'female' | 'other'

const toGenderOption = (gender?: EGender): GenderOption => {
  if (gender === EGender.MALE) return 'male'
  if (gender === EGender.FEMALE) return 'female'
  return 'other'
}

const toEGender = (gender: GenderOption): EGender => {
  if (gender === 'male') return EGender.MALE
  if (gender === 'female') return EGender.FEMALE
  return EGender.OTHER
}

export default function InfoPage() {
  const { user, setUser } = useOutletContext<ProfileOutletContext>()
  const [isEditing, setIsEditing] = useState(false)
  const formatBackendDate = (dateStr?: string) => {
    if (!dateStr) return ''
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/')
      return `${year}-${month}-${day}`
    }
    return dateStr
  }

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'other' as GenderOption
  })

  const startEditing = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      dateOfBirth: formatBackendDate(user.dateOfBirth),
      gender: toGenderOption(user.gender)
    })
    setIsEditing(true)
  }

  const updateProfileMutation = useUpdateProfile()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    let formattedDate = formData.dateOfBirth
    if (formattedDate && formattedDate.includes('-')) {
      const [year, month, day] = formattedDate.split('-')
      formattedDate = `${day}/${month}/${year}`
    }

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formattedDate,
      gender: toEGender(formData.gender)
    }

    updateProfileMutation.mutate(payload, {
      onSuccess: () => {
        setUser((prev) => ({
          ...prev,
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formattedDate,
          gender: payload.gender
        }))
        setIsEditing(false)
      }
    })
  }

  return (
    <div className='bg-card border-border rounded-lg border p-8'>
      {/* Header */}
      <div className='mb-8 flex items-center justify-between'>
        <h2 className='text-2xl font-bold'>Thông Tin Của Tôi</h2>
        {!isEditing && (
          <Button onClick={startEditing} className='bg-primary hover:bg-primary/90 text-white'>
            Chỉnh Sửa Hồ Sơ
          </Button>
        )}
      </div>

      {/* Form Grid */}
      <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2'>
        {/* First Name */}
        <div>
          <Label htmlFor='firstName' className='text-sm font-semibold'>
            Họ
          </Label>
          <Input
            id='firstName'
            name='firstName'
            value={isEditing ? formData.firstName : user.firstName || ''}
            onChange={handleChange}
            disabled={!isEditing}
            className='border-border disabled:bg-foreground/5 mt-2 rounded-lg border-2'
          />
        </div>

        {/* Last Name */}
        <div>
          <Label htmlFor='lastName' className='text-sm font-semibold'>
            Tên
          </Label>
          <Input
            id='lastName'
            name='lastName'
            value={isEditing ? formData.lastName : user.lastName || ''}
            onChange={handleChange}
            disabled={!isEditing}
            className='border-border disabled:bg-foreground/5 mt-2 rounded-lg border-2'
          />
        </div>
        {/* Date of Birth */}
        <div>
          <Label htmlFor='dateOfBirth' className='text-sm font-semibold'>
            Ngày Sinh
          </Label>
          <Input
            id='dateOfBirth'
            name='dateOfBirth'
            type='date'
            value={isEditing ? formData.dateOfBirth : formatBackendDate(user.dateOfBirth)}
            onChange={handleChange}
            disabled={!isEditing}
            className='border-border disabled:bg-foreground/5 mt-2 rounded-lg border-2'
          />
        </div>

        {/* Gender */}
        <div>
          <Label htmlFor='gender' className='text-sm font-semibold'>
            Giới Tính
          </Label>
          <select
            id='gender'
            name='gender'
            value={isEditing ? formData.gender : toGenderOption(user.gender)}
            /* 1. Sử dụng trực tiếp hàm handleChange của bạn */
            onChange={handleChange}
            disabled={!isEditing}
            /* 2. Style lại để giống với Input của Shadcn UI */
            className='border-border disabled:bg-foreground/5 bg-background focus:border-primary mt-2 block w-full rounded-lg border-2 p-2 text-sm transition-all focus:outline-none'
          >
            <option value='male'>Nam</option>
            <option value='female'>Nữ</option>
            <option value='other'>Khác</option>
          </select>
        </div>
      </div>

      {/* Member Since */}
      <div className='border-border/50 mb-8 grid grid-cols-1 gap-6 border-b pb-8 md:grid-cols-2'>
        <div>
          <Label className='text-foreground/70 text-sm font-semibold'>Thành Viên Từ</Label>
          <p className='text-foreground mt-2 font-medium'>
            {new Date(user.createdAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div>
          <Label className='text-foreground/70 text-sm font-semibold'>Cập Nhật Gần Đây</Label>
          <p className='text-foreground mt-2 font-medium'>
            {new Date(user.updatedAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className='flex gap-4'>
          <Button
            onClick={handleSave}
            disabled={updateProfileMutation.isPending}
            className='bg-primary hover:bg-primary/90 flex-1 text-white'
          >
            {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </Button>
          <Button
            onClick={() => {
              setIsEditing(false)
            }}
            variant='outline'
            className='border-foreground/20 flex-1 border-2'
          >
            Hủy
          </Button>
        </div>
      )}

      {/* Membership Benefits Section */}
      <MembershipBenefits user={user} />
    </div>
  )
}
