import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';

function avatarColor(str = '') {
  const colors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function initialsFor(name = '', email = '') {
  const source = name || email || '?';
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function InviteModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/invite/send', { email: email.trim() });
      setSent(true);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Invite Team Member</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {sent ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✉️</div>
              <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Invitation sent!</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                An invitation email has been sent to <strong>{email}</strong>.<br />
                They'll appear in your team once they accept.
              </p>
              <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onClose}>Done</button>
            </div>
          ) : (
            <>
              {error && <div className="auth-alert auth-alert-error">{error}</div>}
              <form onSubmit={handleSend} noValidate>
                <div className="form-group">
                  <label htmlFor="invite-email">Email address</label>
                  <input
                    id="invite-email" type="email"
                    value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="teammate@example.com"
                    autoComplete="off"
                    className={error ? 'error' : ''}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                  <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Settings({ stats }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [activeView] = useState('settings');

  const handleViewChange = (view) => {
    if (view !== 'settings') navigate('/dashboard');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, teamRes] = await Promise.all([
        api.get('/invite/sent'),
        api.get('/invite/team')
      ]);
      setInvitations(invRes.data.data || []);
      setTeamMembers(teamRes.data.data || []);
    } catch {
      // non-critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const userInitials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="app-layout">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} stats={stats} />

      <main className="main-content">
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>

          {/* Profile Card */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h2 className="settings-section-title">Profile</h2>
            </div>
            <div className="settings-profile-row">
              <div className="settings-avatar" style={{ background: avatarColor(user?.email || '') }}>
                {userInitials}
              </div>
              <div className="settings-profile-info">
                <div className="settings-profile-name">{user?.name}</div>
                <div className="settings-profile-email">{user?.email}</div>
                <div className="settings-profile-badge">Verified account</div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="settings-card" style={{ marginTop: 20 }}>
            <div className="settings-card-header">
              <h2 className="settings-section-title">Team Members</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}>
                + Invite
              </button>
            </div>

            {loading ? (
              <div className="settings-empty">Loading...</div>
            ) : teamMembers.length === 0 ? (
              <div className="settings-empty">No team members yet. Invite someone to get started.</div>
            ) : (
              <div className="settings-member-list">
                {teamMembers.map((m) => (
                  <div key={m._id} className="settings-member-row">
                    <div className="settings-member-avatar" style={{ background: avatarColor(m.email || m.name) }}>
                      {initialsFor(m.name, m.email)}
                    </div>
                    <div className="settings-member-info">
                      <div className="settings-member-name">{m.name}</div>
                      <div className="settings-member-email">{m.email}</div>
                    </div>
                    <span className="settings-status-badge accepted">Accepted</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invitations Sent */}
          <div className="settings-card" style={{ marginTop: 20 }}>
            <div className="settings-card-header">
              <h2 className="settings-section-title">Invitations Sent</h2>
            </div>

            {loading ? (
              <div className="settings-empty">Loading...</div>
            ) : invitations.length === 0 ? (
              <div className="settings-empty">No invitations sent yet.</div>
            ) : (
              <div className="settings-invite-table">
                <div className="settings-invite-thead">
                  <span>Email</span>
                  <span>Invited on</span>
                  <span>Accepted by</span>
                  <span>Accepted on</span>
                  <span>Status</span>
                </div>
                {invitations.map((inv) => (
                  <div key={inv._id} className="settings-invite-row">
                    <span className="settings-invite-email">{inv.email}</span>
                    <span className="settings-invite-date">{formatDate(inv.createdAt)}</span>
                    <span className="settings-invite-accepted-by">
                      {inv.acceptedBy ? (inv.acceptedBy.name || inv.acceptedBy.email) : '—'}
                    </span>
                    <span className="settings-invite-date">
                      {inv.status === 'accepted' ? formatDate(inv.updatedAt) : '—'}
                    </span>
                    <span className={`settings-status-badge ${inv.status}`}>
                      {inv.status === 'accepted' ? 'Accepted' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={() => { setShowInvite(false); fetchData(); }}
        />
      )}
    </div>
  );
}
