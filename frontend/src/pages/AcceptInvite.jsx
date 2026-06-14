import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { previewInvite } from '../utils/api';

// Steps: loading → preview → auth → success → declined → error

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('loading');
  const [invite, setInvite] = useState(null);       // { inviterName, invitedEmail, expiresAt }
  const [errorMsg, setErrorMsg] = useState('');

  // Auth sub-step: 'choose' | 'signin' | 'register'
  const [authMode, setAuthMode] = useState('choose');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // 1. Load invite preview (no auth needed)
  useEffect(() => {
    if (!token) { setStep('error'); setErrorMsg('Invalid invitation link.'); return; }
    localStorage.setItem('pendingInviteToken', token);

    previewInvite(token)
      .then(res => {
        setInvite(res.data.data);
        // If already logged in with the correct email → accept immediately
        if (user && user.email.toLowerCase() === res.data.data.invitedEmail.toLowerCase()) {
          doAccept(token);
        } else if (user) {
          // Logged in as wrong user — show auth step to sign in with correct account
          setAuthForm(f => ({ ...f, email: res.data.data.invitedEmail }));
          setAuthError(`This invitation was sent to ${res.data.data.invitedEmail}. Please sign in with that account.`);
          setAuthMode('signin');
          setStep('auth');
        } else {
          setStep('preview');
        }
      })
      .catch(err => {
        setStep('error');
        setErrorMsg(err.response?.data?.message || 'Invitation not found or has expired.');
      });
  }, [token]);

  const doAccept = async (t) => {
    setStep('loading');
    try {
      await api.post('/invite/accept', { token: t });
      localStorage.removeItem('pendingInviteToken');
      setStep('success');
      setTimeout(() => navigate('/dashboard'), 2800);
    } catch (err) {
      setStep('error');
      setErrorMsg(err.response?.data?.message || 'Failed to accept invitation.');
    }
  };

  const handleAcceptClick = () => {
    setAuthForm(f => ({ ...f, email: invite?.invitedEmail || '' }));
    setAuthMode('choose');
    setStep('auth');
  };

  const handleDecline = () => setStep('declined');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'signin') {
        const res = await api.post('/auth/login', {
          email: authForm.email,
          password: authForm.password
        });
        login(res.data.token, res.data.user);
        await doAccept(token);
      } else {
        // register
        const res = await api.post('/auth/register', {
          name: authForm.name,
          email: authForm.email,
          password: authForm.password
        });
        // Registration may require email verification
        if (res.data.requiresVerification) {
          // Show a message to verify email — token is in localStorage so after verify+login it auto-accepts
          setStep('verify-email');
        } else {
          login(res.data.token, res.data.user);
          await doAccept(token);
        }
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === 'EMAIL_NOT_VERIFIED') {
        setAuthError('Please verify your email first, then sign in here to accept.');
      } else {
        setAuthError(data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleField = (e) => {
    setAuthForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setAuthError('');
  };

  return (
    <div className="invite-page">
      <div className="invite-card">
        {/* Brand */}
        <div className="invite-brand">
          <div className="invite-brand-logo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span className="invite-brand-name">TaskFlow</span>
        </div>

        {/* LOADING */}
        {step === 'loading' && (
          <div className="invite-step">
            <div className="invite-spinner" />
            <p className="invite-hint">Loading invitation…</p>
          </div>
        )}

        {/* PREVIEW — Accept / Decline */}
        {step === 'preview' && invite && (
          <div className="invite-step">
            <div className="invite-avatar-wrap">
              <div className="invite-avatar">
                {invite.inviterName.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <h2 className="invite-title">You're invited!</h2>
            <p className="invite-sub">
              <strong>{invite.inviterName}</strong> invited you to collaborate on <strong>TaskFlow</strong> — a shared task workspace.
            </p>
            <div className="invite-meta">
              <span>Sent to <strong>{invite.invitedEmail}</strong></span>
            </div>
            <div className="invite-actions">
              <button className="btn btn-primary invite-btn-accept" onClick={handleAcceptClick}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Accept Invitation
              </button>
              <button className="btn btn-outline invite-btn-decline" onClick={handleDecline}>
                Decline
              </button>
            </div>
          </div>
        )}

        {/* AUTH — sign in or register */}
        {step === 'auth' && (
          <div className="invite-step">
            <h2 className="invite-title">
              {authMode === 'choose' ? 'Join the workspace' :
               authMode === 'signin' ? 'Sign in to accept' : 'Create your account'}
            </h2>
            <p className="invite-sub" style={{ marginBottom: 20 }}>
              {authMode === 'choose'
                ? `Accepting invite from ${invite?.inviterName}. Do you already have an account?`
                : authMode === 'signin'
                ? `Sign in with ${authForm.email} to accept.`
                : `Create a free account with ${authForm.email} to join.`}
            </p>

            {authMode === 'choose' && (
              <div className="invite-choose">
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setAuthMode('signin')}>
                  Yes, sign in
                </button>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setAuthMode('register')}>
                  No, register
                </button>
              </div>
            )}

            {(authMode === 'signin' || authMode === 'register') && (
              <form onSubmit={handleAuthSubmit} noValidate>
                {authMode === 'register' && (
                  <div className="form-group">
                    <label>Full name</label>
                    <input name="name" type="text" placeholder="Your name" value={authForm.name} onChange={handleField} required />
                  </div>
                )}
                <div className="form-group">
                  <label>Email</label>
                  <input name="email" type="email" value={authForm.email} onChange={handleField} required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input name="password" type="password" placeholder={authMode === 'register' ? 'Create a password' : 'Your password'} value={authForm.password} onChange={handleField} required />
                </div>

                {authError && <div className="auth-alert auth-alert-error" style={{ marginBottom: 12 }}>{authError}</div>}

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={authLoading}>
                  {authLoading ? 'Please wait…' : authMode === 'signin' ? 'Sign in & Accept' : 'Register & Accept'}
                </button>

                <button type="button" className="invite-switch-mode" onClick={() => { setAuthMode(authMode === 'signin' ? 'register' : 'signin'); setAuthError(''); }}>
                  {authMode === 'signin' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* VERIFY EMAIL notice */}
        {step === 'verify-email' && (
          <div className="invite-step">
            <div className="invite-icon-wrap invite-icon-info">✉️</div>
            <h2 className="invite-title">Check your email</h2>
            <p className="invite-sub">
              We sent a verification link to <strong>{authForm.email}</strong>.<br />
              Click the link in that email to verify, then come back and sign in below to accept the invitation.
            </p>
            <button className="btn btn-primary" style={{ marginTop: 8, width: '100%' }} onClick={() => { setAuthMode('signin'); setStep('auth'); }}>
              I verified — Sign in now
            </button>
          </div>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <div className="invite-step">
            <div className="invite-icon-wrap invite-icon-success">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="invite-title">You're in!</h2>
            <p className="invite-sub">
              You've joined <strong>{invite?.inviterName || 'the'}</strong>'s team on TaskFlow. Redirecting to your dashboard…
            </p>
            <div className="invite-progress-bar"><div className="invite-progress-fill" /></div>
          </div>
        )}

        {/* DECLINED */}
        {step === 'declined' && (
          <div className="invite-step">
            <div className="invite-icon-wrap invite-icon-neutral">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <h2 className="invite-title">Invitation declined</h2>
            <p className="invite-sub">You declined the invitation from <strong>{invite?.inviterName}</strong>. You can close this tab.</p>
          </div>
        )}

        {/* ERROR */}
        {step === 'error' && (
          <div className="invite-step">
            <div className="invite-icon-wrap invite-icon-error">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 className="invite-title">Link unavailable</h2>
            <p className="invite-sub">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}
