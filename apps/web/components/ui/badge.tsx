import clsx from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-50 text-blue-800',
  closed: 'bg-gray-100 text-gray-700',
  transferred: 'bg-amber-50 text-amber-800',
  scheduled: 'bg-blue-50 text-blue-800',
  confirmed: 'bg-green-50 text-green-800',
  cancelled: 'bg-red-50 text-red-800',
  suspended: 'bg-amber-50 text-amber-800',
  completed: 'bg-gray-100 text-gray-700',
  no_show: 'bg-red-50 text-red-800',
  new: 'bg-blue-50 text-blue-800',
  qualified: 'bg-amber-50 text-amber-800',
  proposal: 'bg-purple-50 text-purple-800',
  won: 'bg-green-50 text-green-800',
  lost: 'bg-red-50 text-red-800',
  active: 'bg-green-50 text-green-800',
  disconnected: 'bg-gray-100 text-gray-600',
  processing: 'bg-amber-50 text-amber-800',
  ready: 'bg-green-50 text-green-800',
  failed: 'bg-red-50 text-red-800',
};

export const Badge = ({ status }: { status: string }) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      STATUS_COLORS[status] || 'bg-gray-100 text-gray-700',
    )}
  >
    {status}
  </span>
);
