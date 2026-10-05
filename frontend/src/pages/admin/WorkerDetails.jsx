import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { PageLoading, PageError } from '../../components/PageState';
import { workerService } from '../../services/api';
import './WorkerDetails.css';

const TASK_ORDER = ['GRAZING_START', 'LUNCH_BEFORE', 'LUNCH_AFTER', 'GRAZING_END'];

const toBusinessDateKey = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const values = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') values[part.type] = part.value;
  });

  return `${values.year}-${values.month}-${values.day}`;
};

const toMonthKey = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const values = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') values[part.type] = part.value;
  });

  return `${values.year}-${values.month}`;
};

const addMonthsToKey = (monthKey, delta) => {
  const [year, month] = monthKey.split('-').map(Number);
  const nextDate = new Date(year, month - 1 + delta, 1);
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
};

const getCalendarDays = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const leadingEmpty = firstDay.getDay();
  const calendar = [];

  for (let i = 0; i < leadingEmpty; i += 1) {
    calendar.push({ dateKey: null, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day);
    calendar.push({
      dateKey: toBusinessDateKey(date),
      inMonth: true,
      dayNumber: day,
    });
  }

  while (calendar.length % 7 !== 0) {
    calendar.push({ dateKey: null, inMonth: false });
  }

  return calendar;
};

const formatDateLabel = (dateKey) => {
  if (!dateKey) return '—';
  const date = new Date(`${dateKey}T00:00:00+05:30`);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const getDaySummary = (record) => {
  if (!record) return 'No activity';

  const completed = TASK_ORDER.filter((taskKey) => Boolean(record.tasks?.[taskKey]?.completed)).length;
  if (completed === 0) return 'Pending';
  if (completed === TASK_ORDER.length) return '4/4';
  return `${completed}/${TASK_ORDER.length}`;
};

const WorkerDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [monthRecords, setMonthRecords] = useState({});
  const [selectedDate, setSelectedDate] = useState(toBusinessDateKey(new Date()));
  const [currentMonth, setCurrentMonth] = useState(toMonthKey(new Date()));
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await workerService.getById(id);
        setData(response.data || {});
      } catch (err) {
        setError(err.message || 'Unable to load worker');
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  useEffect(() => {
    const loadMonth = async () => {
      if (!id) return;

      try {
        setHistoryLoading(true);
        const response = await workerService.getAttendanceByMonth(id, currentMonth);
        const records = response.data?.records || [];
        const byDate = {};

        records.forEach((record) => {
          if (record?.date) byDate[record.date] = record;
        });

        setMonthRecords(byDate);

        setSelectedDate((prev) => {
          if (prev && prev.startsWith(currentMonth)) {
            return prev;
          }

          const existingDate = Object.keys(byDate).sort()[0] || `${currentMonth}-01`;
          return existingDate;
        });
      } catch (err) {
        setMonthRecords({});
        setSelectedDate(`${currentMonth}-01`);
      } finally {
        setHistoryLoading(false);
      }
    };

    if (id) loadMonth();
  }, [id, currentMonth]);

  const worker = data?.worker || {};
  const attendance = data?.attendance || {};
  const todayStatus = data?.today?.attendanceStatus || attendance?.attendanceStatus || 'PENDING';

  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);

  if (loading) return <PageLoading title="Loading worker details" />;
  if (error) return <PageError title="Worker details unavailable" message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="admin-page">
      <PageHeader title="Worker Details" subtitle="Daily attendance calendar and photo history" />

      <div className="premium-card worker-details-card">
        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
          <div><strong>Name:</strong> {worker.name || worker.username || '—'}</div>
          <div><strong>Phone:</strong> {worker.phone || '—'}</div>
          <div><strong>Work type:</strong> {worker.workType || '—'}</div>
          <div><strong>Today's Status:</strong> {todayStatus}</div>
        </div>

        <section className="worker-calendar" aria-label="Worker attendance calendar">
          <div className="worker-calendar-header">
            <button
              type="button"
              onClick={() => setCurrentMonth((prev) => addMonthsToKey(prev, -1))}
              className="worker-calendar-nav"
            >
              Previous
            </button>

            <strong className="worker-calendar-title">
              {new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', month: 'long', year: 'numeric' }).format(new Date(`${currentMonth}-01T00:00:00+05:30`))}
            </strong>

            <button
              type="button"
              onClick={() => setCurrentMonth((prev) => addMonthsToKey(prev, 1))}
              className="worker-calendar-nav"
            >
              Next
            </button>
          </div>

          <div className="worker-calendar-grid">
            <div className="worker-calendar-weekdays" aria-hidden="true">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="worker-calendar-days" aria-busy={historyLoading}>
              {calendarDays.map((day, index) => {
                const isSelected = day.dateKey && selectedDate === day.dateKey;
                const record = day.dateKey ? monthRecords[day.dateKey] : null;
                const completedTasks = record
                  ? TASK_ORDER.filter((taskKey) => Boolean(record.tasks?.[taskKey]?.completed)).length
                  : 0;
                const statusText = getDaySummary(record);
                const isToday = day.dateKey && toBusinessDateKey(new Date()) === day.dateKey;

                return (
                  <button
                    key={day.dateKey || `empty-${index}`}
                    type="button"
                    onClick={() => {
                      if (!day.dateKey) return;
                      setSelectedDate(day.dateKey);
                      navigate(`/admin/workers/${id}/attendance/${day.dateKey}`);
                    }}
                    disabled={!day.dateKey}
                    className={`worker-calendar-day${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}${record ? ' has-record' : ''}`}
                    aria-label={day.dateKey ? `${formatDateLabel(day.dateKey)}: ${statusText}` : undefined}
                  >
                    {day.dateKey && <span className="worker-calendar-day-number">{day.dayNumber}</span>}
                    {isToday && <span className="worker-calendar-today">Today</span>}
                    {day.dateKey && (
                      <span className="worker-calendar-status" title={statusText}>
                        {record ? `${completedTasks}/4` : 'No log'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {historyLoading && (
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '22px' }}>
            <PageLoading title="Loading month history" />
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerDetails;
