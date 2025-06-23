import React, { useMemo } from 'react';
import { useVirtualization } from '../../hooks/useVirtualization';

/**
 * Virtualized table component for handling large datasets
 */
const VirtualizedTable = ({
  data,
  columns,
  rowHeight = 60,
  containerHeight = 400,
  onRowClick,
  className = ''
}) => {
  const {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  } = useVirtualization({
    items: data,
    itemHeight: rowHeight,
    containerHeight
  });

  const tableStyle = useMemo(() => ({
    height: containerHeight,
    overflow: 'auto'
  }), [containerHeight]);

  const spacerStyle = useMemo(() => ({
    height: totalHeight
  }), [totalHeight]);

  const contentStyle = useMemo(() => ({
    transform: `translateY(${offsetY}px)`
  }), [offsetY]);

  return (
    <div className={`virtualized-table ${className}`}>
      {/* Table Header */}
      <div className="table-header bg-gray-50 border-b border-gray-200">
        <div className="flex">
          {columns.map((column, index) => (
            <div
              key={column.key || index}
              className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
              style={{ width: column.width || 'auto', minWidth: column.minWidth || '100px' }}
            >
              {column.header}
            </div>
          ))}
        </div>
      </div>

      {/* Virtualized Table Body */}
      <div style={tableStyle} onScroll={handleScroll} className="table-body">
        <div style={spacerStyle}>
          <div style={contentStyle}>
            {visibleItems.map((item, index) => (
              <div
                key={item.id || item.index}
                className="table-row flex border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                style={{ height: rowHeight }}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column, colIndex) => (
                  <div
                    key={column.key || colIndex}
                    className={`px-6 py-4 flex items-center ${column.className || ''}`}
                    style={{ width: column.width || 'auto', minWidth: column.minWidth || '100px' }}
                  >
                    {column.render ? column.render(item[column.key], item, item.index) : item[column.key]}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No data available</p>
        </div>
      )}
    </div>
  );
};

export default VirtualizedTable;