import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const validate = () => {
    const errs = {};
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Must include an uppercase letter';
    else if (!/[a-z]/.test(form.password)) errs.password = 'Must include a lowercase letter';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Must include a number';
    else if (!/[^A-Za-z0-9]/.test(form.password)) errs.password = 'Must include a special character';
    if (!form.confirm) errs.confirm = 'Please confirm your password';
    else if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    return errs;
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-right">
          <div className="auth-form-container" style={{ textAlign: 'center' }}>
            <div className="auth-brand-top" style={{ justifyContent: 'center' }}>
              <div className="auth-brand-logo-sm">✓</div>
              <span className="auth-brand-name-sm">TaskManager</span>
            </div>
            <div className="verify-sent-icon">❌</div>
            <h2 className="auth-form-title">Invalid Link</h2>
            <p style={{ color: '#64748b', marginTop: 8 }}>This reset link is invalid or missing.</p>
            <Link to="/forgot-password" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setServerError('');
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  return (
    <div className="auth-page">
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-brand-top">
            <div className="auth-brand-logo-sm">✓</div>
            <span className="auth-brand-name-sm">TaskManager</span>
          </div>

          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div className="verify-sent-icon">✅</div>
              <h2 className="auth-form-title">Password reset!</h2>
              <p style={{ color: '#64748b', marginTop: 8 }}>Redirecting to login in 3 seconds...</p>
            </div>
          ) : (
            <>
              <div className="auth-form-header">
                <h2 className="auth-form-title">Set new password</h2>
                <p className="auth-form-subtitle">Choose a strong password for your account</p>
              </div>

              {serverError && <div className="auth-alert auth-alert-error">{serverError}</div>}

              <form onSubmit={handleSubmit} noValidate className="auth-form" autoComplete="off">
                <div className="form-group">
                  <label htmlFor="password">New Password</label>
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
                  {form.password && (() => {
                    const s = getPasswordStrength(form.password);
                    return (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                          {[1,2,3,4,5].map(i => (
                            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= s.score ? s.color : '#e2e8f0', transition: 'background 0.2s' }} />
                          ))}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: s.color, fontWeight: 600 }}>{s.label}</span>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: 6 }}>— min 8 chars, uppercase, lowercase, number, special character</span>
                      </div>
                    );
                  })()}
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
                    <span style={{ fontSize: '0.78rem', color: '#22c55e', fontWeight: 500 }}>✓ Passwords match</span>
                  )}
                  {errors.confirm && <span className="field-error">{errors.confirm}</span>}
                </div>
                <button type="submit" className="btn btn-primary btn-full auth-submit" disabled={loading}>
                  {loading && <span className="btn-spinner" />}
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <p className="auth-switch"><Link to="/login">Back to Sign In</Link></p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
