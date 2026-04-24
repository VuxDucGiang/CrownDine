import { RESTAURANT_CONFIG } from '@/pages/Reservation/data'
import { formatCurrency } from '@/utils/utils'
import { UtensilsCrossed, Loader2, Info, User, Calendar, Clock, PhoneCall } from 'lucide-react'
import type { ReservationCheckoutResponse } from '@/types/reservation.type'
import { toast } from 'react-toastify'
import type { ReservationTable as Table } from '@/types/reservation.type'
import CountdownTimer from '@/pages/Reservation/components/CountdownTimer'
import type { UserSummary } from '@/types/profile.type'
import type { VoucherValidateResponse } from '@/types/voucher.type'
import VoucherInput from '@/pages/Reservation/components/VoucherInput'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image?: string
  description?: string
  note?: string
}

interface Props {
  user: UserSummary | null
  bookingData: {
    date: string
    startTime: string
    plannedEndTime: string
    guests: number
    selectedTable: Table | null
  }
  cartItems: CartItem[]
  onPay: () => void
  onCancel: () => void
  isProcessing: boolean
  checkoutSummary: ReservationCheckoutResponse | null
  isLoadingOrderDetails: boolean
  expiratedAt: string | null
  voucherPreview: VoucherValidateResponse | null
  onVoucherPreviewChange: (preview: VoucherValidateResponse | null) => void
}

const Step4Payment = ({
  user,
  bookingData,
  cartItems,
  onPay,
  onCancel,
  isProcessing,
  checkoutSummary,
  isLoadingOrderDetails,
  expiratedAt,
  voucherPreview,
  onVoucherPreviewChange
}: Props) => {
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Khách'
  const phone = user?.phone ?? ''
  const email = user?.email ?? ''
  const foodTotal = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0)

  // Sử dụng dữ liệu từ API nếu có, nếu không thì tính từ local state
  const itemsTotal = checkoutSummary?.itemsTotal ?? foodTotal
  const tableDeposit = checkoutSummary?.tableDeposit ?? RESTAURANT_CONFIG.depositAmount
  const previewFinalAmount = voucherPreview?.finalAmount ?? itemsTotal

  // Tính depositAmount: nếu có checkout summary thì dùng từ API, nếu không thì tính = 20% món + cọc bàn
  const depositAmount = checkoutSummary?.depositAmount ?? itemsTotal * 0.2 + tableDeposit
  const discountedFoodDeposit = previewFinalAmount * 0.2

  const discountedPayableNow =
    voucherPreview && depositAmount > 0 ? Math.max(0, discountedFoodDeposit + tableDeposit) : depositAmount

  if (isLoadingOrderDetails) {
    return (
      <div className='min-100 flex items-center justify-center p-12'>
        <div className='flex flex-col items-center gap-4 text-gray-400'>
          <Loader2 className='h-6 w-6 animate-spin' />
          <p className='text-sm'>Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='animate-fade-in space-y-4 pt-1'>
      {/* Expiry Alert Bar - More Compact */}
      {expiratedAt && (
        <div className='rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-2 shadow-sm'>
          <div className='flex flex-col items-center justify-between gap-2 sm:flex-row'>
            <div className='flex items-center gap-2'>
              <Info size={14} className='text-orange-500' />
              <span className='text-[11px] font-semibold text-orange-700 dark:text-orange-300'>Vui lòng hoàn tất giao dịch để giữ bàn thành công.</span>
            </div>
            <div className='flex items-center gap-1.5 rounded-md bg-background/90 px-2 py-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 shadow-xs'>
                <Clock size={12} />
                <CountdownTimer
                    expiratedAt={expiratedAt}
                    onExpire={() => {
                        toast.error('Hết phiên giao dịch! Vui lòng đặt lại.')
                        window.location.reload()
                    }}
                />
            </div>
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
        {/* Left Side: Forms and Menu (8/12) */}
        <div className='space-y-4 lg:col-span-8'>
          
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* Customer Info Section - More Compact */}
            <section className='overflow-hidden rounded-xl border border-border bg-card shadow-sm'>
                <div className='flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3'>
                    <User size={16} className='text-orange-500' />
                    <h3 className='text-xs font-bold text-foreground uppercase tracking-tight'>Thông tin liên hệ</h3>
                </div>
                <div className='space-y-3 p-5'>
                    <div className='flex items-center justify-between'>
                        <span className='text-[9px] font-bold text-muted-foreground uppercase tracking-widest'>Tên khách</span>
                        <span className='text-xs font-semibold text-foreground'>{fullName}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                        <span className='text-[9px] font-bold text-muted-foreground uppercase tracking-widest'>Số điện thoại</span>
                        <span className='text-xs font-semibold text-foreground'>{phone}</span>
                    </div>
                    <div className='flex items-center justify-between gap-4'>
                        <span className='text-[9px] font-bold text-muted-foreground uppercase tracking-widest shrink-0'>Email</span>
                        <span className='text-xs font-semibold text-foreground truncate'>{email}</span>
                    </div>
                </div>
            </section>

            {/* Table Details Section - More Compact */}
            <section className='overflow-hidden rounded-xl border border-border bg-card shadow-sm'>
                <div className='flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3'>
                    <Calendar size={16} className='text-orange-500' />
                    <h3 className='text-xs font-bold text-foreground uppercase tracking-tight'>Chi tiết đặt bàn</h3>
                </div>
                <div className='space-y-3 p-5'>
                    <div className='flex items-center justify-between'>
                        <span className='text-[9px] font-bold text-muted-foreground uppercase tracking-widest'>Ngày hẹn</span>
                        <span className='text-xs font-semibold text-foreground'>{bookingData.date}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                        <span className='text-[9px] font-bold text-muted-foreground uppercase tracking-widest'>Thời gian</span>
                        <span className='text-xs font-semibold text-foreground'>{bookingData.startTime} - {bookingData.plannedEndTime}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                        <span className='text-[9px] font-bold text-muted-foreground uppercase tracking-widest'>Bàn / Chỗ</span>
                        <span className='text-xs font-semibold text-foreground'>
                            {bookingData.selectedTable?.name ?? '—'}
                            {bookingData.selectedTable?.floorName ? ` (${bookingData.selectedTable.floorName})` : ''}
                        </span>
                    </div>
                </div>
            </section>
          </div>

          {/* Menu Items - Reduced sizes */}
          <section className='space-y-3'>
            <div className='flex items-center gap-2 px-1'>
              <UtensilsCrossed size={16} className='text-orange-500' />
              <h3 className='text-sm font-bold text-foreground'>Danh sách món đã đặt</h3>
            </div>
            
            <div className='grid grid-cols-1 gap-3'>
              {cartItems.length > 0 ? (
                cartItems.map((item) => (
                  <div key={`${item.id}-${item.name}`} className='group flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 shadow-xs transition-all hover:border-orange-200 dark:hover:border-orange-500/30'>
                    <div className='h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted border border-border'>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className='h-full w-full object-cover transition-transform group-hover:scale-105' />
                      ) : (
                        <div className='flex h-full w-full items-center justify-center text-muted-foreground/30'>
                          <UtensilsCrossed size={18} />
                        </div>
                      )}
                    </div>
                    <div className='flex flex-1 flex-col justify-center min-w-0'>
                      <h4 className='text-xs font-bold text-foreground truncate'>{item.name}</h4>
                      {item.note ? (
                        <p className='mt-0.5 text-[10px] italic text-orange-500 line-clamp-1'>“{item.note}”</p>
                      ) : (
                        <p className='mt-0.5 text-[10px] text-muted-foreground line-clamp-1 italic'>{item.description || 'Deluxe Dining Signature'}</p>
                      )}
                    </div>
                    <div className='flex flex-col items-end gap-0.5 px-3 border-l border-border flex-shrink-0'>
                      <span className='text-[9px] font-black text-muted-foreground/70 uppercase'>x{item.quantity}</span>
                      <span className='text-xs font-bold text-foreground whitespace-nowrap'>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-10 mt-2'>
                  <UtensilsCrossed size={32} className='mb-3 text-muted-foreground/30' />
                  <p className='text-xs font-semibold text-muted-foreground'>Không có món ăn trong đơn hàng</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Side: Sidebar - Reduced sizes and padding */}
        <aside className='lg:col-span-4'>
          <div className='sticky top-4 flex flex-col gap-4'>
            <div className='rounded-2xl border border-border bg-card p-5 shadow-lg'>
                <h3 className='mb-4 text-sm font-black text-foreground uppercase tracking-wider'>Tóm tắt thanh toán</h3>
                
                <div className='space-y-3 border-b border-border pb-5 text-xs'>
                    <div className='flex justify-between text-muted-foreground font-small'>
                        <span>Số lượng ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} món)</span>
                        <span className='font-bold text-foreground'>{formatCurrency(itemsTotal)}</span>
                    </div>
                    
                    {voucherPreview && (
                        <div className='flex justify-between items-center'>
                            <span className='font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded'>Voucher tiết kiệm</span>
                            <span className='font-black text-emerald-600 dark:text-emerald-400'>-{formatCurrency(voucherPreview.discountAmount)}</span>
                        </div>
                    )}
                    
                    <div className='flex items-baseline justify-between pt-2 border-t border-border'>
                        <span className='text-xs font-bold text-foreground uppercase'>Tổng tiền món</span>
                        <span className='text-xl font-black text-orange-600'>{formatCurrency(previewFinalAmount)}</span>
                    </div>
                </div>

                <div className='py-4'>
                    <VoucherInput
                        orderId={checkoutSummary?.orderId ?? undefined}
                        disabled={isProcessing}
                        onPreviewChange={onVoucherPreviewChange}
                    />
                </div>

                <div className='space-y-3 rounded-2xl bg-orange-500/10 p-4 border border-orange-500/20 shadow-sm'>
                    <div className='flex items-center gap-1.5 text-[9px] font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest'>
                        <Info size={12} className='text-orange-500' />
                        Quy định đặt cọc
                    </div>
                    <p className='text-[10px] leading-relaxed text-muted-foreground font-semibold'>
                        Khu vực của bạn được xác nhận ngay khi bạn thanh toán tiền cọc tối thiểu.
                    </p>
                    <div className='flex items-center justify-between pt-3 border-t border-orange-500/20'>
                        <span className='text-[9px] font-black text-orange-700 dark:text-orange-300'>CỌC CẦN TRẢ:</span>
                        <span className='text-lg font-black text-orange-600 dark:text-orange-500'>{formatCurrency(discountedPayableNow)}</span>
                    </div>
                </div>

                <div className='mt-6 space-y-3 font-sans'>
                    <button
                        onClick={onPay}
                        disabled={isProcessing}
                        className='w-full rounded-xl bg-foreground py-3.5 text-xs font-black text-background hover:opacity-90 active:scale-[0.98] disabled:opacity-70 shadow-sm transition-all'
                    >
                        {isProcessing ? (
                            <span className='flex items-center justify-center gap-2'>
                                <Loader2 className='h-4 w-4 animate-spin' /> Đang xử lý...
                            </span>
                        ) : (
                            'Xác nhận & Thanh toán'
                        )}
                    </button>
                    
                    <button
                        onClick={onCancel}
                        disabled={isProcessing}
                        className='w-full rounded-xl bg-red-500 py-3.5 text-xs font-black text-white hover:bg-red-600 active:scale-[0.98] disabled:opacity-70 shadow-sm transition-all'
                    >
                        Huỷ quy trình đặt bàn
                    </button>
                </div>
            </div>

            {/* Compact Support */}
            <div className='rounded-xl bg-card border border-border p-3.5 flex items-center gap-3 shadow-sm'>
                <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600'>
                    <PhoneCall size={18} />
                </div>
                <div>
                    <p className='text-[9px] font-bold text-muted-foreground uppercase tracking-widest'>Hỗ trợ đặt bàn</p>
                    <p className='text-sm font-black text-foreground'>1900 8888</p>
                </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Step4Payment
