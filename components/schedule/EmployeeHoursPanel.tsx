'use client';

import { getEmployeeColor } from '@/lib/utils/colors';
import { getHoursColor } from '@/lib/utils/schedule';
import type { EmployeeWithHours } from '@/types';

interface EmployeeHoursPanelProps {
  employees: EmployeeWithHours[];
}

export function EmployeeHoursPanel({ employees }: EmployeeHoursPanelProps) {
  return (
    <div className="w-56 shrink-0 border rounded-xl bg-white overflow-hidden">
      <div className="px-3 py-2 border-b bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Employee Hours
        </h3>
      </div>
      <div className="overflow-y-auto max-h-[480px] divide-y divide-gray-100">
        {employees.length === 0 && (
          <p className="text-xs text-gray-400 p-3">No employees.</p>
        )}
        {employees.map((emp) => {
          const color = getEmployeeColor(emp.id);
          const colorClass = getHoursColor(emp.usage_percent);
          const statusLabel =
            emp.usage_percent >= 100
              ? 'At Limit'
              : emp.usage_percent >= 80
              ? 'Near Limit'
              : 'Available';

          return (
            <div key={emp.id} className="flex items-start gap-2 px-3 py-2">
              {/* Colored dot */}
              <span
                className="mt-0.5 w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-800 truncate">{emp.name}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-gray-500">
                    {emp.scheduled_hours}h / {emp.max_hours}h
                  </span>
                  <span className={`text-[10px] font-medium ${colorClass.text}`}>
                    {statusLabel}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      emp.usage_percent >= 100
                        ? 'bg-red-500'
                        : emp.usage_percent >= 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(emp.usage_percent, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {emp.remaining_hours}h remaining
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
