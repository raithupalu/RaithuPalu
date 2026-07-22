import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FormInput from '../../components/FormInput';
import Button from '../../components/Button';
import './AuthPages.css';

const FloatingElement = ({ delay, emoji, x, y }) => (
  <motion.div
    className="floating-element-auth"
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0.3, 0.5, 0.3],
      y: [0, -20, 0],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
    style={{ left: x, top: y }}
  >
    {emoji}
  </motion.div>
);

const serverPasswordRules = (password) => {
  if (password.length < 8) return 'At least 8 characters';
  if (!/[A-Z]/.test(password)) return 'One uppercase letter';
  if (!/[0-9]/.test(password)) return 'One number';
  return null;
};

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    else if (formData.username.trim().length < 3) newErrors.username = 'At least 3 characters';

    if (!formData.phone) newErrors.phone = 'Phone is required';
    else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, '')))
      newErrors.phone = 'Enter a valid 10-digit mobile number';

    const pwRule = serverPasswordRules(formData.password);
    if (!formData.password) newErrors.password = 'Password is required';
    else if (pwRule) newErrors.password = pwRule;

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    setErrors({});
    try {
      await register({
        username: formData.username.trim().toLowerCase(),
        phone: formData.phone.replace(/\D/g, '').slice(-10),
        password: formData.password,
      });
      navigate('/login', { replace: true });
    } catch (error) {
      setErrors({ submit: error.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <FloatingElement delay={0} emoji="🌾" x="10%" y="15%" />
        <FloatingElement delay={1} emoji="🥛" x="85%" y="25%" />
        <FloatingElement delay={2} emoji="🌱" x="15%" y="80%" />
        <FloatingElement delay={1.5} emoji="🌿" x="80%" y="70%" />
      </div>

      <motion.div
        className="auth-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="auth-card" variants={itemVariants}>
          <motion.h1 variants={itemVariants} className="auth-title">
            Create your account
          </motion.h1>
          <motion.p variants={itemVariants} className="auth-subtitle">
            Join as a customer — admins are created separately
          </motion.p>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <motion.div variants={itemVariants}>
              <FormInput
                label="Username"
                type="text"
                autoComplete="username"
                placeholder="Choose a unique username"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  if (errors.username) setErrors({ ...errors, username: '' });
                }}
                error={errors.username}
                icon="👤"
                required
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <FormInput
                label="Phone number"
                type="tel"
                autoComplete="tel"
                placeholder="10-digit mobile"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                error={errors.phone}
                icon="📱"
                required
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <FormInput
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="8+ chars, 1 uppercase, 1 number"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                error={errors.password}
                icon="🔒"
                required
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <FormInput
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                }}
                error={errors.confirmPassword}
                icon="✓"
                required
              />
            </motion.div>

            {errors.submit && (
              <motion.div
                className="auth-error"
                role="alert"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.submit}
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <Button variant="primary" size="lg" type="submit" disabled={loading} className="auth-submit-btn">
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="auth-footer">
            <p>
              Already registered?{' '}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          className="auth-info"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h2>Why register?</h2>
          <ul>
            <li>View your daily milk ledger</li>
            <li>Place and track orders</li>
            <li>See bills and payment status</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;
