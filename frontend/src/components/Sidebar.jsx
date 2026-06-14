import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const NavItem = ({ icon, label, active, onClick, badge }) => (
  <button className={`snav-item ${active ? 'active' : ''}`} onClick={onClick}>
    <span className="snav-icon">{icon}</span>
    <span className="snav-label">{label}</span>
    {badge > 0 && <span className="snav-badge">{badge}</span>}
  </button>
);

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
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 4 }}>
                Enter their email address. They'll receive an invitation link to join your team.
              </p>
              {error && <div className="auth-alert auth-alert-error">{error}</div>}
              <form onSubmit={handleSend} noValidate>
                <div className="form-group">
                  <label htmlFor="invite-email">Email address</label>
                  <input
                    id="invite-email" type="email"
                    value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
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

export default function Sidebar({ activeView, onViewChange, stats, onOpenAI }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showInvite, setShowInvite] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = Number(localStorage.getItem('taskflow-sidebar-width'));
    return Number.isFinite(saved) ? Math.min(Math.max(saved, 188), 340) : 248;
  });

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const fetchTeam = async () => {
    try {
      const res = await api.get('/invite/team');
      // API returns TeamMember docs: { owner, member: { _id, name, email } }
      // Extract the nested user object from each record
      setTeamMembers((res.data.data || []).map(tm => tm.member || tm));
    } catch { /* non-critical */ }
  };

  useEffect(() => {
    fetchTeam();
    window.addEventListener('focus', fetchTeam);
    return () => window.removeEventListener('focus', fetchTeam);
  }, []);

  const navItems = [
    {
      id: 'dashboard', label: 'Dashboard',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    },
    {
      id: 'all', label: 'My tasks', badge: stats?.pending,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
    },
    {
      id: 'today', label: 'Due today',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    },
    {
      id: 'completed', label: 'Completed',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    },
    {
      id: 'settings', label: 'Settings',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    }
  ];

  const getMemberInitials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const handleResizeStart = (event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sidebarWidth;

    const handleMove = (moveEvent) => {
      const nextWidth = Math.min(Math.max(startWidth + moveEvent.clientX - startX, 188), 340);
      setSidebarWidth(nextWidth);
    };

    const handleUp = () => {
      document.body.classList.remove('is-resizing-sidebar');
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.body.classList.add('is-resizing-sidebar');
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  useEffect(() => {
    localStorage.setItem('taskflow-sidebar-width', String(sidebarWidth));
  }, [sidebarWidth]);

  return (
    <>
      <aside className="sidebar" style={{ width: sidebarWidth }}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span className="sidebar-title">TaskFlow</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavItem key={item.id} icon={item.icon} label={item.label}
              active={activeView === item.id}
              onClick={() => item.id === 'settings' ? navigate('/settings') : onViewChange(item.id)}
              badge={item.badge} />
          ))}
        </nav>

        {/* TaskFlow Chatbot button */}
        <button className="sidebar-ai-btn" onClick={onOpenAI}>
          <span className="sidebar-ai-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/>
            </svg>
          </span>
          <span className="sidebar-ai-label">TaskFlow Chatbot</span>
          <span className="sidebar-ai-badge">Chat</span>
        </button>

        {/* Team members section */}
        <div className="sidebar-team">
          <div className="sidebar-team-header">
            <span className="sidebar-team-title">Team</span>
            <button className="sidebar-invite-btn" onClick={() => setShowInvite(true)} title="Invite member">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Invite
            </button>
          </div>

          {teamMembers.length === 0 ? (
            <p className="sidebar-team-empty">No team members yet</p>
          ) : (
            <div className="sidebar-team-list">
              {teamMembers.map(member => (
                <div key={member._id} className="sidebar-team-member">
                  <div className="sidebar-member-avatar">{getMemberInitials(member.name)}</div>
                  <div className="sidebar-member-info">
                    <div className="sidebar-member-name">{member.name}</div>
                    <div className="sidebar-member-email">{member.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user-row">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-text">
              <div className="sidebar-uname">{user?.name}</div>
              <div className="sidebar-uemail">{user?.email}</div>
            </div>
            <button className="sidebar-logout-btn" onClick={logout} title="Logout">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
        <button
          className="sidebar-resize-handle"
          onMouseDown={handleResizeStart}
          title="Drag to resize sidebar"
          aria-label="Drag to resize sidebar"
        />
      </aside>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={fetchTeam}
        />
      )}
    </>
  );
}
