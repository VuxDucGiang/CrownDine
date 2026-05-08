import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Check, X, User, Phone, Calendar, Clock, Users, Hash, FileText, ShoppingBag } from 'lucide-react'
import type { StaffReservationResponse } from '@/types/reservation.type'
import { formatCurrency } from '@/utils/utils'
import clsx from 'clsx'

interface ReservationDetailModalProps {
  isOpen: boolean
  onClose: () => void
  reservation: StaffReservationResponse | null
  onCheckIn: (res: StaffReservationResponse) => void
  onCancel: (id: number) => void
  isMutating: boolean
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã nhận bàn',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
  NO_SHOW: 'Không đến'
}

export default function ReservationDetailModal({
  isOpen,
  onClose,
  reservation,
  onCheckIn,
  onCancel,
  isMutating
}: ReservationDetailModalProps) {
  if (!reservation) return null

  const canCheckIn = reservation.status === 'CONFIRMED'
  const canCancel = ['PENDING', 'CONFIRMED'].includes(reservation.status)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Chi tiết đặt bàn' maxWidth='max-w-2xl'>
      <div className='space-y-8 py-2'>
        {/* Reservation Header Info */}
        <div className='flex items-start justify-between border-b border-slate-100 pb-6'>
          <div className='space-y-1'>
            <h3 className='text-2xl font-black text-[#003C71]'>#{reservation.code?.substring(0, 8).toUpperCase()}</h3>
            <div className='flex items-center gap-2'>
              <div
                className={clsx(
                  'h-2 w-2 rounded-full ring-2 ring-offset-1',
                  reservation.status === 'PENDING'
                    ? 'bg-yellow-500 ring-yellow-400/30'
                    : reservation.status === 'CONFIRMED'
                      ? 'bg-blue-500 ring-blue-400/30'
                      : reservation.status === 'CHECKED_IN'
                        ? 'bg-emerald-500 ring-emerald-400/30'
                        : reservation.status === 'CANCELLED'
                          ? 'bg-red-500 ring-red-400/30'
                          : 'bg-slate-400 ring-slate-300/30'
                )}
              ></div>
              <span className='text-xs font-black tracking-widest text-slate-500 uppercase'>
                {STATUS_LABELS[reservation.status] || reservation.status}
              </span>
            </div>
          </div>

          <div className='text-right'>
            <div className='mb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase'>Số khách</div>
            <div className='flex items-center justify-end gap-1 text-xl font-bold text-slate-700'>
              <Users size={20} className='text-primary' /> {reservation.guestNumber}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className='grid grid-cols-2 gap-x-12 gap-y-8'>
          <div className='space-y-2'>
            <label className='flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase'>
              <User size={12} /> Khách hàng
            </label>
            <p className='font-bold text-slate-800'>{reservation.customerName}</p>
          </div>

          <div className='space-y-2'>
            <label className='flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase'>
              <Phone size={12} /> Số điện thoại
            </label>
            <p className='font-bold text-slate-800'>{reservation.phone || 'N/A'}</p>
          </div>

          <div className='space-y-2'>
            <label className='flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase'>
              <Calendar size={12} /> Ngày đến
            </label>
            <p className='font-bold text-slate-800'>{reservation.date}</p>
          </div>

          <div className='space-y-2'>
            <label className='flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase'>
              <Clock size={12} /> Thời gian
            </label>
            <p className='font-bold text-slate-800'>
              {reservation.startTime?.substring(0, 5)} - {reservation.endTime?.substring(0, 5)}
            </p>
          </div>

          <div className='space-y-2'>
            <label className='flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase'>
              <Hash size={12} /> Bàn phục vụ
            </label>
            <p className='text-primary font-black'>{reservation.tableName || 'CHƯA XẾP BÀN'}</p>
          </div>

          <div className='col-span-2 space-y-2'>
            <label className='flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase'>
              <FileText size={12} /> Ghi chú khách hàng
            </label>
            <p className='min-h-[60px] rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600 italic'>
              {reservation.note || 'Không có ghi chú nào.'}
            </p>
          </div>
        </div>

        {/* Pre-ordered Items */}
        {reservation.orderDetails && reservation.orderDetails.length > 0 && (
          <div className='space-y-4 border-t border-slate-100 pt-4'>
            <h4 className='flex items-center gap-2 text-[11px] font-black tracking-widest text-slate-400 uppercase'>
              <ShoppingBag size={14} className='text-primary' /> Món ăn đặt trước
            </h4>
            <div className='divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50'>
              {reservation.orderDetails.map((orderDetail: any, idx: number) => {
                const name = orderDetail.item?.name || orderDetail.combo?.name || 'Món không tên'
                const unitPrice = orderDetail.item?.price || orderDetail.combo?.price || 0

                return (
                  <div key={idx} className='flex items-center justify-between p-4'>
                    <div className='flex items-center gap-3'>
                      <span className='flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-[10px] font-bold text-slate-500'>
                        {orderDetail.quantity}x
                      </span>
                      <span className='text-sm font-bold text-slate-700'>{name}</span>
                    </div>
                    <span className='text-primary text-sm font-black'>{formatCurrency(unitPrice)}</span>
                  </div>
                )
              })}
              <div className='bg-primary/5 flex items-center justify-between p-4'>
                <span className='text-[10px] font-black tracking-widest text-slate-500 uppercase'>Tạm tính món ăn</span>
                <span className='text-primary text-lg font-black'>
                  {formatCurrency(
                    reservation.orderDetails.reduce((acc: number, i: any) => {
                      const price = i.item?.price || i.combo?.price || 0
                      return acc + price * i.quantity
                    }, 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800'>
          <p className='mb-1 text-[10px] font-bold tracking-wider uppercase'>Lưu ý check-in</p>
          <p>
            Chỉ được check-in trong khoảng <strong>15 phút trước</strong> đến <strong>15 phút sau</strong> thời điểm hẹn
            đặt bàn. Quá 15 phút sau giờ hẹn, bàn có thể được giải phóng để phục vụ khách khác.
          </p>
        </div>

        {/* Actions */}
        <div className='flex gap-4 pt-6'>
          {canCancel && (
            <Button
              variant='outline'
              onClick={() => onCancel(reservation.id)}
              disabled={isMutating}
              className='h-12 flex-1 gap-2 rounded-xl border-red-200 text-xs font-bold tracking-widest text-red-500 uppercase hover:bg-red-50'
            >
              <X size={16} /> Huỷ đặt bàn
            </Button>
          )}
          {canCheckIn && (
            <Button
              onClick={() => onCheckIn(reservation)}
              disabled={isMutating}
              className='h-12 flex-1 gap-2 rounded-xl bg-emerald-600 text-xs font-bold tracking-widest uppercase shadow-lg shadow-emerald-200 hover:bg-emerald-700'
            >
              <Check size={16} /> Check-in Nhận bàn
            </Button>
          )}
          {!canCheckIn && !canCancel && (
            <Button
              onClick={onClose}
              className='h-12 w-full rounded-xl bg-slate-100 text-xs font-bold tracking-widest text-slate-600 uppercase hover:bg-slate-200'
            >
              Đóng
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
