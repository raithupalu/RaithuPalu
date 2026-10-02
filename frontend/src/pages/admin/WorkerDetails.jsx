import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { PageLoading, PageError } from '../../components/PageState';
import { workerService } from '../../services/api';

const TASK_ORDER = ['GRAZING_START', 'LUNCH_BEFORE', 'LUNCH_AFTER', 'GRAZING_END'];
const TASK_LABELS = {
  GRAZING_START: 'Start Grazing',
  LUNCH_BEFORE: 'Before Lunch',
  LUNCH_AFTER: 'After Lunch',
  GRAZING_END: 'End Grazing',
};

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

      <div className="premium-card" style={{ padding: '24px', maxWidth: '980px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
          <div><strong>Name:</strong> {worker.name || worker.username || '—'}</div>
          <div><strong>Phone:</strong> {worker.phone || '—'}</div>
          <div><strong>Work type:</strong> {worker.workType || '—'}</div>
          <div><strong>Today's Status:</strong> {todayStatus}</div>
        </div>

        <div style={{ marginBottom: '20px', padding: '18px 16px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setCurrentMonth((prev) => addMonthsToKey(prev, -1))}
              style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
            >
              Previous Month
            </button>

            <strong style={{ fontSize: '1.15rem' }}>
              {new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', month: 'long', year: 'numeric' }).format(new Date(`${currentMonth}-01T00:00:00+05:30`))}
            </strong>

            <button
              type="button"
              onClick={() => setCurrentMonth((prev) => addMonthsToKey(prev, 1))}
              style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
            >
              Next Month
            </button>
          </div>

          <div style={{ marginTop: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '8px', textAlign: 'center' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} style={{ fontWeight: 700, color: '#4b5563', paddingBottom: '8px' }}>{day}</div>
              ))}

              {calendarDays.map((day, index) => {
                const isSelected = day.dateKey && selectedDate === day.dateKey;
                const record = day.dateKey ? monthRecords[day.dateKey] : null;
                const statusText = getDaySummary(record);

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
                    style={{
                      minHeight: '92px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #0f766e' : '1px solid #e5e7eb',
                      background: isSelected ? '#ecfeff' : day.inMonth ? '#fff' : '#f9fafb',
                      padding: '8px 6px',
                      textAlign: 'left',
                      cursor: day.dateKey ? 'pointer' : 'default',
                      color: '#111827',
                      opacity: day.inMonth ? 1 : 0.5,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{day.dateKey ? new Date(`${day.dateKey}T00:00:00+05:30`).getDate() : ''}</span>
                      {day.dateKey && toBusinessDateKey(new Date()) === day.dateKey && (
                        <span style={{ fontSize: '10px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '999px', padding: '2px 6px' }}>Today</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#374151', fontWeight: 600 }}>
                      {statusText}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

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
