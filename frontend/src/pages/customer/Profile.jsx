import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/api';
import { extractErrorMessage } from '../../lib/apiNormalize';
import { PageLoading, PageError } from '../../components/PageState';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import EmailVerificationCard from '../../components/EmailVerificationCard';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import './CustomerPages.css';

const profileKey = ['customer', 'profile'];

// ── Field-level validation (mirrors backend rules) ──
const validators = {
  username: (v) => {
    const val = (v || '').trim();
    if (!val) return 'Username is required.';
    if (val.length < 3) return 'Username must be at least 3 characters.';
    if (val.length > 30) return 'Username cannot exceed 30 characters.';
    return null;
  },
  email: (v) => {
    const val = (v || '').trim();
    if (val === '') return null; // email is optional
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email address.';
    return null;
  },
  phone: (v) => {
    const digits = (v || '').replace(/\D/g, '');
    if (digits === '') return null; // phone is optional
    if (digits.length < 10) return 'Enter a valid 10-digit phone number.';
    return null;
  },
};

const FieldError = ({ error }) =>
  error ? <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '4px 0 0 0' }}>{error}</p> : null;

const PasswordInput = ({ value, onChange, placeholder, autoComplete }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        className="form-input-custom"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{ paddingRight: '44px' }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        style={{
          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
          background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ds-text-muted)',
          display: 'flex', alignItems: 'center', padding: '4px',
        }}
        aria-label={show ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
      </button>
    </div>
  );
};

const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  // ── Profile data from the real backend ──
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: profileKey,
    queryFn: async () => {
      const res = await profileService.get();
      return res.data.user;
    },
  });

  // ── Personal info form state ──
  const [form, setForm] = useState({ username: '', phone: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [editing, setEditing] = useState(false);
  const [infoMsg, setInfoMsg] = useState(null);

  // Populate form when backend data arrives / changes
  useEffect(() => {
    if (data) {
      setForm({
        username: data.username || '',
        phone: data.phone || '',
      });
    }
  }, [data]);

  // ── Password form state ──
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdMsg, setPwdMsg] = useState(null);

  const flash = (setter, obj) => {
    setter(obj);
    setTimeout(() => setter(null), 5000);
  };

  // ── Update profile mutation ──
  const updateMutation = useMutation({
    mutationFn: (payload) => profileService.update(payload),
    onSuccess: (res) => {
      const updatedUser = res.data.user;
      // Persist the authoritative server data in react-query + auth context.
      refetch();
      updateUser({ username: updatedUser.username, email: updatedUser.email, role: updatedUser.role });
      setEditing(false);
      setFieldErrors({});
      flash(setInfoMsg, { type: 'success', text: 'Profile updated successfully.' });
    },
    onError: (err) => {
      flash(setInfoMsg, { type: 'error', text: extractErrorMessage(err, 'Could not update profile.') });
    },
  });

  // ── Change password mutation ──
  const pwdMutation = useMutation({
    mutationFn: (payload) => profileService.changePassword(payload),
    onSuccess: () => {
      setPwd({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setPwdErrors({});
      flash(setPwdMsg, { type: 'success', text: 'Password changed successfully.' });
    },
    onError: (err) => {
      flash(setPwdMsg, { type: 'error', text: extractErrorMessage(err, 'Could not change password.') });
    },
  });

  const handleFieldChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    // Clear a field error as soon as the user starts typing again.
    setFieldErrors((e) => (e[key] ? { ...e, [key]: null } : e));
  };

  const handleSave = (e) => {
    e.preventDefault();
    const errors = {
      username: validators.username(form.username),
      phone: validators.phone(form.phone),
    };
    const hasErrors = Object.values(errors).some(Boolean);
    setFieldErrors(errors);
    if (hasErrors) return;
    updateMutation.mutate({
      username: form.username.trim(),
      phone: form.phone.trim() || null,
    });
  };

  const handleCancel = () => {
    // Restore form to the last saved backend values, discarding unsaved edits.
    if (data) {
      setForm({
        username: data.username || '',
        phone: data.phone || '',
      });
    }
    setFieldErrors({});
    setEditing(false);
  };

  const handlePwdChange = (key, value) => {
    setPwd((p) => ({ ...p, [key]: value }));
    setPwdErrors((e) => (e[key] ? { ...e, [key]: null } : e));
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    const errors = {};
    if (!pwd.currentPassword) errors.currentPassword = 'Current password is required.';
    if (!pwd.newPassword) errors.newPassword = 'New password is required.';
    else if (pwd.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters.';
    else if (!/[A-Z]/.test(pwd.newPassword)) errors.newPassword = 'Password must contain an uppercase letter.';
    else if (!/[0-9]/.test(pwd.newPassword)) errors.newPassword = 'Password must contain a number.';
    if (!pwd.confirmNewPassword) errors.confirmNewPassword = 'Please confirm your new password.';
    else if (pwd.newPassword !== pwd.confirmNewPassword) errors.confirmNewPassword = 'Passwords do not match.';

    setPwdErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    pwdMutation.mutate({
      currentPassword: pwd.currentPassword,
      newPassword: pwd.newPassword,
      confirmNewPassword: pwd.confirmNewPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="customer-loading customer-loading--padded">
        <PageLoading label="Loading your profile…" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="customer-loading customer-loading--padded">
        <PageError title="Could not load profile" onRetry={() => refetch()} />
      </div>
    );
  }

  const inputStyle = { width: '100%', marginTop: '6px' };

  return (
    <motion.div
      className="customer-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      <PageHeader title="My Profile" subtitle="View and manage your personal account information." />

      {/* ─────────── Email Verification ─────────── */}
      <motion.section className="page-card" style={{ padding: '24px' }}>
        <EmailVerificationCard
          email={data.email || ''}
          emailVerified={Boolean(data.emailVerified)}
          onVerified={(updated) => {
            refetch();
            updateUser({ email: updated.email, emailVerified: updated.emailVerified });
          }}
        />
      </motion.section>

      {/* ─────────── Personal Information ─────────── */}
      <motion.section className="page-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--ds-primary-strong)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiUser size={20} /> Personal Information
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--ds-text-muted)' }}>
              Your basic account details.
            </p>
          </div>
          {!editing && (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>

        {infoMsg && (
          <div className={`alert ${infoMsg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '8px' }}>
            {infoMsg.text}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="form-group-custom">
              <label className="form-label-custom">Username</label>
              <input
                className="form-input-custom"
                value={form.username}
                disabled={!editing}
                onChange={(e) => handleFieldChange('username', e.target.value)}
                style={inputStyle}
                placeholder="Your username"
              />
              <FieldError error={fieldErrors.username} />
            </div>

            <div className="form-group-custom">
              <label className="form-label-custom">Phone</label>
              <input
                className="form-input-custom"
                value={form.phone}
                disabled={!editing}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                style={inputStyle}
                placeholder="10-digit mobile number"
                inputMode="tel"
              />
              <FieldError error={fieldErrors.phone} />
            </div>
          </div>

          {editing && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <Button type="submit" variant="primary" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
              <Button type="button" variant="ghost" onClick={handleCancel} disabled={updateMutation.isPending}>
                Cancel
              </Button>
            </div>
          )}
        </form>
      </motion.section>

      {/* ─────────── Security / Change Password ─────────── */}
      <motion.section className="page-card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--ds-primary-strong)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiLock size={20} /> Security
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--ds-text-muted)' }}>
            Change your account password.
          </p>
        </div>

        {pwdMsg && (
          <div className={`alert ${pwdMsg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '8px' }}>
            {pwdMsg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="form-group-custom">
              <label className="form-label-custom">Current Password</label>
              <div style={{ marginTop: '6px' }}>
                <PasswordInput
                  value={pwd.currentPassword}
                  onChange={(e) => handlePwdChange('currentPassword', e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
              </div>
              <FieldError error={pwdErrors.currentPassword} />
            </div>

            <div className="form-group-custom">
              <label className="form-label-custom">New Password</label>
              <div style={{ marginTop: '6px' }}>
                <PasswordInput
                  value={pwd.newPassword}
                  onChange={(e) => handlePwdChange('newPassword', e.target.value)}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  autoComplete="new-password"
                />
              </div>
              <FieldError error={pwdErrors.newPassword} />
            </div>

            <div className="form-group-custom">
              <label className="form-label-custom">Confirm New Password</label>
              <div style={{ marginTop: '6px' }}>
                <PasswordInput
                  value={pwd.confirmNewPassword}
                  onChange={(e) => handlePwdChange('confirmNewPassword', e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
              </div>
              <FieldError error={pwdErrors.confirmNewPassword} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <Button type="submit" variant="primary" disabled={pwdMutation.isPending}>
              {pwdMutation.isPending ? 'Changing…' : 'Change Password'}
            </Button>
          </div>
        </form>
      </motion.section>
    </motion.div>
  );
};

export default ProfilePage;
