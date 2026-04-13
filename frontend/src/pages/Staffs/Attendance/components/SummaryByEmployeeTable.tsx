import type { AttendanceSummaryResponse, EmployeeAttendanceSummaryResponse } from '@/types/attendance.type'

interface SummaryByEmployeeTableProps {
  data: AttendanceSummaryResponse
}

function EmployeeRow({ emp }: { emp: EmployeeAttendanceSummaryResponse }) {
  if (emp.noData) {
    return (
      <tr className='border-b border-border bg-muted/10'>
        <td className='px-4 py-3 font-medium'>
          {emp.fullName} ({emp.staffCode})
        </td>
        <td colSpan={5} className='text-muted-foreground py-4 text-center'>
          Nhân viên chưa có dữ liệu chấm công
        </td>
      </tr>
    )
  }

  return (
    <tr className='border-b border-border hover:bg-muted/20'>
      <td className='px-4 py-3 font-medium'>
        {emp.fullName} ({emp.staffCode})
      </td>
      <td className='px-4 py-3 text-muted-foreground'>
        {emp.workShiftCount} ca, {emp.workHoursTotal}
      </td>
      <td className='px-4 py-3 text-muted-foreground'>
        {emp.leaveShiftCount > 0 ? `${emp.leaveShiftCount} ca` : '-'}
      </td>
      <td className='px-4 py-3 text-muted-foreground'>
        {emp.lateCount > 0 ? `${emp.lateCount} lần, ${emp.lateDuration}` : '-'}
      </td>
      <td className='px-4 py-3 text-muted-foreground'>
        {emp.earlyLeaveCount > 0
          ? `${emp.earlyLeaveCount} lần, ${emp.earlyLeaveDuration}`
          : '-'}
      </td>
    </tr>
  )
}

export function SummaryByEmployeeTable({ data }: SummaryByEmployeeTableProps) {
  return (
    <div className='overflow-x-auto rounded-xl border border-border bg-card shadow-sm'>
      <table className='w-full min-w-[600px] border-collapse text-sm'>
        <thead>
          <tr className='border-b border-border bg-muted/30'>
            <th className='border-r border-border px-4 py-3 text-left font-medium text-foreground'>
              Nhân viên
            </th>
            <th className='border-r border-border px-4 py-3 text-left font-medium'>
              Đi làm
            </th>
            <th className='border-r border-border px-4 py-3 text-left font-medium'>
              Nghỉ làm
            </th>
            <th className='border-r border-border px-4 py-3 text-left font-medium'>
              Đi muộn
            </th>
            <th className='border-r border-border px-4 py-3 text-left font-medium'>
              Về sớm
            </th>

          </tr>
        </thead>
        <tbody>
          {data.employees.map((emp) => (
            <EmployeeRow key={emp.userId} emp={emp} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
