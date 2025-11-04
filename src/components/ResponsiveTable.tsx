import React, { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => ReactNode;
  className?: string;
  mobileLabel?: string; // Custom label for mobile view
  hideOnMobile?: boolean; // Hide this column on mobile
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string | number;
  onRowClick?: (item: T, index: number) => void;
  emptyMessage?: string;
  className?: string;
  cardClassName?: string;
  isLoading?: boolean;
  mobileCardLayout?: 'stacked' | 'grid'; // Layout style for mobile cards
}

function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
  className = '',
  cardClassName = '',
  isLoading = false,
  mobileCardLayout = 'stacked'
}: ResponsiveTableProps<T>) {
  // Filter columns for mobile (excluding hideOnMobile columns)
  const mobileColumns = columns.filter(col => !col.hideOnMobile);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center p-8 sm:p-12 text-gray-500">
        <p className="text-sm sm:text-base">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className={`hidden md:block overflow-x-auto ${className}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr
                key={keyExtractor(item, index)}
                onClick={() => onRowClick?.(item, index)}
                className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 lg:px-6 py-4 whitespace-nowrap text-sm ${column.className || ''}`}
                  >
                    {column.render ? column.render(item, index) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className={`md:hidden ${mobileCardLayout === 'grid' ? 'grid grid-cols-1 gap-3 sm:gap-4' : 'space-y-3 sm:space-y-4'}`}>
        {data.map((item, index) => (
          <div
            key={keyExtractor(item, index)}
            onClick={() => onRowClick?.(item, index)}
            className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 ${
              onRowClick ? 'cursor-pointer active:bg-gray-50 touch-manipulation' : ''
            } ${cardClassName}`}
          >
            {mobileColumns.map((column, colIndex) => {
              const value = column.render ? column.render(item, index) : item[column.key];
              const label = column.mobileLabel || column.header;

              return (
                <div
                  key={column.key}
                  className={`${colIndex !== 0 ? 'mt-3' : ''} ${column.className || ''}`}
                >
                  {/* Label */}
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {label}
                  </div>
                  {/* Value */}
                  <div className="text-sm text-gray-900">
                    {value || '-'}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

export default ResponsiveTable;
