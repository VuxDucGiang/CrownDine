import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useMutation, useQuery } from '@tanstack/react-query'
import reservationApi from '@/apis/reservation.api'
import clsx from 'clsx'
import { queryClient } from '@/lib/queryClient'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import type { StaffReservationResponse } from '@/types/reservation.type'
import { useAuthStore } from '@/stores/useAuthStore'
import { PlusCircle, Search, Check } from 'lucide-react'
import CreateReservationModal from './components/CreateReservationModal'
import ReservationCalendarView from './components/ReservationCalendarView'
import ReservationDetailModal from './components/ReservationDetailModal'
import tableApi from '@/apis/table.api'
import type { Table } from '@/types/table.type'

type ViewMode = 'LIST' | 'CALENDAR'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã nhận bàn',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
  NO_SHOW: 'Không đến'
}

const ReservationList = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [viewMode, setViewMode] = useState<ViewMode>('CALENDAR')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<StaffReservationResponse | null>(null)
  const [initialBookingData, setInitialBookingData] = useState<{
    tableId?: string | number
    startTime?: string
    date?: string
  } | null>(null)

  // Advanced Filter states
  const [statusFilter, setStatusFilter] = useState('')
  const [activeFloor, setActiveFloor] = useState('Tất cả')
  const [activeArea, setActiveArea] = useState('Tất cả')

  const { data: reservations } = useQuery({
    queryKey: ['staff-reservations', statusFilter],
    queryFn: () => reservationApi.getAllReservations({ status: statusFilter || undefined, size: 100 }),
    select: (res) => res.data?.data?.data || []
  })

  // Fetch Tables once for filter data
  const { data: rawTables = [] } = useQuery({
    queryKey: ['tables-filter'],
    queryFn: () => tableApi.getAllTables(),
    select: (res) => res.data.data
  })

  // Filter UI data
  const floors = ['Tất cả', ...Array.from(new Set(rawTables.map((t: Table) => t.floorName).filter(Boolean)))]
  const areas = [
    'Tất cả',
    ...Array.from(
      new Set(
        rawTables
          .filter((t) => activeFloor === 'Tất cả' || t.floorName === activeFloor)
          .map((t) => t.areaName)
          .filter(Boolean)
      )
    )
  ]

  const checkInMutation = useMutation({
    mutationFn: async (reservation: StaffReservationResponse) =>
      reservationApi.checkInReservation(reservation.id, user?.id),
    onSuccess: () => {
      toast.success('Check in đặt bàn thành công')
      setSelectedReservation(null)
      queryClient.invalidateQueries({ queryKey: ['staff-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['staff-reservations-calendar'] })
    }
  })

  const cancelMutation = useMutation({
    mutationFn: (reservationId: number) => reservationApi.cancelReservationByStaff(reservationId),
    onSuccess: () => {
      toast.success('Huỷ đặt bàn thành công')
      setSelectedReservation(null)
      queryClient.invalidateQueries({ queryKey: ['staff-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['staff-reservations-calendar'] })
    }
  })

  const filteredReservations = (reservations || []).filter((r: StaffReservationResponse) => {
    // 1. Status Filter
    if (statusFilter && r.status !== statusFilter) return false

    // 2. Floor Filter
    if (activeFloor !== 'Tất cả' && r.floorName !== activeFloor) return false

    // 3. Area Filter
    if (activeArea !== 'Tất cả' && r.areaName !== activeArea) return false

    return true
  })

  return (
    <div className='flex min-h-screen bg-white'>
      {/* 1. SIDEBAR (Left) */}
      <aside className='z-30 hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white lg:flex'>
        <div className='border-b border-slate-100 bg-slate-50/10 p-6'>
          <h2 className='flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase'>
            <Search size={14} /> Bộ lọc nâng cao
          </h2>
        </div>

        <div className='space-y-8 overflow-y-auto p-6'>
          {/* Status checkboxes */}
          <div>
            <label className='mb-3 block px-1 text-[10px] font-black tracking-widest text-slate-400 uppercase'>
              Trạng thái đơn
            </label>
            <div className='space-y-1.5'>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setStatusFilter(statusFilter === k ? '' : k)}
                  className={clsx(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold transition-all',
                    statusFilter === k ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <span>{v}</span>
                  {statusFilter === k && <Check size={12} />}
                </button>
              ))}
            </div>
          </div>

          {/* Floor filter */}
          <div>
            <label className='mb-3 block px-1 text-[10px] font-black tracking-widest text-slate-400 uppercase'>
              Tầng / Lầu
            </label>
            <select
              className='h-10 w-full cursor-pointer rounded-lg border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none'
              value={activeFloor}
              onChange={(e) => {
                setActiveFloor(e.target.value)
                setActiveArea('Tất cả')
              }}
            >
              {floors.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Area filter */}
          <div>
            <label className='mb-3 block px-1 text-[10px] font-black tracking-widest text-slate-400 uppercase'>
              Khu vực / Phòng
            </label>
            <div className='flex flex-wrap gap-2'>
              {areas.map((a) => (
                <button
                  key={a}
                  onClick={() => setActiveArea(a)}
                  className={clsx(
                    'rounded-full border px-3 py-1.5 text-[10px] font-black tracking-tight uppercase transition-all',
                    activeArea === a
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-slate-100 bg-white text-slate-400 hover:border-orange-300 hover:text-orange-500'
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT (Right) */}
      <main className='flex min-w-0 flex-1 flex-col'>
        {/* Workspace Dashboard Header (Dark Blue) */}
        <header className='z-40 flex h-14 items-center justify-between bg-[#003C71] px-0 text-white shadow-md'>
          <div className='flex h-full items-center'>
            <h1 className='flex h-full items-center border-r border-white/10 px-6 text-sm font-black tracking-widest uppercase'>
              Đặt bàn
            </h1>
            <nav className='flex h-full'>
              <button
                onClick={() => setViewMode('CALENDAR')}
                className={clsx(
                  'flex h-full items-center gap-2 border-b-2 px-8 text-xs font-bold tracking-widest uppercase transition-all',
                  viewMode === 'CALENDAR'
                    ? 'border-white bg-white/10 text-white shadow-inner'
                    : 'border-transparent text-white/40 hover:text-white/80'
                )}
              >
                Theo lịch
              </button>
              <button
                onClick={() => setViewMode('LIST')}
                className={clsx(
                  'flex h-full items-center gap-2 border-b-2 px-8 text-xs font-bold tracking-widest uppercase transition-all',
                  viewMode === 'LIST'
                    ? 'border-white bg-white/10 text-white shadow-inner'
                    : 'border-transparent text-white/40 hover:text-white/80'
                )}
              >
                Theo danh sách
              </button>
            </nav>
          </div>

          <div className='flex items-center gap-4 pr-6 text-[10px] font-bold tracking-wider uppercase'>
            <span className='opacity-60'>Chi nhánh trung tâm</span>
            <div className='h-3 w-px bg-white/20'></div>
            <span className='bg-primary/20 rounded-full border border-white/10 px-3 py-1'>
              Staff: {user?.firstName}
            </span>
          </div>
        </header>

        {/* Workspace Panel - No padding for Edge-to-Edge look */}
        <div className='flex flex-1 flex-col overflow-hidden bg-white'>
          {viewMode === 'CALENDAR' ? (
            <ReservationCalendarView
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onSelectReservation={(res) => setSelectedReservation(res)}
              statusFilter={statusFilter}
              activeFloor={activeFloor}
              activeArea={activeArea}
              onSlotClick={(data) => {
                setInitialBookingData(data)
                setIsCreateModalOpen(true)
              }}
            />
          ) : (
            <div className='flex h-full flex-1 flex-col overflow-hidden border-b border-slate-200 bg-white'>
              {/* Table Top Actions */}
              <div className='flex items-center justify-end border-b border-slate-100 bg-slate-50/30 p-4'>
                <div className='flex gap-2'>
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className='bg-primary shadow-primary/20 h-9 gap-2 rounded-lg px-4 text-xs font-bold shadow-lg transition-transform hover:scale-105'
                  >
                    <PlusCircle size={14} /> TẠO ĐẶT BÀN
                  </Button>
                </div>
              </div>

              {/* Main Table Interface */}
              <div className='flex-1 overflow-auto bg-white'>
                <table className='w-full border-collapse text-left'>
                  <thead className='sticky top-0 z-10 border-b border-slate-200 bg-slate-50'>
                    <tr>
                      <th className='w-10 p-4'></th>
                      <th className='p-4 text-[10px] font-black tracking-tighter whitespace-nowrap text-slate-400 uppercase'>
                        Mã đặt bàn
                      </th>
                      <th className='p-4 text-[10px] font-black tracking-tighter whitespace-nowrap text-slate-400 uppercase'>
                        Giờ đến
                      </th>
                      <th className='p-4 text-[10px] font-black tracking-tighter whitespace-nowrap text-slate-400 uppercase'>
                        Khách hàng
                      </th>
                      <th className='p-4 text-[10px] font-black tracking-tighter whitespace-nowrap text-slate-400 uppercase'>
                        Điện thoại
                      </th>
                      <th className='p-4 text-[10px] font-black tracking-tighter whitespace-nowrap text-slate-400 uppercase'>
                        Số khách
                      </th>
                      <th className='p-4 text-[10px] font-black tracking-tighter whitespace-nowrap text-slate-400 uppercase'>
                        Phòng/bàn
                      </th>
                      <th className='p-4 text-[10px] font-black tracking-tighter whitespace-nowrap text-slate-400 uppercase'>
                        Trạng thái
                      </th>
                      <th className='p-4 text-center text-[10px] font-black tracking-tighter whitespace-nowrap text-slate-400 uppercase'>
                        Ghi chú
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.map((res: StaffReservationResponse) => (
                      <tr
                        key={res.id}
                        onClick={() => setSelectedReservation(res)}
                        className='group cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50/50'
                      >
                        <td className='p-4'>
                          <input type='checkbox' className='rounded border-slate-300' />
                        </td>
                        <td className='text-primary p-4 text-sm font-bold'>
                          #{res.code?.substring(0, 8).toUpperCase()}
                        </td>
                        <td className='p-4 text-xs font-semibold text-slate-500'>
                          <div className='font-bold text-slate-700'>{res.startTime.substring(0, 5)}</div>
                          <div className='text-[10px]'>{res.date}</div>
                        </td>
                        <td className='p-4 text-sm font-bold text-slate-700'>{res.customerName}</td>
                        <td className='p-4 text-xs font-medium text-slate-500'>{res.phone || 'N/A'}</td>
                        <td className='p-4 text-center text-sm font-black text-slate-700'>{res.guestNumber}</td>
                        <td className='p-4 text-xs font-bold text-slate-600'>{res.tableName || 'Chưa xếp'}</td>
                        <td className='p-4'>
                          <div className='flex items-center gap-2'>
                            <div
                              className={clsx(
                                'h-1.5 w-1.5 rounded-full ring-2 ring-offset-1',
                                res.status === 'PENDING'
                                  ? 'bg-yellow-500 ring-yellow-400/30'
                                  : res.status === 'CONFIRMED'
                                    ? 'bg-blue-500 ring-blue-400/30'
                                    : res.status === 'CHECKED_IN'
                                      ? 'bg-emerald-500 ring-emerald-400/30'
                                      : res.status === 'CANCELLED'
                                        ? 'bg-red-500 ring-red-400/30'
                                        : 'bg-slate-400 ring-slate-300/30'
                              )}
                            ></div>
                            <span className='text-[10px] font-black whitespace-nowrap text-slate-500 uppercase'>
                              {STATUS_LABELS[res.status] || res.status}
                            </span>
                          </div>
                        </td>
                        <td className='p-4'>
                          <div className='flex justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100'>
                            {res.status === 'CONFIRMED' && (
                              <button
                                onClick={() => checkInMutation.mutate(res)}
                                className='rounded-md bg-emerald-50 p-1.5 text-emerald-600 shadow-sm transition-all hover:bg-emerald-600 hover:text-white'
                                title='Check-in'
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button
                              className='rounded-md bg-blue-50 p-1.5 text-blue-600 shadow-sm transition-all hover:bg-blue-600 hover:text-white'
                              title='Cập nhật'
                              onClick={() => navigate('/staff/order-management', { state: { reservationId: res.id } })}
                            >
                              <Search size={14} />
                            </button>
                            <button
                              onClick={() => cancelMutation.mutate(res.id)}
                              className='rounded-md bg-red-50 p-1.5 text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white'
                              title='Huỷ'
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredReservations.length === 0 && (
                  <div className='py-24 text-center'>
                    <p className='text-sm font-black tracking-widest text-slate-300 uppercase italic'>Dữ liệu trống</p>
                  </div>
                )}
              </div>

              {/* Pagination Status Bar */}
              <div className='flex items-center justify-between border-t border-slate-200 bg-slate-50 p-3 text-[9px] font-black tracking-widest text-slate-400 uppercase'>
                <div className='flex items-center gap-1.5'>
                  <button className='flex h-5 w-5 items-center justify-center rounded border border-slate-200 hover:bg-white'>
                    ‹
                  </button>
                  <button className='bg-primary flex h-5 w-5 items-center justify-center rounded text-white shadow-md'>
                    1
                  </button>
                  <button className='flex h-5 w-5 items-center justify-center rounded border border-slate-200 hover:bg-white'>
                    2
                  </button>
                  <button className='flex h-5 w-5 items-center justify-center rounded border border-slate-200 hover:bg-white'>
                    ›
                  </button>
                </div>
                <div>Hiển thị {filteredReservations.length} kết quả</div>
              </div>
            </div>
          )}
        </div>
      </main>

      <CreateReservationModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setInitialBookingData(null)
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['staff-reservations'] })
          queryClient.invalidateQueries({ queryKey: ['staff-reservations-calendar'] })
          queryClient.invalidateQueries({ queryKey: ['tables-filter'] })
        }}
        initialData={initialBookingData}
      />

      <ReservationDetailModal
        isOpen={!!selectedReservation}
        onClose={() => setSelectedReservation(null)}
        reservation={selectedReservation}
        onCheckIn={(res) => checkInMutation.mutate(res)}
        onCancel={(id) => cancelMutation.mutate(id)}
        isMutating={checkInMutation.isPending || cancelMutation.isPending}
      />
    </div>
  )
}

export default ReservationList
