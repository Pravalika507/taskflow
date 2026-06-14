import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { score, label: 'Weak', color: '#ef4444' };
  if (score === 3) return { score, label: 'Fair', color: '#f59e0b' };
  if (score === 4) return { score, label: 'Good', color: '#3b82f6' };
  return { score, label: 'Strong', color: '#22c55e' };
};

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    else if (form.name.trim().length > 50) errs.name = 'Name max 50 characters';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Must be at least 8 characters';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Must include an uppercase letter';
    else if (!/[a-z]/.test(form.password)) errs.password = 'Must include a lowercase letter';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Must include a number';
    else if (!/[^A-Za-z0-9]/.test(form.password)) errs.password = 'Must include a special character (!@#$%^&*)';
    if (!form.confirm) errs.confirm = 'Please confirm your password';
    else if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setServerError('');
    try {
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password
      });
      setSubmitted(true);
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        'Registration failed because the backend or database is not reachable.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
    setServerError('');
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg('');
    try {
      await api.post('/auth/resend-verification', { email: form.email });
      setResendMsg('New verification link sent!');
    } catch {
      setResendMsg('Could not resend. Try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-right">
          <div className="auth-form-container" style={{ textAlign: 'center' }}>
            <div className="auth-brand-top" style={{ justifyContent: 'center' }}>
              <div className="auth-brand-logo-sm">✓</div>
              <span className="auth-brand-name-sm">TaskFlow</span>
            </div>
            <div className="verify-sent-icon">Mail</div>
            <h2 className="auth-form-title">Check your inbox</h2>
            <p style={{ color: '#64748b', marginTop: 8, fontSize: '0.9rem' }}>
              We sent a verification link to<br />
              <strong style={{ color: '#1e293b' }}>{form.email}</strong>
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: 10 }}>
              Click the link to activate your account. Expires in 24 hours.
            </p>
            <div className="verify-sent-actions">
              {resendMsg ? (
                <p className="resend-success">{resendMsg}</p>
              ) : (
                <button className="resend-btn" onClick={handleResend} disabled={resendLoading}>
                  {resendLoading ? 'Sending...' : "Didn't receive it? Resend"}
                </button>
              )}
            </div>
            <p className="auth-switch"><Link to="/login">Back to Sign In</Link></p>
          </div>
        </div>
      </div>
    );
  }

  const strength = getPasswordStrength(form.password);

  return (
    <div className="auth-page">
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-brand-top">
            <div className="auth-brand-logo-sm">✓</div>
            <span className="auth-brand-name-sm">TaskFlow</span>
          </div>

          <div className="auth-form-header">
            <h2 className="auth-form-title">Create your account</h2>
            <p className="auth-form-subtitle">Start managing tasks in under a minute</p>
          </div>

          {serverError && <div className="auth-alert auth-alert-error">{serverError}</div>}

          <form onSubmit={handleSubmit} noValidate className="auth-form" autoComplete="off">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name" type="text" name="name"
                value={form.name} onChange={handleChange}
                autoComplete="name"
                placeholder="Your full name"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email" type="email" name="email"
                value={form.email} onChange={handleChange}
                autoComplete="email"
                placeholder="you@example.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="pw-wrap">
                <input
                  id="password" type={showPassword ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  className={errors.password ? 'error' : ''}
                />
                <button
                  type="button" className="pw-eye"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: i <= strength.score ? strength.color : '#e2e8f0',
                        transition: 'background 0.2s'
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: 6 }}>
                    - min 8 chars, uppercase, lowercase, number, special char
                  </span>
                </div>
              )}
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Confirm Password</label>
              <div className="pw-wrap">
                <input
                  id="confirm" type={showConfirm ? 'text' : 'password'} name="confirm"
                  value={form.confirm} onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className={errors.confirm ? 'error' : (form.confirm && form.confirm === form.password ? 'success' : '')}
                />
                <button
                  type="button" className="pw-eye"
                  onClick={() => setShowConfirm(v => !v)}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {form.confirm && form.confirm === form.password && !errors.confirm && (
                <span style={{ fontSize: '0.78rem', color: '#22c55e', fontWeight: 500 }}>Passwords match</span>
              )}
              {errors.confirm && <span className="field-error">{errors.confirm}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-full auth-submit" disabled={loading}>
              {loading && <span className="btn-spinner" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
