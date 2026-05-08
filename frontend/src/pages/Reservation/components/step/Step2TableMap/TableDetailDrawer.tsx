import React from 'react'
import type { TableLayout } from '@/types/layout'
import { X, Users, BadgeDollarSign, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TableDetailDrawerProps {
  table: TableLayout | null
  onClose: () => void
  onSelect: (table: TableLayout) => void
  isSelected: boolean
}

const TableDetailDrawer: React.FC<TableDetailDrawerProps> = ({ table, onClose, onSelect, isSelected }) => {
  if (!table) return null

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          table ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-[101] h-full w-full max-w-md transform border-l border-gray-100 bg-white shadow-2xl transition-transform duration-500 ease-out ${
          table ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className='bg-background flex h-full flex-col'>
          {/* Header */}
          <div className='relative h-72 w-full overflow-hidden bg-gray-100 shadow-inner'>
            {table.imageUrl ? (
              <img
                src={table.imageUrl}
                alt={table.name}
                className='h-full w-full object-cover transition-transform duration-700 hover:scale-110'
              />
            ) : (
              <div className='flex h-full w-full flex-col items-center justify-center gap-3 bg-linear-to-br from-gray-50 to-gray-100 text-gray-400'>
                <div className='shadow-soft flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-orange-500'>
                  <Info size={40} />
                </div>
                <span className='text-sm font-bold tracking-tight text-gray-500 uppercase'>
                  Hình ảnh bàn đang cập nhật
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className='absolute top-6 right-6 z-10 rounded-full bg-black/30 p-2.5 text-white backdrop-blur-md transition-all duration-200 hover:rotate-90 hover:bg-black/50'
            >
              <X size={20} />
            </button>

            <div className='absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/90 via-black/40 to-transparent p-8'>
              <div className='mb-1 flex items-center gap-2'>
                <span className='rounded-sm bg-orange-500 px-2 py-0.5 text-[10px] font-black tracking-widest text-white uppercase'>
                  {table.areaName || 'Khu vực chung'}
                </span>
              </div>
              <h2 className='text-3xl font-black tracking-tighter text-white drop-shadow-sm'>{table.name}</h2>
            </div>
          </div>

          {/* Content */}
          <div className='flex-1 space-y-10 overflow-y-auto p-8'>
            {/* Quick Stats */}
            <div className='grid grid-cols-2 gap-5'>
              <div className='group flex flex-col gap-1.5 rounded-2xl border-2 border-orange-100 bg-white p-5 transition-all hover:border-orange-500 hover:bg-orange-50/30'>
                <div className='flex items-center gap-2 text-sm font-bold text-orange-600'>
                  <Users size={16} />
                  <span>Sức chứa</span>
                </div>
                <p className='text-3xl leading-none font-black text-gray-900'>
                  {table.capacity}{' '}
                  <span className='text-xs font-bold tracking-tighter text-gray-400 uppercase'>khách</span>
                </p>
              </div>
              <div className='group flex flex-col gap-1.5 rounded-2xl border-2 border-amber-100 bg-white p-5 transition-all hover:border-amber-500 hover:bg-amber-50/30'>
                <div className='flex items-center gap-2 text-sm font-bold text-amber-600'>
                  <BadgeDollarSign size={16} />
                  <span>Tiền cọc</span>
                </div>
                <p className='text-3xl leading-none font-black text-gray-900'>
                  {table.deposit?.toLocaleString()}{' '}
                  <span className='text-xs font-bold tracking-tighter text-gray-400 uppercase'>đ</span>
                </p>
              </div>
            </div>

            {/* Description */}
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <div className='h-8 w-1.5 rounded-full bg-orange-500'></div>
                <h3 className='text-xl font-black tracking-tight text-gray-900 italic'>Thông tin từ nhà hàng</h3>
              </div>
              <div className='group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'>
                <div className='absolute top-0 left-0 h-1 w-full bg-orange-500 opacity-0 transition-opacity group-hover:opacity-100'></div>
                <p className='relative z-10 text-base leading-relaxed font-medium text-gray-600'>
                  {table.description ||
                    `Đây là một lựa chọn tuyệt vời tại khu vực ${table.areaName || 'Sảnh chính'}. Không gian được thiết kế tỉ mỉ để mang lại sự thoải mái nhất cho quý khách.`}
                </p>
                <div className='mt-4 flex items-center gap-2 text-orange-500/50'>
                  <Info size={14} />
                  <span className='text-[10px] font-bold tracking-widest uppercase'>Dữ liệu hệ thống</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='border-t border-gray-100 bg-gray-50/50 p-8 backdrop-blur-sm'>
            <Button
              className={`group relative h-16 w-full overflow-hidden rounded-xl text-lg font-black transition-all ${
                isSelected
                  ? 'bg-red-500 text-white shadow-[4px_4px_0px_0px_rgba(153,27,27,1)] hover:bg-red-600 active:translate-y-1 active:shadow-none'
                  : 'bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-[4px_4px_0px_0px_rgba(124,45,18,1)] hover:from-orange-600 hover:to-amber-600 active:translate-y-1 active:shadow-none'
              }`}
              onClick={() => {
                onSelect(table)
                onClose()
              }}
            >
              <span className='relative z-10 flex items-center justify-center gap-2 tracking-widest uppercase'>
                {isSelected ? 'Bỏ chọn bàn này' : 'Xác nhận chọn bàn ngay'}
              </span>
              <div className='absolute inset-0 translate-x-[-100%] skew-x-[-20deg] bg-white/20 transition-transform duration-1000 group-hover:translate-x-[100%]'></div>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default TableDetailDrawer
