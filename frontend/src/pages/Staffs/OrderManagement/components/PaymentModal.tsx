import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Banknote, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import orderApi from '@/apis/order.api'
import userApi from '@/apis/user.api'
import type { Order } from '@/types/order.type'
import { useMutation, useQuery } from '@tanstack/react-query'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
  onSuccess: () => void
}

export default function PaymentModal({ isOpen, onClose, order, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<'CASH' | 'PAYOS' | null>(null)
  const [phone, setPhone] = useState('')
  const [voucherCode, setVoucherCode] = useState('')
  const [foundCustomer, setFoundCustomer] = useState<any>(null)
  const [customerVouchers, setCustomerVouchers] = useState<any[]>([])
  const [manualDiscount, setManualDiscount] = useState<number>(order?.manualDiscountValue || 0)
  const [discountType, setDiscountType] = useState<'PERCENT' | 'AMOUNT'>(order?.isManualDiscountPercentage ? 'PERCENT' : 'AMOUNT')

  const { data: checkoutData, isFetching: isCheckoutFetching, refetch: refetchCheckout } = useQuery({
    queryKey: ['order-checkout', order?.id],
    queryFn: async () => {
      if (!order?.id) throw new Error('Không tìm thấy đơn hàng')
      const res = await orderApi.getOrderCheckout(order.id)
      return res.data.data
    },
    enabled: isOpen && Boolean(order?.id)
  })

  const formatCurrency = (value?: number) => {
    return new Intl.NumberFormat('vi-VN').format(value ?? 0) + ' VND'
  }

  const lookupCustomerMutation = useMutation({
    mutationFn: async (phoneNum: string) => {
      const res = await userApi.getCustomerByPhone(phoneNum)
      const data = res.data?.data
      if (!data || !data.id) throw new Error('Không tìm thấy khách hàng')

      let vouchers: any[] = []
      if (order?.id) {
        await orderApi.mapCustomerToOrder(order.id, data.id)
        const vouchersRes = await userApi.getAvailableVouchers(data.id)
        vouchers = vouchersRes.data?.data || []
      }
      return { customer: data, vouchers }
    },
    onSuccess: (data) => {
      setFoundCustomer(data.customer)
      setCustomerVouchers(data.vouchers)
      toast.success(`Tìm thấy khách hàng: ${data.customer.firstName} ${data.customer.lastName}`)
    },
    onError: (err: any) => {
      setFoundCustomer(null)
      setCustomerVouchers([])
      toast.error('Lỗi khi tra cứu: ' + (err.response?.data?.message || err.message))
    }
  })

  const applyVoucherMutation = useMutation({
    mutationFn: (code: string) => {
      if (!order) throw new Error('Không tìm thấy thông tin đơn hàng.')
      return orderApi.applyVoucher(order.id, code)
    },
    onSuccess: () => {
      toast.success('Áp dụng voucher thành công!')
      refetchCheckout()
      onSuccess()
    },
    onError: (err: any) => {
      toast.error('Lỗi áp dụng voucher: ' + (err.response?.data?.message || err.message))
    }
  })

  const handleLookupPhone = () => {
    if (!phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại')
      return
    }
    lookupCustomerMutation.mutate(phone.trim())
  }

  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) {
      toast.error('Vui lòng nhập mã voucher')
      return
    }
    applyVoucherMutation.mutate(voucherCode.trim())
  }


  const paymentMutation = useMutation({
    mutationFn: (paymentMethod: 'CASH' | 'PAYOS') => {
      if (!order) throw new Error('Không tìm thấy thông tin đơn hàng.')
      return orderApi.createPaymentLink({
        orderCode: order.code,
        method: paymentMethod
      })
    },
    onSuccess: (res, variables) => {
      if (variables === 'CASH') {
        toast.success('Thanh toán tiền mặt thành công!')
        onSuccess()
        onClose()
      } else if (variables === 'PAYOS') {
        if (res.data?.data) {
          window.open(res.data.data, '_blank')
          toast.info('Đang chuyển hướng sang cổng thanh toán...')
          onSuccess()
          onClose()
        }
      }
    },
    onError: (err: any) => {
      toast.error('Lỗi thanh toán: ' + err.message)
    }
  })

  const handlePay = async (paymentMethod: 'CASH' | 'PAYOS') => {
    if (isCheckoutFetching) {
      toast.info('Đang tải thông tin checkout, vui lòng chờ...')
      return
    }

    try {
      // Always sync manual discount to backend before payment
       await orderApi.applyManualDiscount(order!.id, {
          discountValue: manualDiscount || 0,
          isPercentage: discountType === 'PERCENT'
       })
       
       setMethod(paymentMethod)
       paymentMutation.mutate(paymentMethod)
    } catch (error: any) {
       toast.error('Lỗi khi cập nhật giảm giá: ' + (error.response?.data?.message || error.message))
    }
  }

  // Local calculation for instant UI update
  const totalAmount = checkoutData?.totalAmount || 0
  const voucherDiscount = checkoutData?.voucherDiscount || 0
  const depositAdjusted = checkoutData?.orderDepositPaidAmount || 0
  
  const currentManualDiscountAmount = discountType === 'PERCENT'
    ? (totalAmount * (manualDiscount || 0)) / 100
    : (manualDiscount || 0)

  const computedFinalAmount = Math.max(0, totalAmount - voucherDiscount - currentManualDiscountAmount - depositAdjusted)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Thanh toán đơn #${order?.code || ''}`}>
      <div className='flex flex-col gap-4'>
        <p className='text-muted-foreground mb-2 text-center text-sm'>
          Vui lòng chọn phương thức thanh toán cho đơn hàng này.
        </p>
        <div className='bg-muted/50 mb-2 rounded-md p-4'>
          {isCheckoutFetching ? (
            <p className='text-sm text-muted-foreground'>Đang tải thông tin checkout...</p>
          ) : (
            <div className='space-y-2 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Tổng tiền món</span>
                <span className='font-semibold'>{formatCurrency(totalAmount)}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground font-medium'>Voucher giảm</span>
                <span className='font-semibold'>- {formatCurrency(voucherDiscount)}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-primary font-bold'>Staff giảm</span>
                <span className='font-bold text-primary'>- {formatCurrency(currentManualDiscountAmount)}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Đã cọc (trừ vào đơn)</span>
                <span className='font-semibold text-green-700'>- {formatCurrency(depositAdjusted)}</span>
              </div>
              <div className='border-border mt-2 flex items-center justify-between border-t pt-2'>
                <span className='text-base font-black'>KHÁCH CẦN TRẢ</span>
                <span className='text-primary text-xl font-black transition-all'>{formatCurrency(computedFinalAmount)}</span>
              </div>
            </div>
          )}
        </div>
        <div className='bg-muted/50 mb-2 flex flex-col gap-3 rounded-md p-4'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-sm font-medium'>Số điện thoại khách (tùy chọn)</label>
            <div className='flex gap-2'>
              <Input
                placeholder='Nhập số điện thoại để tra cứu...'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Button
                type='button'
                variant='secondary'
                onClick={handleLookupPhone}
                disabled={lookupCustomerMutation.isPending}
              >
                Tra cứu
              </Button>
            </div>
            {foundCustomer && (
              <div className='mt-1 flex items-center text-sm text-green-600'>
                <span className='font-medium'>
                  {foundCustomer.firstName} {foundCustomer.lastName}
                </span>
                <span className='ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700'>
                  Khách hàng thành viên
                </span>
              </div>
            )}
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-sm font-medium'>Mã Voucher (tùy chọn)</label>
            <div className='flex gap-2'>
              <Input
                placeholder='Nhập mã voucher...'
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
              />
              <Button
                type='button'
                variant='secondary'
                onClick={handleApplyVoucher}
                disabled={applyVoucherMutation.isPending}
              >
                Áp dụng
              </Button>
            </div>
            {customerVouchers.length > 0 && (
              <div className='mt-2'>
                <p className='text-muted-foreground mb-1 text-xs font-medium'>
                  Voucher của khách ({customerVouchers.length}):
                </p>
                <div className='flex flex-wrap gap-2'>
                  {customerVouchers.map((v) => (
                    <div
                      key={v.assignmentId}
                      className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs sm:text-sm ${voucherCode === v.voucherCode ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:bg-muted'}`}
                      onClick={() => setVoucherCode(v.voucherCode)}
                    >
                      <div className='font-semibold'>{v.voucherCode}</div>
                      <div className='max-w-[150px] truncate text-[10px] sm:text-xs'>
                        {v.voucherName || v.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {foundCustomer && customerVouchers.length === 0 && (
              <p className='text-muted-foreground mt-1 text-xs italic'>Khách không có voucher nào chưa sử dụng.</p>
            )}
          </div>

          <div className='flex flex-col gap-1.5 border-t border-border pt-3 mt-1'>
            <label className='text-sm font-bold text-primary flex items-center gap-2'>
               <span>Giảm giá trực tiếp (Staff)</span>
            </label>
            <div className='flex gap-2 items-center'>
               <div className='flex-1 relative'>
                  <Input
                    type='number'
                    min={0}
                    placeholder='Nhập mức giảm...'
                    value={manualDiscount === 0 ? '' : manualDiscount}
                    onChange={(e) => setManualDiscount(Math.max(0, Number(e.target.value)))}
                    className='pr-16 h-11 text-base font-bold text-primary'
                  />
                  <div className='absolute right-1 top-1 bottom-1 flex gap-0.5 bg-muted rounded-md border p-0.5'>
                     <button 
                        onClick={() => setDiscountType('AMOUNT')}
                        className={`px-3 text-[11px] font-black rounded transition-all ${discountType === 'AMOUNT' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                     >
                        đ
                     </button>
                     <button 
                        onClick={() => setDiscountType('PERCENT')}
                        className={`px-3 text-[11px] font-black rounded transition-all ${discountType === 'PERCENT' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                     >
                        %
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <Button
            variant='outline'
            className={`flex h-24 flex-col gap-2 border-2 transition-all ${method === 'CASH' && paymentMutation.isPending ? 'border-primary bg-primary/5' : 'hover:border-primary hover:bg-primary/5'}`}
            onClick={() => handlePay('CASH')}
            disabled={paymentMutation.isPending || isCheckoutFetching}
          >
            <Banknote className='h-8 w-8 text-green-600' />
            <span className='font-semibold'>Tiền mặt</span>
          </Button>
          <Button
            variant='outline'
            className={`flex h-24 flex-col gap-2 border-2 transition-all ${method === 'PAYOS' && paymentMutation.isPending ? 'border-primary bg-primary/5' : 'hover:border-primary hover:bg-primary/5'}`}
            onClick={() => handlePay('PAYOS')}
            disabled={paymentMutation.isPending || isCheckoutFetching}
          >
            <QrCode className='h-8 w-8 text-blue-600' />
            <span className='font-semibold'>Chuyển khoản (PayOS)</span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}
