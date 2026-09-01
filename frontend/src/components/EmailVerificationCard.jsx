import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { emailVerifyService } from '../services/api';
import { extractErrorMessage } from '../lib/apiNormalize';
import Button from './Button';
import { FiMail, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

/**
 * Email verification UI for the Profile page.
 *
 * Props:
 *  - email         : the user's current verified email (from profile)
 *  - emailVerified : boolean
 *  - onVerified    : (updatedUserInfo) => void — call after successful verify so
 *                    the parent refetches/updates the stored user.
 */
const EmailVerificationCard = ({ email, emailVerified, onVerified }) => {
  const [inputEmail, setInputEmail] = useState(email || '');
  const [stage, setStage] = useState('idle'); // 'idle' | 'otp'
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState(null); // { type, text }
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    setInputEmail(email || '');
  }, [email]);

  // Countdown for resend cooldown + OTP expiry.
  useEffect(() => {
    if (cooldown <= 0 && expiresIn <= 0) return;
    timerRef.current = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
      setExpiresIn((e) => Math.max(0, e - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [cooldown > 0, expiresIn > 0]);

  const flash = (obj) => {
    setMessage(obj);
    setTimeout(() => setMessage(null), 6000);
  };

  const sendMutation = useMutation({
    mutationFn: (mail) => emailVerifyService.sendOtp(mail),
    onSuccess: (res) => {
      setStage('otp');
      setOtp('');
      setCooldown(res.data.cooldownSeconds || 60);
      setExpiresIn(res.data.expiresInSeconds || 600);
      flash({ type: 'success', text: 'Verification code sent to your email.' });
    },
    onError: (err) => {
      flash({ type: 'error', text: extractErrorMessage(err, 'Could not send verification code.') });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (code) => emailVerifyService.confirmOtp(code),
    onSuccess: (res) => {
      setStage('idle');
      setOtp('');
      setInputEmail(res.data.email);
      flash({ type: 'success', text: 'Email verified successfully!' });
      if (onVerified) onVerified({ email: res.data.email, emailVerified: true });
    },
    onError: (err) => {
      flash({ type: 'error', text: extractErrorMessage(err, 'Verification failed.') });
    },
  });

  const resendMutation = useMutation({
    mutationFn: (mail) => emailVerifyService.resendOtp(mail),
    onSuccess: (res) => {
      setOtp('');
      setCooldown(res.data.cooldownSeconds || 60);
      setExpiresIn(res.data.expiresInSeconds || 600);
      flash({ type: 'success', text: 'New verification code sent.' });
    },
    onError: (err) => {
      flash({ type: 'error', text: extractErrorMessage(err, 'Could not resend code.') });
    },
  });

  const handleSend = () => {
    const mail = inputEmail.trim().toLowerCase();
    if (!mail) {
      flash({ type: 'error', text: 'Please enter an email address.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      flash({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    sendMutation.mutate(mail);
  };

  const handleConfirm = () => {
    const code = otp.trim();
    if (!code) {
      flash({ type: 'error', text: 'Please enter the verification code.' });
      return;
    }
    confirmMutation.mutate(code);
  };

  const handleResend = () => {
    resendMutation.mutate(inputEmail.trim().toLowerCase());
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        padding: '20px',
        borderRadius: '16px',
        border: `1px solid ${emailVerified ? 'rgba(34,165,92,0.4)' : 'var(--ds-border)'}`,
        background: emailVerified ? 'rgba(34,165,92,0.05)' : 'var(--ds-surface-muted)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <FiMail size={18} style={{ color: 'var(--ds-primary-strong)' }} />
        <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--ds-text)' }}>Email Verification</h3>
      </div>

      {emailVerified ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 600 }}>
          <FiCheckCircle size={18} />
          <span>{email}</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>✓ Verified</span>
        </div>
      ) : (
        <>
          {message && (
            <div
              className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}
              style={{ marginBottom: '12px' }}
            >
              {message.text}
            </div>
          )}

          {stage === 'idle' ? (
            <>
              <label className="form-label-custom">Email</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <input
                  className="form-input-custom"
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  style={{ flex: 1 }}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSend}
                  disabled={sendMutation.isPending}
                >
                  {sendMutation.isPending ? 'Sending…' : (email ? 'Verify Email' : 'Add Email')}
                </Button>
              </div>
              {!email && (
                <p style={{ margin: '8px 0 0 0', fontSize: '0.82rem', color: 'var(--ds-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiAlertTriangle size={14} /> No email on file yet. Add and verify an email.
                </p>
              )}
              {email && (
                <p style={{ margin: '8px 0 0 0', fontSize: '0.82rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiAlertTriangle size={14} /> Not verified yet.
                </p>
              )}
            </>
          ) : (
            <div>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--ds-text-muted)' }}>
                We sent a verification code to: <strong style={{ color: 'var(--ds-text)' }}>{inputEmail}</strong>
              </p>
              <label className="form-label-custom">Verification Code</label>
              <input
                className="form-input-custom"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code"
                style={{ letterSpacing: '0.3em', fontSize: '1.1rem' }}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                <Button variant="primary" size="sm" onClick={handleConfirm} disabled={confirmMutation.isPending}>
                  {confirmMutation.isPending ? 'Verifying…' : 'Verify OTP'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResend}
                  disabled={resendMutation.isPending || cooldown > 0}
                >
                  {cooldown > 0 ? `Resend in ${fmt(cooldown)}` : 'Resend OTP'}
                </Button>
              </div>
              {expiresIn > 0 && (
                <p style={{ margin: '10px 0 0 0', fontSize: '0.8rem', color: 'var(--ds-text-muted)' }}>
                  Code expires in {fmt(expiresIn)}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmailVerificationCard;
