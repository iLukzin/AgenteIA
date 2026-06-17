import clsx from 'clsx';

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={clsx('bg-white rounded-xl border border-gray-200 p-5', className)}
    {...props}
  />
);

export const StatCard = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) => (
  <Card>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-2xl font-medium text-gray-900 mt-1">{value}</p>
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </Card>
);
