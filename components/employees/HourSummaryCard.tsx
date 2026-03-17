'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getHoursColor } from '@/lib/utils/schedule';
import type { EmployeeWithHours } from '@/types';

interface HourSummaryCardProps {
  employee: EmployeeWithHours;
  compact?: boolean;
}

export function HourSummaryCard({ employee, compact = false }: HourSummaryCardProps) {
  const colors = getHoursColor(employee.usage_percent);
  const typeName = (employee as any).employee_types?.name ?? 'Unknown';

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium truncate flex-1">{employee.name}</span>
        <span className={`text-xs font-mono ${colors.text}`}>
          {employee.scheduled_hours}h / {employee.max_hours}h
        </span>
        <div className="w-20">
          <Progress
            value={Math.min(employee.usage_percent, 100)}
            className="h-1.5"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-900">{employee.name}</p>
          <p className="text-xs text-gray-500">{typeName}</p>
        </div>
        <Badge className={colors.badge} variant="outline">
          {employee.usage_percent >= 100
            ? 'At Limit'
            : employee.usage_percent >= 80
            ? 'Near Limit'
            : 'Available'}
        </Badge>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Scheduled</span>
          <span className={`font-semibold ${colors.text}`}>
            {employee.scheduled_hours}h of {employee.max_hours}h
          </span>
        </div>
        <Progress
          value={Math.min(employee.usage_percent, 100)}
          className="h-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-gray-50 rounded p-2">
          <p className="text-lg font-bold text-gray-900">{employee.scheduled_hours}</p>
          <p className="text-xs text-gray-500">Scheduled</p>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <p className={`text-lg font-bold ${colors.text}`}>{employee.remaining_hours}</p>
          <p className="text-xs text-gray-500">Remaining</p>
        </div>
      </div>
    </div>
  );
}
