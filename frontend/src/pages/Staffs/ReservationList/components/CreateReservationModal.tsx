import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { User, Calendar, Users, Hash, Trash2, Plus, Minus, ChevronRight, ChevronLeft, ShoppingCart, Info } from 'lucide-react'
import { toast } from 'sonner'
import reservationApi from '@/apis/reservation.api'
import tableApi from '@/apis/table.api'
import { useMutation, useQuery } from '@tanstack/react-query'
import MenuSelector from '@/components/MenuSelector/MenuSelector'
import type { MenuCardItem } from '@/types/item.type'
import { formatCurrency, generateTimeSlots, isDateTimeInPast } from '@/utils/utils'
import clsx from 'clsx'

interface CreateReservationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: {
    tableId?: string | number
    startTime?: string
    date?: string
  }
}

interface CartItem {
  id: string | number
  type: 'item' | 'combo'
  name: string
  price: number
  originalPrice: number
  priceAfterDiscount: number | null
  quantity: number
  imageUrl: string
  note?: string
}

type ModalTab = 'INFO' | 'MENU'

export default function CreateReservationModal({ isOpen, onClose, onSuccess, initialData }: CreateReservationModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('INFO')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  
  const [formData, setFormData] = useState(() => {
    const d = new Date().toISOString().split('T')[0]
    const allSlots = generateTimeSlots(9, 22, 30).filter((slot) => slot !== '22:00')
    const nextValidTime = allSlots.find((slot) => !isDateTimeInPast(d, slot))
    
    return {
      date: d,
      startTime: nextValidTime || '',
      guestNumber: 2,
      tableId: '',
      note: ''
    }
  })

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(prev => ({
        ...prev,
        date: initialData.date || prev.date,
        startTime: initialData.startTime || prev.startTime,
        tableId: initialData.tableId?.toString() || prev.tableId
      }))
    }
  }, [isOpen, initialData])

  // --- Queries ---
  const { data: tableData } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tableApi.getAllTables(),
    enabled: isOpen
  })
  const tables = tableData?.data?.data || []

  // --- Handlers ---
  const handleSelectItem = (item: MenuCardItem, type: 'item' | 'combo') => {
    setCart((prev) => {
      const exist = prev.find(i => i.id === item.id && i.type === type)
      if (exist) {
        return prev.map(i => i.id === item.id && i.type === type ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, {
        id: item.id,
        type,
        name: item.name,
        price: Number(item.priceAfterDiscount ?? item.price),
        originalPrice: Number(item.price),
        priceAfterDiscount: item.priceAfterDiscount != null ? Number(item.priceAfterDiscount) : null,
        quantity: 1,
        imageUrl: item.imageUrl
      }]
    })
  }

  const updateQuantity = (id: string | number, type: 'item' | 'combo', delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id && i.type === type) {
        const newQ = Math.max(1, i.quantity + delta)
        return { ...i, quantity: newQ }
      }
      return i
    }))
  }

  const setQuantityManual = (id: string | number, type: 'item' | 'combo', quantity: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id && i.type === type) {
        return { ...i, quantity: Math.max(1, quantity) }
      }
      return i
    }))
  }

  const updateItemNote = (id: string | number, type: 'item' | 'combo', note: string) => {
    setCart(prev => prev.map(i => {
      if (i.id === id && i.type === type) {
        return { ...i, note }
      }
      return i
    }))
  }

  const removeItem = (id: string | number, type: 'item' | 'combo') => {
    setCart(prev => prev.filter(i => !(i.id === id && i.type === type)))
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await reservationApi.createWalkInReservationByStaff({
        ...formData,
        tableId: parseInt(formData.tableId),
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim()
      })
      const reservationId = res.data.data.reservationId
      
      if (cart.length > 0) {
        for (const item of cart) {
          await reservationApi.addItemToReservation(reservationId, {
            itemId: item.type === 'item' ? Number(item.id) : undefined,
            comboId: item.type === 'combo' ? Number(item.id) : undefined,
            quantity: item.quantity,
            note: item.note
          })
        }
      }
      return res
    },
    onSuccess: () => {
      toast.success('Tạo đơn đặt bàn & đặt món thành công')
      onSuccess()
      handleClose()
    },
    onError: (err: any) => {
      toast.error('Lỗi: ' + (err.response?.data?.message || err.message))
    }
  })

  const handleClose = () => {
    onClose()
    setActiveTab('INFO')
    setGuestName('')
    setGuestPhone('')
    setCart([])
    const d = new Date().toISOString().split('T')[0]
    const allSlots = generateTimeSlots(9, 22, 30).filter((slot) => slot !== '22:00')
    const nextValidTime = allSlots.find((slot) => !isDateTimeInPast(d, slot))
    setFormData({
      date: d,
      startTime: nextValidTime || '',
      guestNumber: 2,
      tableId: '',
      note: ''
    })
  }

  const isPhoneValid = (phone: string) => /^0[0-9]{9}$/.test(phone)

  const isFormValid = guestName.trim() !== '' && isPhoneValid(guestPhone) && formData.tableId !== ''

  const totalPrice = cart.reduce((acc, i) => acc + i.price * i.quantity, 0)

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title='Tạo đặt bàn cho khách vãng lai' maxWidth='max-w-6xl'>
      <div className='flex flex-col h-[75vh] -mt-4 overflow-hidden'>
        
        {/* Tab Navigation */}
        <div className='flex border-b border-border bg-muted/10 rounded-t-xl overflow-hidden'>
           <button 
             onClick={() => setActiveTab('INFO')}
             className={clsx(
               'flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-b-2',
               activeTab === 'INFO' ? 'border-primary text-primary bg-white shadow-sm' : 'border-transparent text-muted-foreground hover:bg-muted/30'
             )}
           >
              <Info size={16} /> Thông tin khách hàng
           </button>
           <button 
             onClick={() => setActiveTab('MENU')}
             className={clsx(
               'flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-b-2',
               activeTab === 'MENU' ? 'border-primary text-primary bg-white shadow-sm' : 'border-transparent text-muted-foreground hover:bg-muted/30'
             )}
           >
              <ShoppingCart size={16} /> Thực đơn đặt trước
              {cart.length > 0 && <span className='bg-primary text-white px-2 py-0.5 rounded-full text-[9px]'>{cart.length}</span>}
           </button>
        </div>

        {/* Tab Content */}
        <div className='flex-1 overflow-hidden flex flex-col p-4'>
           
           {/* TAB 1: INFORMATION */}
           {activeTab === 'INFO' && (
             <div className='max-w-2xl mx-auto w-full space-y-10 animate-in fade-in slide-in-from-bottom-2'>
                <div className='space-y-6'>
                   <h4 className='text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-2 flex items-center gap-2'>
                      <User size={14} /> Thông tin
                   </h4>
                   <div className='grid grid-cols-2 gap-8'>
                      <div className='space-y-2'>
                        <label className='text-xs font-bold text-slate-500'>Tên người đại diện <span className='text-red-500'>*</span></label>
                        <Input
                          placeholder='Ví dụ: Nguyễn Văn A'
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className='h-12 bg-slate-50/50 border-slate-200 focus:ring-1 focus:ring-primary rounded-xl'
                        />
                      </div>
                      <div className='space-y-2'>
                        <label className='text-xs font-bold text-slate-500'>Số điện thoại <span className='text-red-500'>*</span></label>
                        <Input
                          placeholder='Ví dụ: 0912345678'
                          value={guestPhone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '').substring(0, 10)
                            setGuestPhone(val)
                          }}
                          className={clsx(
                            'h-12 bg-slate-50/50 border-slate-200 focus:ring-1 focus:ring-primary rounded-xl',
                            guestPhone && !isPhoneValid(guestPhone) && 'border-red-500 focus:ring-red-500 bg-red-50/10'
                          )}
                        />
                        {guestPhone && !isPhoneValid(guestPhone) && (
                          <p className='text-[10px] text-red-500 font-bold italic mt-1'>Số điện thoại phải bắt đầu bằng 0 và đủ 10 chữ số</p>
                        )}
                      </div>
                   </div>
                </div>

                <div className='space-y-6'>
                   <h4 className='text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-2 flex items-center gap-2'>
                      <Calendar size={14} /> Lịch hẹn & Vị trí
                   </h4>
                   <div className='grid grid-cols-2 gap-8'>
                      <div className='space-y-2'>
                        <label className='text-xs font-bold text-slate-500'>Ngày đến</label>
                        <Input 
                          type='date' 
                          className='h-12 bg-slate-50/50 border-slate-200 rounded-xl' 
                          value={formData.date} 
                          onChange={e => {
                            const newDate = e.target.value
                            const allSlots = generateTimeSlots(9, 22, 30).filter((slot) => slot !== '22:00')
                            const nextValidTime = allSlots.find((slot) => !isDateTimeInPast(newDate, slot))
                            setFormData({ ...formData, date: newDate, startTime: nextValidTime || '' })
                          }} 
                        />
                      </div>
                      <div className='space-y-2'>
                        <label className='text-xs font-bold text-slate-500'>Giờ đến</label>
                        <Input 
                          type='time' 
                          className='h-12 bg-slate-50/50 border-slate-200 rounded-xl' 
                          value={formData.startTime} 
                          onChange={e => setFormData({ ...formData, startTime: e.target.value })} 
                        />
                      </div>
                   </div>

                   <div className='grid grid-cols-2 gap-8'>
                      <div className='space-y-2'>
                        <label className='text-xs font-bold text-slate-500'>Số người tham gia</label>
                        <div className='relative'>
                           <Users className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
                           <Input 
                             type='number' 
                             className='h-12 pl-11 bg-slate-50/50 border-slate-200 rounded-xl' 
                             min={1}
                             value={formData.guestNumber} 
                             onChange={e => {
                               const val = parseInt(e.target.value) || 1
                               setFormData({ ...formData, guestNumber: Math.min(20, Math.max(1, val)) })
                             }} 
                           />
                        </div>
                      </div>
                      <div className='space-y-2'>
                        <label className='text-xs font-bold text-slate-500'>Chọn bàn <span className='text-red-500'>*</span></label>
                        <div className='relative'>
                           <Hash className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
                           <select
                              className='w-full h-12 pl-11 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-1 focus:ring-primary appearance-none'
                              value={formData.tableId}
                              onChange={e => setFormData({ ...formData, tableId: e.target.value })}
                           >
                              <option value=''>Trong danh sách bàn khả dụng...</option>
                              {tables.map((t: any) => (
                                <option key={t.id} value={t.id}>{t.name} (Sức chứa: {t.capacity} người)</option>
                              ))}
                           </select>
                        </div>
                      </div>
                   </div>

                   <div className='space-y-2'>
                      <label className='text-xs font-bold text-slate-500'>Yêu cầu đặc biệt (Ghi chú)</label>
                      <Input 
                        placeholder='Ví dụ: Sinh nhật, bàn cửa sổ, không ăn cay...' 
                        className='h-12 bg-slate-50/50 border-slate-200 rounded-xl' 
                        value={formData.note} 
                        onChange={e => setFormData({ ...formData, note: e.target.value })} 
                      />
                   </div>
                </div>

                 <div className='pt-10 flex justify-center'>
                    <Button 
                       onClick={() => setActiveTab('MENU')}
                       disabled={!guestName.trim() || !isPhoneValid(guestPhone)}
                       className='h-14 px-12 gap-3 bg-primary hover:bg-primary/90 text-sm font-black rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105 uppercase tracking-widest disabled:opacity-50'
                    >
                       Tiếp theo: Chọn món <ChevronRight size={18} />
                    </Button>
                 </div>
             </div>
           )}

           {/* TAB 2: MENU SELECTION */}
           {activeTab === 'MENU' && (
             <div className='flex-1 flex gap-3 overflow-hidden animate-in fade-in slide-in-from-right-4'>
                {/* Product List Selector with Category Sidebar */}
                <div className='flex-1 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden p-3 shadow-inner'>
                   <MenuSelector onSelectItem={handleSelectItem} isSidebar={true} />
                </div>

                {/* Selected Items Cart (Right Sidebar) */}
                <div className='w-72 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl'>
                   <div className='p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <ShoppingCart className='w-4 h-4 text-primary' />
                        <span className='text-[10px] font-black uppercase tracking-widest text-slate-600'>Đơn đặt trước</span>
                      </div>
                      {cart.length > 0 && (
                        <button onClick={() => setCart([])} className='text-[9px] font-black uppercase text-red-500 hover:underline'>Xoá hết</button>
                      )}
                   </div>

                   <div className='flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin'>
                      {cart.length === 0 ? (
                        <div className='h-full flex flex-col items-center justify-center text-center p-8 opacity-20 filter grayscale scale-90'>
                           <ShoppingCart className='w-12 h-12 mb-4 text-slate-400' />
                           <p className='text-[10px] font-black uppercase tracking-widest leading-loose'>Chưa có món ăn<br/>được chọn</p>
                        </div>
                      ) : cart.map(item => (
                        <div key={`${item.type}-${item.id}`} className='bg-slate-50/50 p-2 rounded-xl border border-slate-100 group transition-all hover:bg-white hover:border-primary/20 space-y-2'>
                           <div className='flex justify-between items-start gap-2' title={item.name}>
                              <p className='text-[11px] font-bold text-slate-800 line-clamp-1 flex-1'>{item.name}</p>
                              <button onClick={() => removeItem(item.id, item.type)} className='text-slate-300 hover:text-red-500'>
                                 <Trash2 size={10} />
                              </button>
                           </div>
                           
                           {/* Note field */}
                           <input 
                              type='text' 
                              placeholder='Ghi chú cho món...'
                              className='w-full text-[10px] bg-white border border-slate-100 rounded-md px-2 py-1 outline-none focus:border-primary/30 transition-all'
                              value={item.note || ''}
                              onChange={(e) => updateItemNote(item.id, item.type, e.target.value)}
                           />

                           <div className='flex justify-between items-center'>
                              <div className='flex flex-col leading-tight'>
                                {item.priceAfterDiscount != null && item.priceAfterDiscount < item.originalPrice && (
                                  <span className='text-[9px] text-slate-400 line-through'>{formatCurrency(item.originalPrice)}</span>
                                )}
                                <span className='text-[10px] font-black text-primary'>{formatCurrency(item.price)}</span>
                              </div>
                              <div className='flex items-center gap-1.5 bg-white rounded-lg border border-slate-100 p-0.5'>
                                 <button onClick={() => updateQuantity(item.id, item.type, -1)} className='w-5 h-5 flex items-center justify-center hover:text-primary transition-colors'><Minus size={8}/></button>
                                 <input 
                                    type='number' 
                                    min={1}
                                    className='w-8 text-[11px] font-black text-center bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none m-0'
                                    value={item.quantity}
                                    onChange={(e) => setQuantityManual(item.id, item.type, parseInt(e.target.value) || 1)}
                                 />
                                 <button onClick={() => updateQuantity(item.id, item.type, 1)} className='w-5 h-5 flex items-center justify-center hover:text-primary transition-colors'><Plus size={8}/></button>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>

                   <div className='p-6 bg-primary/5 border-t border-slate-100 space-y-4'>
                      <div className='flex justify-between items-end'>
                         <span className='text-[9px] font-black uppercase text-slate-400'>Tổng cộng</span>
                         <span className='text-xl font-black text-primary tracking-tight'>{formatCurrency(totalPrice)}</span>
                      </div>
                      <div className='flex gap-3'>
                         <Button 
                            variant='outline'
                            onClick={() => setActiveTab('INFO')}
                            className='flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200'
                         >
                            <ChevronLeft size={14} /> Quay lại
                         </Button>
                         <Button 
                            onClick={() => createMutation.mutate()}
                            disabled={!isFormValid || createMutation.isPending}
                            className='flex-[2] h-12 rounded-xl bg-primary shadow-lg shadow-primary/20 text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-50 disabled:grayscale'
                         >
                            {createMutation.isPending ? 'Đang gửi...' : 'HOÀN TẤT'}
                         </Button>
                      </div>
                   </div>
                </div>
             </div>
           )}

        </div>
      </div>
    </Modal>
  )
}
