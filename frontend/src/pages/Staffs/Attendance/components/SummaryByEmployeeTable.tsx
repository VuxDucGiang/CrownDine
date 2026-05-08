import type { AttendanceSummaryResponse, EmployeeAttendanceSummaryResponse } from '@/types/attendance.type'

interface SummaryByEmployeeTableProps {
  data: AttendanceSummaryResponse
}

function EmployeeRow({ emp }: { emp: EmployeeAttendanceSummaryResponse }) {
  if (emp.noData) {
    return (
      <tr className='border-border bg-muted/10 border-b'>
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
    <tr className='border-border hover:bg-muted/20 border-b'>
      <td className='px-4 py-3 font-medium'>
        {emp.fullName} ({emp.staffCode})
      </td>
      <td className='text-muted-foreground px-4 py-3'>
        {emp.workShiftCount} ca, {emp.workHoursTotal}
      </td>
      <td className='text-muted-foreground px-4 py-3'>{emp.leaveShiftCount > 0 ? `${emp.leaveShiftCount} ca` : '-'}</td>
      <td className='text-muted-foreground px-4 py-3'>
        {emp.lateCount > 0 ? `${emp.lateCount} lần, ${emp.lateDuration}` : '-'}
      </td>
      <td className='text-muted-foreground px-4 py-3'>
        {emp.earlyLeaveCount > 0 ? `${emp.earlyLeaveCount} lần, ${emp.earlyLeaveDuration}` : '-'}
      </td>
    </tr>
  )
}

export function SummaryByEmployeeTable({ data }: SummaryByEmployeeTableProps) {
  return (
    <div className='border-border bg-card overflow-x-auto rounded-xl border shadow-sm'>
      <table className='w-full min-w-[600px] border-collapse text-sm'>
        <thead>
          <tr className='border-border bg-muted/30 border-b'>
            <th className='border-border text-foreground border-r px-4 py-3 text-left font-medium'>Nhân viên</th>
            <th className='border-border border-r px-4 py-3 text-left font-medium'>Đi làm</th>
            <th className='border-border border-r px-4 py-3 text-left font-medium'>Nghỉ làm</th>
            <th className='border-border border-r px-4 py-3 text-left font-medium'>Đi muộn</th>
            <th className='border-border border-r px-4 py-3 text-left font-medium'>Về sớm</th>
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
