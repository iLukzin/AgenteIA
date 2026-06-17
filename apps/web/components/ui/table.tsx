import clsx from 'clsx';

export const Table = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-x-auto rounded-xl border border-gray-200">
    <table className="w-full text-sm">{children}</table>
  </div>
);

export const Thead = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-gray-50 text-left text-gray-500">
    <tr>{children}</tr>
  </thead>
);

export const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-3 font-medium">{children}</th>
);

export const Td = ({
  children,
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={clsx('px-4 py-3 border-t border-gray-100', className)} {...props}>
    {children}
  </td>
);

export const Tr = ({ children }: { children: React.ReactNode }) => (
  <tr className="hover:bg-gray-50">{children}</tr>
);
