const PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f43f5e', '#a855f7', '#10b981', '#f59e0b', '#0ea5e9',
  '#d946ef', '#64748b', '#dc2626', '#7c3aed', '#059669',
];

// Deterministic color derived from employee UUID — stable across sessions, no DB needed
export function getEmployeeColor(employeeId: string): string {
  let hash = 0;
  for (const c of employeeId) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

// Returns a readable text color (white or dark) for a given background hex color
export function getTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#1f2937' : '#ffffff';
}
