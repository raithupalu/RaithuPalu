import React from 'react';
import DataTable from './DataTable';

const ExpenseTable = ({ expenses = [], onDelete }) => {
  const safeExpenses = expenses || [];

  const getTypeLabel = (type) => {
    const labels = {
      feed: 'Feed',
      medical: 'Medical',
      maintenance: 'Maintenance',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      feed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
      medical: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
      maintenance: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
      other: 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300'
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString();
  };

  const total = safeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const columns = [
    {
      label: 'Date',
      key: 'date',
      className: 'py-3 px-4 text-sm text-slate-600 dark:text-slate-300',
      render: (val) => formatDate(val),
    },
    {
      label: 'Type',
      key: 'type',
      className: 'py-3 px-4',
      render: (val) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(val)}`}>
          {getTypeLabel(val)}
        </span>
      ),
    },
    {
      label: 'Description',
      key: 'description',
      className: 'py-3 px-4 text-sm text-slate-600 dark:text-slate-300',
    },
    {
      label: 'Amount',
      key: 'amount',
      className: 'py-3 px-4 text-right font-medium text-slate-800 dark:text-white',
      render: (val) => `₹${(Number(val) || 0).toLocaleString()}`,
    },
  ];

  if (onDelete) {
    columns.push({
      label: 'Actions',
      key: '_id',
      className: 'py-3 px-4 text-right',
      render: (val) => (
        <button
          onClick={() => onDelete(val)}
          className="text-rose-500 hover:text-rose-600 text-sm font-medium"
        >
          Delete
        </button>
      ),
    });
  }

  const footer = expenses.length > 0 ? (
    <tfoot>
      <tr className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <td colSpan={onDelete ? 5 : 4} className="px-4 py-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600 dark:text-slate-400">Total Expenses</span>
            <span className="text-lg font-bold text-slate-800 dark:text-white">
              ₹{total.toLocaleString()}
            </span>
          </div>
        </td>
      </tr>
    </tfoot>
  ) : null;

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
      <DataTable
        columns={columns}
        data={safeExpenses}
        emptyMessage="No expenses recorded"
        footer={footer}
      />
    </div>
  );
};

export default ExpenseTable;