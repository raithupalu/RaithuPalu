import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { workerService } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import { PageLoading, PageError } from '../../components/PageState';
import { API_BASE_URL } from '../../config/env';

const WorkerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState('');
  const [capturedFile, setCapturedFile] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopCameraStream = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError('');
    setCameraReady(false);
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera is not supported on this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraReady(true);
    } catch (err) {
      if (err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setCameraError('Camera permission is required to submit this task.');
      } else if (err && err.name === 'NotFoundError') {
        setCameraError('No camera is available on this device.');
      } else if (err && err.name === 'NotReadableError') {
        setCameraError('The camera is already in use by another app.');
      } else {
        setCameraError('Camera is unavailable right now. Please try again.');
      }
    }
  }, [stopCameraStream]);

  useEffect(() => {
    if (!selectedTask) {
      stopCameraStream();
      setCameraReady(false);
      return undefined;
    }

    startCamera();
    return () => stopCameraStream();
  }, [selectedTask, startCamera, stopCameraStream]);

  useEffect(() => () => {
    stopCameraStream();
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
    }
  }, [capturedPreview, stopCameraStream]);

  const fetchStatus = async () => {
    try {
      setError('');
      const response = await workerService.getMyTasks();
      setData(response.data || {});
    } catch (err) {
      setError(err.message || 'Unable to load today\'s tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const tasks = useMemo(() => data?.tasks || [], [data]);
  const completed = tasks.filter((t) => t.completed).length;
  const totalTasks = data?.totalTasks || tasks.length || 4;

  const resetModalState = () => {
    stopCameraStream();
    setSelectedTask(null);
    setCameraReady(false);
    setCameraError('');
    setSubmitError('');
    setSubmitting(false);
    setCapturedFile(null);
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
    }
    setCapturedPreview('');
  };

  const handleOpenTask = (task) => {
    if (!task || task.completed || task.isLocked) return;
    resetModalState();
    setSelectedTask(task);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !streamRef.current) {
      setCameraError('Camera feed is unavailable. Please try again.');
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setCameraError('Unable to capture the photo from the camera.');
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError('Photo capture failed. Please try again.');
        return;
      }

      stopCameraStream();
      setCameraReady(false);
      const file = new File([blob], `${selectedTask.taskKey}.jpg`, { type: 'image/jpeg' });
      setCapturedFile(file);
      setCapturedPreview(URL.createObjectURL(blob));
      setSubmitError('');
    }, 'image/jpeg', 0.92);
  };

  const handleRetake = async () => {
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
    }
    setCapturedPreview('');
    setCapturedFile(null);
    setSubmitError('');
    setCameraError('');
    await startCamera();
  };

  const handleSubmitTask = async () => {
    if (!selectedTask || !capturedFile) {
      setSubmitError('A photo is required before submitting this task.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');

      const formData = new FormData();
      formData.append('photo', capturedFile);
      await workerService.submitTask(selectedTask.taskKey, formData);

      const refreshed = await workerService.getMyTasks();
      setData(refreshed.data || {});
      resetModalState();
    } catch (err) {
      setSubmitError(err.message || 'Unable to submit this task.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoading title="Loading worker dashboard" />;
  if (error) return <PageError title="Worker dashboard unavailable" message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="admin-page">
      <PageHeader title="Worker Dashboard" subtitle="Daily buffalo keeper checklist and attendance" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="stats-grid stats-grid--dashboard"
        style={{ marginBottom: '24px' }}
      >
        <div className="ds-stat-card">
          <div className="stat-icon" aria-hidden>✅</div>
          <div className="stat-content">
            <p className="stat-label">Completed</p>
            <h2 className="stat-value">{completed}/{totalTasks}</h2>
          </div>
          <div className="stat-accent-line" />
        </div>

        <div className="ds-stat-card">
          <div className="stat-icon" aria-hidden>📅</div>
          <div className="stat-content">
            <p className="stat-label">Attendance</p>
            <h2 className="stat-value">{data?.attendanceStatus || 'PENDING'}</h2>
          </div>
          <div className="stat-accent-line" />
        </div>
      </motion.div>

      <div className="premium-card" style={{ padding: '24px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Today&apos;s task checklist</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {tasks.map((task, index) => {
            const isAvailable = Boolean(task.isAvailable) && !task.completed;
            const isLocked = Boolean(task.isLocked) && !task.completed;
            const statusText = task.completed ? 'Completed' : isAvailable ? 'Available' : isLocked ? 'Locked' : 'Pending';
            const buttonText = task.completed ? 'Completed' : isAvailable ? 'Open' : 'Locked';

            return (
              <div
                key={task.taskKey}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  background: task.completed ? '#ecfdf5' : isAvailable ? '#eff6ff' : '#f9fafb',
                }}
              >
                <div>
                  <strong>{index + 1}. {task.label}</strong>
                  <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '4px' }}>
                    {statusText}
                  </div>
                  {task.timestamp && (
                    <div style={{ color: '#374151', fontSize: '0.8rem', marginTop: '6px' }}>
                      {new Date(task.timestamp).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                    </div>
                  )}
                  {task.photoUrl && (
                    <div style={{ marginTop: '8px' }}>
                      <img
                        src={task.photoUrl.startsWith('http') ? task.photoUrl : `${API_BASE_URL}${task.photoUrl}`}
                        alt={task.label}
                        style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenTask(task)}
                  disabled={task.completed || isLocked || submitting}
                  style={{
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    background: task.completed ? '#dcfce7' : isAvailable ? '#2563eb' : '#e5e7eb',
                    color: task.completed ? '#166534' : isAvailable ? '#fff' : '#6b7280',
                    fontWeight: 700,
                    cursor: task.completed || isLocked || submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting && selectedTask?.taskKey === task.taskKey ? 0.7 : 1,
                  }}
                >
                  {buttonText}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetModalState}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 9999,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={(event) => event.stopPropagation()}
              style={{
                width: 'min(92vw, 560px)',
                background: '#fff',
                borderRadius: '20px',
                boxShadow: '0 30px 80px rgba(15, 23, 42, 0.25)',
                padding: '20px',
                border: '1px solid rgba(15, 118, 110, 0.12)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#163f2a' }}>{selectedTask.label}</h3>
                <button
                  type="button"
                  onClick={resetModalState}
                  aria-label="Close task modal"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '1.7rem',
                    cursor: 'pointer',
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>

              {cameraError ? (
                <div style={{ display: 'grid', gap: '16px', textAlign: 'center' }}>
                  <div style={{ color: '#1f2937', fontWeight: 600, lineHeight: 1.5 }}>{cameraError}</div>
                  <button
                    type="button"
                    onClick={startCamera}
                    style={{
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontWeight: 700,
                      padding: '12px 18px',
                      cursor: 'pointer',
                    }}
                  >
                    Try Again
                  </button>
                </div>
              ) : capturedPreview ? (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ fontWeight: 700, color: '#163f2a', textAlign: 'center' }}>Photo preview</div>
                  <img
                    src={capturedPreview}
                    alt={selectedTask.label}
                    style={{
                      width: '100%',
                      aspectRatio: '4 / 3',
                      objectFit: 'cover',
                      borderRadius: '14px',
                      border: '1px solid #e5e7eb',
                      background: '#f8fafc',
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={handleRetake}
                      disabled={submitting}
                      style={{
                        background: '#e2e8f0',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontWeight: 700,
                        cursor: submitting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Retake
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitTask}
                      disabled={submitting}
                      style={{
                        background: submitting ? '#86efac' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontWeight: 700,
                        cursor: submitting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {submitting ? 'Submitting...' : 'Submit Task'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ fontWeight: 700, color: '#163f2a', textAlign: 'center' }}>Live camera preview</div>
                  <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #dbe5e1', background: '#0f172a' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        aspectRatio: '4 / 3',
                        objectFit: 'cover',
                        display: 'block',
                        background: '#0f172a',
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!cameraReady || submitting}
                    style={{
                      background: cameraReady ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#94a3b8',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontWeight: 700,
                      padding: '12px 16px',
                      cursor: cameraReady ? 'pointer' : 'not-allowed',
                    }}
                  >
                    📷 Take Photo
                  </button>
                </div>
              )}

              {submitError && (
                <div style={{ marginTop: '16px', color: '#dc2626', fontWeight: 600, textAlign: 'center' }}>{submitError}</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkerDashboard;
