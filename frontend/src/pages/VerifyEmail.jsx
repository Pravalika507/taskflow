import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Verification token is missing.'); return; }
    api.post('/auth/verify-email', { token })
      .then(() => { setStatus('success'); setTimeout(() => navigate('/login'), 2500); })
      .catch((err) => { setStatus('error'); setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.'); });
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-right">
        <div className="auth-form-container" style={{ textAlign: 'center' }}>
          <div className="auth-brand-top" style={{ justifyContent: 'center' }}>
            <div className="auth-brand-logo-sm">✓</div>
            <span className="auth-brand-name-sm">TaskManager</span>
          </div>

          {status === 'verifying' && (
            <><div className="verify-sent-icon">⏳</div><h2 className="auth-form-title">Verifying your email...</h2><p style={{ color: '#64748b' }}>Just a moment.</p></>
          )}
          {status === 'success' && (
            <><div className="verify-sent-icon">✅</div><h2 className="auth-form-title">Email verified!</h2><p style={{ color: '#64748b', marginTop: 8 }}>Redirecting to sign in...</p></>
          )}
          {status === 'error' && (
            <>
              <div className="verify-sent-icon">❌</div>
              <h2 className="auth-form-title">Verification failed</h2>
              <p style={{ color: '#64748b', marginTop: 8 }}>{message}</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
                <Link to="/login" className="btn btn-outline">Sign In</Link>
                <Link to="/register" className="btn btn-primary">Register</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
