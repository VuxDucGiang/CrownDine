import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import tableApi from '@/apis/table.api'
import reservationApi from '@/apis/reservation.api'
import { format, isSameDay, addDays, subDays } from 'date-fns'
import { ChevronLeft, ChevronRight, PlusCircle, Search } from 'lucide-react'
import type { StaffReservationResponse } from '@/types/reservation.type'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import clsx from 'clsx'
import type { Table } from '@/types/table.type'

interface ReservationCalendarViewProps {
  onOpenCreateModal: () => void
  onSelectReservation: (res: StaffReservationResponse) => void
  statusFilter?: string
  activeFloor?: string
  activeArea?: string
  onSlotClick?: (data: { tableId: number; startTime: string; date: string }) => void
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8) // 08:00 to 22:00
const COLUMN_WIDTH = 80 // px per hour

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: 'Đã xếp bàn', color: 'bg-green-500' },
  CHECKED_IN: { label: 'Đã nhận bàn', color: 'bg-blue-500' },
  PENDING: { label: 'Chờ xác nhận', color: 'bg-yellow-500' },
  NO_SHOW: { label: 'Quá giờ / Không đến', color: 'bg-gray-500' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-500' }
}

const ReservationCalendarView = ({
  onOpenCreateModal,
  onSelectReservation,
  statusFilter,
  activeFloor,
  activeArea,
  onSlotClick
}: ReservationCalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')

  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const { data: tablesData = [] as Table[], isLoading: isTablesLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tableApi.getAllTables(),
    select: (res) => res.data?.data || []
  })

  // Group tables by Floor & Area filter
  const groupedTables = useMemo(() => {
    const groups: Record<string, Table[]> = {}

    // 1. Filter tables by Floor & Area
    const filteredTables = tablesData.filter((t: Table) => {
      if (activeFloor && activeFloor !== 'Tất cả' && t.floorName !== activeFloor) return false
      if (activeArea && activeArea !== 'Tất cả' && t.areaName !== activeArea) return false
      return true
    })

    filteredTables.forEach((t: Table) => {
      const floor = t.floorName || 'Khu vực chính'
      if (!groups[floor]) groups[floor] = []
      groups[floor].push(t)
    })

    return groups
  }, [tablesData, activeFloor, activeArea])

  const { data: reservations = [] as StaffReservationResponse[] } = useQuery({
    queryKey: ['staff-reservations-calendar', dateStr],
    queryFn: () => reservationApi.getAllReservations({ fromDate: dateStr, toDate: dateStr, size: 200 }),
    select: (res) => res.data?.data?.data || []
  })

  const filteredReservations = useMemo(() => {
    let result = reservations

    // 1. Status Filter
    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter)
    }

    // 2. Search Term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      result = result.filter(
        (r: StaffReservationResponse) =>
          r.customerName.toLowerCase().includes(lowerSearch) ||
          r.phone?.includes(searchTerm) ||
          r.code?.includes(lowerSearch)
      )
    }

    return result
  }, [reservations, searchTerm, statusFilter])

  const getTimeOffset = (timeStr: string) => {
    if (!timeStr) return 0
    const [h, m] = timeStr.split(':').map(Number)
    const baseHour = 8
    const totalMinutes = (h - baseHour) * 60 + m
    return (totalMinutes / 60) * COLUMN_WIDTH
  }

  const getDurationWidth = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return COLUMN_WIDTH * 1.5 // Default 1.5h
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const totalMinutes = eh * 60 + em - (sh * 60 + sm)
    return (totalMinutes / 60) * COLUMN_WIDTH
  }

  const currentTimeOffset = useMemo(() => {
    const now = new Date()
    if (!isSameDay(now, selectedDate)) return null
    const h = now.getHours()
    const m = now.getMinutes()
    if (h < 8 || h > 22) return null
    return (((h - 8) * 60 + m) / 60) * COLUMN_WIDTH
  }, [selectedDate])

  if (isTablesLoading) return <div className='p-10 text-center'>Đang tải sơ đồ bàn...</div>

  return (
    <div className='flex h-full flex-col overflow-hidden bg-white text-slate-800'>
      {/* 1. Sub-Header Toolbar */}
      <div className='flex items-center justify-between border-b border-slate-200 bg-slate-50 p-3'>
        <div className='flex items-center gap-4'>
          <div className='flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm'>
            <button className='bg-primary rounded-md px-4 py-1.5 text-[10px] font-black text-white uppercase'>
              Ngày
            </button>
            <button className='px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase transition-colors hover:text-slate-800'>
              Tuần
            </button>
            <button className='px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase transition-colors hover:text-slate-800'>
              Tháng
            </button>
          </div>

          <div className='flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm'>
            <button
              onClick={() => setSelectedDate((prev) => subDays(prev, 1))}
              className='border-r border-slate-100 p-2 text-slate-400 transition-colors hover:bg-slate-50'
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className='hover:text-primary border-r border-slate-100 bg-white px-3 py-1 text-[9px] font-black text-slate-400 uppercase transition-colors'
            >
              Hôm nay
            </button>
            <div className='min-w-[120px] px-4 text-center text-xs font-bold text-slate-600'>
              {format(selectedDate, 'dd/MM/yyyy')}
            </div>
            <button
              onClick={() => setSelectedDate((prev) => addDays(prev, 1))}
              className='border-l border-slate-100 p-2 text-slate-400 transition-colors hover:bg-slate-50'
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <div className='relative'>
            <Input
              className='focus:border-primary h-9 w-[240px] border-slate-200 bg-white pl-8 text-xs shadow-sm'
              placeholder='Lọc theo khách hàng...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className='absolute top-2 left-2.5 text-slate-300' size={14} />
          </div>
          <Button
            onClick={onOpenCreateModal}
            className='bg-primary hover:bg-primary/90 h-9 gap-2 rounded-lg px-4 text-xs font-bold shadow-md transition-all active:scale-95'
          >
            <PlusCircle size={14} /> ĐẶT BÀN (F1)
          </Button>
        </div>
      </div>

      {/* 2. Legend / Filters */}
      <div className='z-20 flex flex-wrap items-center gap-6 border-b border-slate-200 bg-white px-6 py-2.5 text-[10px] font-black tracking-wider text-slate-400 uppercase shadow-sm'>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <div key={key} className='flex items-center gap-2'>
            <div className={clsx('h-3 w-3 rounded-sm', config.color)}></div>
            <span>{config.label}</span>
          </div>
        ))}
      </div>

      {/* 3. Main Timeline Grid */}
      <div className='relative flex-1 overflow-auto bg-slate-50'>
        <div className='inline-flex min-w-full flex-col'>
          {/* Timeline Header (Sticky) */}
          <div className='sticky top-0 z-30 flex border-b border-slate-200 bg-slate-50'>
            <div className='flex w-48 flex-shrink-0 items-center justify-center border-r border-slate-200 bg-slate-100/50 p-3 text-[10px] font-black tracking-widest text-slate-400 uppercase'>
              Phòng / Bàn
            </div>
            <div className='flex'>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  style={{ width: `${COLUMN_WIDTH}px` }}
                  className='flex-shrink-0 border-r border-slate-200/50 p-3 text-center text-[10px] font-black text-slate-400'
                >
                  {hour}:00
                </div>
              ))}
            </div>
          </div>

          {/* Floor Groupings & Table Rows */}
          {Object.entries(groupedTables).map(([floor, tables]) => (
            <div key={floor}>
              {/* Floor Header */}
              <div className='flex border-b border-slate-200 bg-slate-100/50'>
                <div className='flex w-48 items-center border-r border-slate-200 bg-slate-200/30 p-2 pl-4 text-[9px] font-black tracking-widest text-slate-400 uppercase'>
                  {floor}
                </div>
                <div className='h-8 flex-1'></div>
              </div>

              {/* Table Rows under this floor */}
              {tables?.map((table: Table) => {
                const tableReservations = (filteredReservations || []).filter(
                  (r: StaffReservationResponse) => r.tableName === table.name
                )

                return (
                  <div
                    key={table.id}
                    className='group flex h-13 border-b border-slate-200 transition-colors hover:bg-white'
                  >
                    {/* Left Table Label */}
                    <div className='flex w-48 flex-shrink-0 items-center gap-2 border-r border-slate-200 bg-white p-3 text-sm font-semibold shadow-sm'>
                      <div className='group-hover:bg-primary h-2 w-2 rounded-full bg-slate-200 transition-colors'></div>
                      {table.name}
                      <span className='ml-auto text-[10px] font-normal text-slate-400'>({table.capacity} ghế)</span>
                    </div>

                    {/* Horizontal Track with Reservation Blocks */}
                    <div className='relative flex bg-slate-50/30 transition-colors group-hover:bg-white/10'>
                      {HOURS.map((hour) => (
                        <div
                          key={hour}
                          style={{ width: `${COLUMN_WIDTH}px` }}
                          className='hover:bg-primary/5 h-full flex-shrink-0 cursor-cell border-r border-slate-200/50 transition-all'
                          onClick={() =>
                            onSlotClick?.({
                              tableId: Number(table.id),
                              startTime: `${hour.toString().padStart(2, '0')}:00`,
                              date: dateStr
                            })
                          }
                        ></div>
                      ))}

                      {(tableReservations || []).map((res: StaffReservationResponse) => {
                        const offset = getTimeOffset(res.startTime)
                        const width = getDurationWidth(res.startTime, res.endTime)
                        const config = STATUS_CONFIG[res.status] || STATUS_CONFIG.CONFIRMED

                        return (
                          <div
                            key={res.id}
                            onClick={() => onSelectReservation(res)}
                            style={{
                              left: `${offset}px`,
                              width: `${width - 4}px`,
                              top: '8px'
                            }}
                            className={clsx(
                              'group/block absolute z-10 h-10 cursor-pointer overflow-hidden rounded-lg border border-white/20 p-2 text-[10px] shadow-sm transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95 sm:text-xs',
                              config.color,
                              'text-white'
                            )}
                          >
                            <div className='flex items-center gap-1 truncate font-bold drop-shadow-sm'>
                              {res.customerName}
                            </div>
                            <div className='flex items-center gap-1 truncate font-medium opacity-90'>
                              👤 {res.guestNumber} • {res.startTime.substring(0, 5)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {/* Current Time Indicator Line */}
          {currentTimeOffset !== null && (
            <div
              className='pointer-events-none absolute top-0 bottom-0 z-40 w-0.5 bg-red-500'
              style={{ left: `${currentTimeOffset + 192}px` }} // +192px for the offset of the left sidebar (w-48 = 192px)
            >
              <div className='absolute -top-1.5 -left-1.25 h-3 w-3 rounded-full bg-red-500 shadow-md'></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReservationCalendarView
