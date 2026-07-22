import React from 'react';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

const DataTable = ({
  columns = [],
  data = [],
  emptyMessage = 'No records found',
  footer = null,
  animate = true,
  className = '',
  tableClassName = 'ds-table',
  bodyClassName = '',
  rowClassName = '',
  renderRow = null,
}) => {
  const safeData = Array.isArray(data) ? data : [];

  const renderCell = (col, value, row, rowIndex, colIndex) => {
    if (col.render) {
      return col.render(value, row, rowIndex, colIndex);
    }

    if (value === null || value === undefined || value === '') {
      return '—';
    }

    return value;
  };

  return (
    <div className={`table-wrapper overflow-x-auto ${className}`.trim()}>
      <table className={tableClassName}>
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th
                key={col.key || index}
                className={col.headerClassName || col.className || ''}
                style={col.headerStyle || col.style || {}}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={bodyClassName}>
          {safeData.length === 0 ? (
            <tr>
               <td
                 colSpan={columns.length}
                 className="ds-table__empty"
               >
                 {emptyMessage}
               </td>
            </tr>
          ) : (
            safeData.map((row, rowIndex) => {
              const rowKey = row._id || row.id || rowIndex;

              if (renderRow) {
                return <React.Fragment key={rowKey}>{renderRow(row, rowIndex)}</React.Fragment>;
              }

              const rowContent = (
                <tr className={rowClassName}>
                  {columns.map((col, colIndex) => {
                    const value = col.key ? row[col.key] : undefined;
                    return (
                      <td
                        key={col.key || colIndex}
                        className={col.className || ''}
                        style={col.style || {}}
                      >
                        {renderCell(col, value, row, rowIndex, colIndex)}
                      </td>
                    );
                  })}
                </tr>
              );

              if (animate) {
                return (
                  <motion.tr
                    key={rowKey}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: Math.min(0.03 * rowIndex, 0.3) }}
                    className={rowClassName}
                  >
                    {columns.map((col, colIndex) => {
                      const value = col.key ? row[col.key] : undefined;
                      return (
                        <td
                          key={col.key || colIndex}
                          className={col.className || ''}
                          style={col.style || {}}
                        >
                          {renderCell(col, value, row, rowIndex, colIndex)}
                        </td>
                      );
                    })}
                  </motion.tr>
                );
              }

              return <React.Fragment key={rowKey}>{rowContent}</React.Fragment>;
            })
          )}
        </tbody>
        {footer}
      </table>
    </div>
  );
};

export default DataTable;
