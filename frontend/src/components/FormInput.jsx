import React, { useState, useId } from 'react';
import { motion } from 'framer-motion';
import './FormInput.css';

export const FormInput = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error = '',
  disabled = false,
  required = false,
  helperText = '',
  icon = null,
  success = false,
  onValidate = null,
  validationRules = null,
  id,
  options = [],
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || `form-input-${generatedId}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const isSelect = type === 'select';

  const handleChange = (e) => {
    onChange(e);

    // Real-time validation if rules provided
    if (onValidate && validationRules) {
      onValidate(e.target.value, validationRules);
    }
  };

  const fieldClass = `form-input-field ${error ? 'error' : ''} ${success && !error ? 'success' : ''} ${icon ? 'with-icon' : ''} ${isPassword ? 'with-toggle' : ''}`;

  return (
    <div className="form-input-wrapper">
      {label && (
        <label className="form-input-label" htmlFor={inputId}>
          {label}
          {required && <span className="required-asterisk">*</span>}
          {success && !error && <span className="validation-success">✓</span>}
        </label>
      )}

      <div className="form-input-field-wrapper">
        {icon && <span className="form-input-icon">{icon}</span>}
        {isSelect ? (
          <select
            id={inputId}
            className={fieldClass}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => {
              const optValue = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              return (
                <option key={optValue} value={optValue}>
                  {optLabel}
                </option>
              );
            })}
          </select>
        ) : (
          <input
            id={inputId}
            type={isPassword && showPassword ? 'text' : type}
            className={fieldClass}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            {...props}
          />
        )}
        {isPassword && (
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        )}
      </div>

      {error && (
        <motion.div
          id={errorId}
          className="form-input-error"
          role="alert"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          ⚠️ {error}
        </motion.div>
      )}

      {success && !error && (
        <motion.div
          className="form-input-success"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          ✓ Looks good!
        </motion.div>
      )}

      {helperText && !error && !success && (
        <div id={helperId} className="form-input-helper">
          {helperText}
        </div>
      )}
    </div>
  );
};

export default FormInput;