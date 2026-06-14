import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
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
              <div className="verify-sent-icon">📧</div>
              <h2 className="auth-form-title">Check your inbox</h2>
              <p style={{ color: '#64748b', marginTop: 8, fontSize: '0.9rem' }}>{success}</p>
              <Link to="/login" className="btn btn-primary" style={{ marginTop: 28, display: 'inline-flex' }}>
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-form-header">
                <h2 className="auth-form-title">Reset your password</h2>
                <p className="auth-form-subtitle">Enter your email and we&apos;ll send a reset link</p>
              </div>

              {error && <div className="auth-alert auth-alert-error">{error}</div>}

              <form onSubmit={handleSubmit} noValidate className="auth-form" autoComplete="off">
                <div className="form-group">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email" type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    autoComplete="new-password"
                    className={error ? 'error' : ''}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-full auth-submit" disabled={loading}>
                  {loading && <span className="btn-spinner" />}
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <p className="auth-switch">
                Remember it? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
