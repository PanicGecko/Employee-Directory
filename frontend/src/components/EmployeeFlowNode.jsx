import { Handle, Position } from '@xyflow/react'
import { formatRole, getEmployeeName } from '../utils/employeeUtils'
import SkillChips from './SkillChips'

function EmployeeFlowNode({ data, selected }) {
  const { employee, directReportsCount, isDimmed, isRoot } = data
  const departmentName = employee.department?.name || 'No department'
  const isActive = employee.is_active

  return (
    <div
      className={`relative w-[300px] overflow-hidden rounded-xl border shadow-md transition sm:w-[360px] ${
        isActive
          ? 'border-blue-100 bg-slate-50 shadow-blue-100/50'
          : 'border-rose-200 bg-rose-50 shadow-rose-100/70'
      } ${
        selected || isRoot
          ? isActive
            ? 'ring-2 ring-blue-200'
            : 'ring-2 ring-rose-200'
          : ''
      } ${isDimmed ? 'opacity-25 blur-[1px] grayscale' : 'opacity-100 blur-0'}`}
    >
      <div className={`h-2 ${isActive ? 'bg-blue-500' : 'bg-rose-500'}`} />
      <div className={`px-4 py-4 sm:px-5 sm:py-5 ${isActive ? 'bg-white' : 'bg-rose-50'}`}>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-slate-950 sm:text-xl">
            {getEmployeeName(employee)}
          </p>
          <p className="mt-1 truncate text-sm font-medium text-slate-600 sm:text-base">
            {formatRole(employee.role)}
          </p>
          <div
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {departmentName}
          </div>
          {!isActive ? (
            <div className="mt-2 inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
              Inactive
            </div>
          ) : null}
        </div>
      </div>
      <div className="px-4 pb-4 pt-3 sm:px-5">
        <div className="border-t border-slate-200 pt-3">
          <SkillChips compact skills={employee.skills || []} />
        </div>
        {directReportsCount > 0 ? (
          <p className="mt-3 text-sm font-semibold text-slate-500">
            {directReportsCount} direct report
            {directReportsCount === 1 ? '' : 's'}
          </p>
        ) : null}
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className={`!h-2.5 !w-2.5 !border-0 ${
          isActive ? '!bg-blue-500' : '!bg-rose-500'
        }`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={`!h-2.5 !w-2.5 !border-0 ${
          isActive ? '!bg-blue-500' : '!bg-rose-500'
        }`}
      />
    </div>
  )
}

export default EmployeeFlowNode
