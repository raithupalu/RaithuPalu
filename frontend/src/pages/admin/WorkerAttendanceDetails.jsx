import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { PageLoading, PageError } from '../../components/PageState';
import { workerService } from '../../services/api';
import { API_BASE_URL } from '../../config/env';

const TASK_ORDER = ['GRAZING_START', 'LUNCH_BEFORE', 'LUNCH_AFTER', 'GRAZING_END'];
const TASK_LABELS = {
  GRAZING_START: 'Start Grazing',
  LUNCH_BEFORE: 'Before Lunch',
  LUNCH_AFTER: 'After Lunch',
  GRAZING_END: 'End Grazing',
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

const formatTimeLabel = (isoValue) => {
  if (!isoValue) return '—';
  const date = new Date(isoValue);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const resolvePhotoUrl = (photoUrl) => {
  if (!photoUrl) return '';
  if (/^https?:\/\//i.test(photoUrl)) return photoUrl;
  if (photoUrl.startsWith('/')) return `${API_BASE_URL}${photoUrl}`;
  return `${API_BASE_URL}/${photoUrl}`;
};

const getTaskStatus = (taskKey, tasks, taskIndex) => {
  if (tasks?.[taskKey]?.completed) return 'Completed';

  const previousTaskKey = TASK_ORDER[taskIndex - 1];
  if (taskIndex > 0 && previousTaskKey && !tasks?.[previousTaskKey]?.completed) {
    return 'Locked';
  }

  return 'Pending';
};

const buildEmptyRecord = (dateKey) => ({
  date: dateKey,
  attendanceStatus: 'NO ACTIVITY',
  progress: 0,
  total: TASK_ORDER.length,
  tasks: Object.fromEntries(
    TASK_ORDER.map((taskKey) => [taskKey, { completed: false, photoUrl: '', timestamp: null }])
  ),
});

const WorkerAttendanceDetails = () => {
  const navigate = useNavigate();
  const { workerId, date } = useParams();
  const [worker, setWorker] = useState(null);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [previewMeta, setPreviewMeta] = useState({ task: '', date: '' });

  useEffect(() => {
    const load = async () => {
      if (!workerId || !date) {
        setError('Worker attendance date is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await workerService.getAttendanceByDate(workerId, date);
        const payload = response.data || {};
        setWorker(payload.worker || null);
        setRecord(payload.record || null);
      } catch (err) {
        if (err?.response?.status === 404) {
          setWorker(null);
          setRecord(buildEmptyRecord(date));
          return;
        }

        setError(err.message || 'Unable to load attendance details');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [workerId, date]);

  const tasks = useMemo(() => {
    if (!record) return [];

    return TASK_ORDER.map((taskKey, index) => ({
      key: taskKey,
      label: TASK_LABELS[taskKey],
      state: record.tasks?.[taskKey] || {},
      status: getTaskStatus(taskKey, record.tasks || {}, index),
    }));
  }, [record]);

  if (loading) return <PageLoading title="Loading attendance details" />;
  if (error) return <PageError title="Attendance details unavailable" message={error} onRetry={() => window.location.reload()} />;

  const attendanceStatus = record?.attendanceStatus || 'NO ACTIVITY';
  const progressText = `${record?.progress || 0} / ${record?.total || TASK_ORDER.length}`;

  return (
    <div className="admin-page">
      <PageHeader title="Worker Attendance" subtitle="Task details and photo history" />

      <div className="premium-card" style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => navigate(`/admin/workers/${workerId}`)}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#0f766e',
            fontWeight: 700,
            cursor: 'pointer',
            padding: 0,
            marginBottom: '18px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ← Back to Calendar
        </button>

        <div style={{ marginBottom: '22px' }}>
          <h2 style={{ margin: '0 0 10px' }}>{formatDateLabel(date)}</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div><strong>Worker:</strong> {worker?.name || worker?.username || '—'}</div>
            <div><strong>Phone:</strong> {worker?.phone || '—'}</div>
            <div><strong>Work Type:</strong> {worker?.workType || '—'}</div>
            <div><strong>Attendance:</strong> {attendanceStatus}</div>
            <div><strong>Progress:</strong> {progressText}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '18px' }}>
          <h3 style={{ margin: 0 }}>Today's Tasks</h3>

          {!record ? (
            <div style={{ color: '#6b7280' }}>No task activity has been recorded for this date.</div>
          ) : (
            tasks.map((task) => {
              const taskState = task.state || {};
              const hasPhoto = Boolean(taskState.photoUrl);
              const isCompleted = Boolean(taskState.completed);

              return (
                <div key={task.key} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                        {task.completed ? '✓' : '○'} {task.label}
                      </div>
                      <div style={{ color: '#6b7280' }}>
                        {task.status === 'Completed'
                          ? 'Completed'
                          : task.status === 'Locked'
                            ? 'Locked'
                            : 'Pending'}
                      </div>
                      {taskState.timestamp && (
                        <div style={{ color: '#4b5563', marginTop: '4px' }}>Time: {formatTimeLabel(taskState.timestamp)}</div>
                      )}
                    </div>

                    {hasPhoto && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage(resolvePhotoUrl(taskState.photoUrl));
                          setPreviewMeta({ task: task.label, date });
                        }}
                        style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                      >
                        View Photo
                      </button>
                    )}
                  </div>

                  {hasPhoto ? (
                    <img
                      src={resolvePhotoUrl(taskState.photoUrl)}
                      alt={task.label}
                      onClick={() => {
                        setPreviewImage(resolvePhotoUrl(taskState.photoUrl));
                        setPreviewMeta({ task: task.label, date });
                      }}
                      style={{ width: '100%', maxWidth: '220px', height: '140px', objectFit: 'cover', borderRadius: '10px', marginTop: '12px', border: '1px solid #e5e7eb', cursor: 'pointer' }}
                    />
                  ) : (
                    <div style={{ marginTop: '12px', color: '#6b7280' }}>
                      {isCompleted ? 'Photo unavailable' : 'No photo'}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(520px, 92vw)',
              background: '#fff',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 20px 45px rgba(15, 23, 42, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong>{previewMeta.task}</strong>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                style={{ border: 'none', background: '#f3f4f6', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
            <div style={{ color: '#4b5563', marginBottom: '12px' }}>{formatDateLabel(previewMeta.date)}</div>
            <img src={previewImage} alt={previewMeta.task} style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '12px', background: '#f8fafc' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerAttendanceDetails;
