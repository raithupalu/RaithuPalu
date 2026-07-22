import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FormInput from '../../components/FormInput';
import Button from '../../components/Button';
import logo from '../../assets/images/logo/logo.png';
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

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
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
      const userData = await login(formData.username.trim(), formData.password);
      navigate(userData.role === 'admin' ? '/admin' : '/customer', { replace: true });
    } catch (error) {
      setErrors({ submit: error.message || 'Login failed' });
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
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
          <motion.div variants={itemVariants} className="auth-logo-wrap">
            <img src={logo} alt="RaithuPalu" className="auth-logo" />
          </motion.div>
          <motion.h1 variants={itemVariants} className="auth-title">
            Welcome back
          </motion.h1>
          <motion.p variants={itemVariants} className="auth-subtitle">
            Sign in to manage milk, orders, and payments
          </motion.p>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <motion.div variants={itemVariants}>
              <FormInput
                label="Username"
                type="text"
                autoComplete="username"
                placeholder="Your username"
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
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
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
              <Button 
                variant="primary" 
                size="lg" 
                type="submit" 
                disabled={loading || !formData.username || !formData.password} 
                className="auth-submit-btn"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="auth-footer">
            <p>
              No account?{' '}
              <Link to="/register" className="auth-link">
                Create one
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
          <h2>RaithuPalu</h2>
          <ul>
            <li>Daily milk records and billing</li>
            <li>Orders and payment history</li>
            <li>Secure sign-in for customers and admins</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
