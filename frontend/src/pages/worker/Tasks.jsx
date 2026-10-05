import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PageHeader from '../../components/PageHeader';
import { PageLoading, PageError } from '../../components/PageState';
import { workerService } from '../../services/api';
import { API_BASE_URL } from '../../config/env';

const WorkerTasks = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState('');
  const [capturedFile, setCapturedFile] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState('environment');
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
          facingMode: { ideal: cameraFacingMode },
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
  }, [cameraFacingMode, stopCameraStream]);

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

  const fetchTasks = async () => {
    try {
      const response = await workerService.getMyTasks();
      setData(response.data || {});
    } catch (err) {
      setError(err.message || 'Unable to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const tasks = useMemo(() => data?.tasks || [], [data]);

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
      setSubmitError(err.message || 'Unable to submit the task.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoading title="Loading tasks" />;
  if (error) return <PageError title="Tasks unavailable" message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="admin-page">
      <PageHeader title="Daily Tasks" subtitle="Buffalo keeper task flow" />
      <div className="premium-card" style={{ padding: '24px' }}>
        {tasks.map((task) => (
          <div key={task.taskKey} style={{ borderBottom: '1px solid #e5e7eb', padding: '12px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
              <div>
                <strong>{task.label}</strong>
                <div style={{ color: '#6b7280', marginTop: '6px' }}>
                  {task.completed ? 'Completed' : 'Not completed'}
                </div>
                {task.photoUrl && (
                  <img
                    src={task.photoUrl.startsWith('http') ? task.photoUrl : `${API_BASE_URL}${task.photoUrl}`}
                    alt={task.label}
                    style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px' }}
                  />
                )}
              </div>

              <button
                type="button"
                onClick={() => handleOpenTask(task)}
                disabled={task.completed || submitting}
                style={{
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  background: task.completed ? '#dcfce7' : '#2563eb',
                  color: task.completed ? '#166534' : '#fff',
                  fontWeight: 700,
                  cursor: task.completed || submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {task.completed ? 'Done' : 'Open'}
              </button>
            </div>
          </div>
        ))}
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ fontWeight: 700, color: '#163f2a' }}>Live camera preview</div>
                    <button
                      type="button"
                      onClick={() => setCameraFacingMode((mode) => mode === 'environment' ? 'user' : 'environment')}
                      disabled={!cameraReady || submitting}
                      aria-label={cameraFacingMode === 'environment' ? 'Switch to front camera' : 'Switch to rear camera'}
                      style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', background: '#fff', color: '#163f2a', fontWeight: 700, cursor: cameraReady && !submitting ? 'pointer' : 'not-allowed' }}
                    >
                      {cameraFacingMode === 'environment' ? 'Front camera' : 'Rear camera'}
                    </button>
                  </div>
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
                        transform: cameraFacingMode === 'user' ? 'scaleX(-1)' : 'none',
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

export default WorkerTasks;
