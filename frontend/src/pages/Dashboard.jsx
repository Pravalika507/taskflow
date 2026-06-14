import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import StatsCards from '../components/StatsCards';
import TaskModal from '../components/TaskModal';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import Pagination from '../components/Pagination';
import Toast from '../components/Toast';
import ChatBot from '../components/ChatBot';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import api, { getTeamMembers } from '../utils/api';

const PRIORITY_CONFIG = {
  high:   { color: '#ef4444', bg: '#fee2e2', label: 'High' },
  medium: { color: '#f59e0b', bg: '#fef3c7', label: 'Medium' },
  low:    { color: '#22c55e', bg: '#dcfce7', label: 'Low' }
};

const QA_PRIORITY_COLORS = {
  low:    { color: '#16a34a', bg: '#dcfce7' },
  medium: { color: '#d97706', bg: '#fef3c7' },
  high:   { color: '#dc2626', bg: '#fee2e2' },
};

function QuickAdd({ onAdd }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDesc, setShowDesc] = useState(false);
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    getTeamMembers()
      .then(res => setTeamMembers((res.data.data || []).map(tm => tm.member || tm)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const close = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onAdd({ title: title.trim(), priority, dueDate: dueDate || null, status, description: description.trim(), members: members.map(m => m._id) });
      setTitle(''); setDescription(''); setShowDesc(false); setPriority('medium'); setStatus('todo'); setDueDate(''); setMembers([]);
    } finally { setLoading(false); }
  };

  const toggleMember = (m) => {
    setMembers(prev => prev.some(x => x._id === m._id) ? prev.filter(x => x._id !== m._id) : [...prev, m]);
  };

  const selectedCountText = members.length === 1 ? '1 selected' : `${members.length} selected`;
  const pc = QA_PRIORITY_COLORS[priority];

  return (
    <div className="quick-add">
      {/* Top: input row */}
      <div className="quick-add-top">
        <span className="quick-add-pencil">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </span>
        <input
          className="quick-add-input"
          placeholder="Add a task — type and press Enter"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          autoComplete="off"
        />
        <button className="qa-btn" onClick={handleAdd} disabled={!title.trim() || loading}>
          {loading ? 'Adding…' : 'Add task'}
        </button>
      </div>

      {/* Description — toggled */}
      {showDesc && (
        <textarea
          className="qa-description"
          placeholder="Add a description (optional)…"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          autoFocus
        />
      )}

      {/* Bottom: metadata row */}
      <div className="quick-add-bottom">
        {/* Description toggle */}
        <button
          type="button"
          className={`qa-desc-toggle ${showDesc ? 'active' : ''}`}
          onClick={() => setShowDesc(v => !v)}
          title="Add description"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Description
        </button>

        {/* Status selector */}
        <div className="qa-status-wrap">
          {[{v:'todo',label:'Todo'},{v:'pending',label:'Pending'},{v:'completed',label:'Completed'}].map(s => (
            <button
              key={s.v}
              type="button"
              className={`qa-status-pill qa-status-${s.v} ${status === s.v ? 'active' : ''}`}
              onClick={() => setStatus(s.v)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Priority pill selector */}
        <div className="qa-priority-wrap">
          {['low','medium','high'].map(p => (
            <button
              key={p}
              type="button"
              className={`qa-priority-pill ${priority === p ? 'active' : ''}`}
              style={priority === p ? { background: QA_PRIORITY_COLORS[p].bg, color: QA_PRIORITY_COLORS[p].color, borderColor: QA_PRIORITY_COLORS[p].color } : {}}
              onClick={() => setPriority(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Due date */}
        <div className="qa-date-wrap">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <input type="date" className="qa-date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>

        {/* Member picker */}
        <div className="qa-members-wrap" ref={pickerRef}>
          {/* Selected member avatars */}
          {members.map(m => (
            <button
              key={m._id}
              type="button"
              className="qa-member-avatar"
              style={{ background: avatarColor(m.email || m.name) }}
              title={`Remove ${m.name || m.email}`}
              onClick={() => toggleMember(m)}
            >
              {initialsFor(m.name, m.email)}
            </button>
          ))}
          {/* Add member button */}
          <button
            type="button"
            className={`qa-assign-btn ${showPicker ? 'active' : ''}`}
            onClick={() => setShowPicker(v => !v)}
            title="Assign members"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
            </svg>
            {members.length === 0 ? 'Assign' : `+${members.length}`}
          </button>

          {/* Dropdown picker */}
          {showPicker && (
            <div className="qa-member-dropdown">
              <div className="qa-picker-header">
                <span>Assign members</span>
                {teamMembers.length > 0 && <small>{selectedCountText}</small>}
              </div>
              {teamMembers.length === 0 ? (
                <p className="qa-picker-empty">No team members yet</p>
              ) : (
                <div className="qa-picker-list">
                  {teamMembers.map(m => {
                    const selected = members.some(x => x._id === m._id);
                    return (
                      <button
                        key={m._id}
                        type="button"
                        className={`qa-picker-item ${selected ? 'selected' : ''}`}
                        onClick={() => toggleMember(m)}
                      >
                        <span className="qa-picker-avatar" style={{ background: avatarColor(m.email || m.name) }}>
                          {initialsFor(m.name, m.email)}
                        </span>
                        <span className="qa-picker-info">
                          <span className="qa-picker-name">{m.name || m.email}</span>
                          <span className="qa-picker-email">{m.email}</span>
                        </span>
                        <span className={`qa-picker-check ${selected ? 'selected' : ''}`}>
                          {selected && (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

export default function Dashboard() {
  const { user: currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeView, setActiveView] = useState('dashboard');
  const [statusFilter, setStatusFilter] = useState('all'); // all | todo | pending | completed
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 8, totalPages: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const showToast = (type, message) => setToast({ type, message });

  const fetchTasks = useCallback(async () => {
    if (activeView === 'settings') return;
    setLoading(true);
    try {
      const params = { page, limit: 8, sortBy };
      if (debouncedSearch) params.search = debouncedSearch;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      if (activeView === 'completed') {
        params.status = 'completed';
      } else if (activeView === 'today') {
        params.dueToday = 'true';
      } else if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const res = await api.get('/tasks', { params });
      setTasks(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      showToast('error', 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeView, statusFilter, priorityFilter, sortBy, page]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/tasks/stats');
      setStats(res.data.data);
    } catch { } finally { setStatsLoading(false); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { setPage(1); }, [debouncedSearch, activeView, statusFilter, priorityFilter, sortBy]);

  const handleViewChange = (view) => {
    setActiveView(view);
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  const handleQuickAdd = async (data) => {
    try {
      await api.post('/tasks', data);
      showToast('success', 'Task added');
      fetchTasks(); fetchStats();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to add task');
      throw err;
    }
  };

  const handleModalSubmit = async (data) => {
    setModalLoading(true);
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, data);
        showToast('success', 'Task updated');
      } else {
        await api.post('/tasks', data);
        showToast('success', 'Task created');
      }
      setIsModalOpen(false); setEditingTask(null);
      fetchTasks(); fetchStats();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Operation failed');
    } finally { setModalLoading(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/tasks/${deletingTaskId}`);
      setDeletingTaskId(null);
      showToast('success', 'Task deleted');
      fetchTasks(); fetchStats();
    } catch { showToast('error', 'Failed to delete task'); }
    finally { setDeleteLoading(false); }
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'todo' : task.status === 'todo' ? 'pending' : 'completed';
    try {
      await api.patch(`/tasks/${task._id}/status`, { status: newStatus });
      showToast('success', `Marked as ${newStatus}`);
      fetchTasks(); fetchStats();
    } catch { showToast('error', 'Failed to update status'); }
  };

  const openCreate = () => { setEditingTask(null); setIsModalOpen(true); };
  const openEdit = (task) => { setEditingTask(task); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingTask(null); };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const today = new Date(); today.setHours(0,0,0,0);
    const diff = Math.round((new Date(dateStr).setHours(0,0,0,0) - today) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const isOverdue = (task) =>
    ['todo', 'pending'].includes(task.status) && task.dueDate && new Date(task.dueDate) < new Date();

  const pageTitle = {
    dashboard: 'My tasks', all: 'My tasks', today: 'Due today',
    completed: 'Completed', settings: 'Settings'
  }[activeView] || 'My tasks';

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();
  const displayName = currentUser?.name || 'there';

  const showTasks = activeView !== 'settings';
  const showQuickAdd = ['dashboard', 'all', 'today'].includes(activeView);

  return (
    <div className="app-layout">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} stats={stats} onOpenAI={() => setChatOpen(true)} />

      <div className="app-main">
        {/* Clean white top header */}
        <div className="dash-clean-header">
          <div className="dash-clean-left">
            <p className="dash-clean-greeting">{greeting}, <span className="dash-clean-name">{displayName}</span></p>
            <p className="dash-clean-date">{todayStr}</p>
          </div>
          <button className="btn-new-task" onClick={openCreate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New task
          </button>
        </div>

        {/* Stats row */}
        <div className="stats-row-wrapper">
          <StatsCards stats={stats} loading={statsLoading} />
        </div>

        {activeView === 'settings' ? (
          <div className="settings-placeholder">
            <div className="settings-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            <h3>Settings</h3>
            <p>Settings panel coming soon</p>
          </div>
        ) : (
          <>
            {showQuickAdd && <QuickAdd onAdd={handleQuickAdd} />}

            {/* Section title + Filters */}
            <div className="section-title-row">
              <h2 className="section-title">{pageTitle}</h2>
            </div>
            <div className="toolbar-row">
              <div className="search-box">
                <svg className="search-icon-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="search-input"
                  autoComplete="off"
                />
                {search && <button className="search-clear" onClick={() => setSearch('')}>×</button>}
              </div>

              <div className="filter-group">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'todo', label: 'Todo' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'completed', label: 'Completed' }
                ].map(s => (
                  <button
                    key={s.value}
                    className={`filter-pill ${statusFilter === s.value ? 'active' : ''}`}
                    onClick={() => setStatusFilter(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
                <select className="priority-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                  <option value="all">All priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Task list */}
            <div className="task-list">
              {loading ? (
                <div className="skel-list">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="skel-row">
                      <div className="skeleton" style={{ width: 20, height: 20, borderRadius: '50%' }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div className="skeleton" style={{ height: 16, width: '60%', borderRadius: 4 }} />
                        <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 4 }} />
                      </div>
                      <div className="skeleton" style={{ width: 80, height: 12, borderRadius: 4 }} />
                    </div>
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-illustration">
                    <svg width="72" height="72" viewBox="0 0 80 80" fill="none">
                      <circle cx="40" cy="40" r="40" fill="#f1f5f9"/>
                      <rect x="22" y="20" width="36" height="44" rx="4" fill="#e2e8f0"/>
                      <rect x="28" y="30" width="24" height="3" rx="1.5" fill="#94a3b8"/>
                      <rect x="28" y="38" width="18" height="3" rx="1.5" fill="#cbd5e1"/>
                      <rect x="28" y="46" width="21" height="3" rx="1.5" fill="#cbd5e1"/>
                      <circle cx="54" cy="54" r="12" fill="#6366f1"/>
                      <line x1="54" y1="49" x2="54" y2="59" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="49" y1="54" x2="59" y2="54" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3 className="empty-title">
                    {activeView === 'today' ? 'No tasks due today' :
                     activeView === 'completed' ? 'No completed tasks yet' :
                     search || priorityFilter !== 'all' ? 'No tasks match your filters' : 'No tasks yet'}
                  </h3>
                  <p className="empty-desc">
                    {!search && priorityFilter === 'all' && !['today','completed'].includes(activeView)
                      ? 'Use the quick add above to create your first task'
                      : 'Try adjusting your search or filters'}
                  </p>
                </div>
              ) : (
                <>
                  {tasks.map(task => {
                    const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                    const overdue = isOverdue(task);
                    const done = task.status === 'completed';
                  const isTodo = task.status === 'todo';
                    const dateLabel = formatDate(task.dueDate);

                    return (
                      <div key={task._id} className={`task-row ${done ? 'task-done' : ''} ${overdue ? 'task-overdue' : ''}`} data-priority={task.priority}>
                        {overdue && <div className="overdue-bar" />}
                        <button
                          className={`task-cb ${done ? 'task-cb-done' : ''}`}
                          onClick={() => handleToggleStatus(task)}
                          title={done ? 'Mark pending' : 'Mark complete'}
                        >
                          {done && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </button>

                        <div className="task-body" onClick={() => openEdit(task)} style={{ cursor: 'pointer' }}>
                          <span className={`task-title-text ${done ? 'task-title-done' : ''}`}>{task.title}</span>
                          <div className="task-tags">
                            <span className={done ? 'tag-done' : task.status === 'todo' ? 'tag-todo' : 'tag-pending'}>
                              {done ? 'Completed' : task.status === 'todo' ? 'Todo' : 'Pending'}
                            </span>
                            <span className="tag-priority" style={{ color: p.color, background: p.bg }}>
                              {p.label}
                            </span>
                            {dateLabel && (
                              <span className={`tag-date ${overdue ? 'tag-date-red' : ''}`}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                {overdue ? `Overdue · ` : ''}{dateLabel}
                              </span>
                            )}
                          </div>
                          <div className="task-meta">
                            <span className="task-meta-creator">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                              </svg>
                              {task.user?._id === currentUser?._id ? 'Created by you' : `Created by ${task.user?.name || 'Unknown'}`}
                            </span>
                            {task.members?.length > 0 && (
                              <span className="task-meta-members">
                                <span className="task-meta-sep">·</span>
                                <span className="task-meta-label">Assigned to</span>
                                <span className="task-member-avatars">
                                  {task.members.slice(0, 4).map((m) => (
                                    <span
                                      key={m._id}
                                      className="task-member-avatar"
                                      style={{ background: avatarColor(m.email || m.name) }}
                                      title={m.name || m.email}
                                    >
                                      {initialsFor(m.name, m.email)}
                                    </span>
                                  ))}
                                  {task.members.length > 4 && (
                                    <span className="task-member-more" title={`${task.members.length - 4} more assigned`}>
                                      +{task.members.length - 4}
                                    </span>
                                  )}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="task-actions">
                          <button className="ta-btn ta-check" onClick={() => handleToggleStatus(task)} title={done ? 'Reopen' : 'Complete'}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </button>
                          <button className="ta-btn ta-edit" onClick={() => openEdit(task)} title="Edit">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button className="ta-btn ta-del" onClick={() => setDeletingTaskId(task._id)} title="Delete">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="list-footer">
                    <span className="showing-text">
                      Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </span>
                    <Pagination pagination={pagination} onPageChange={setPage} />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <TaskModal isOpen={isModalOpen} onClose={closeModal} onSubmit={handleModalSubmit} editingTask={editingTask} loading={modalLoading} />
      <DeleteConfirmDialog isOpen={!!deletingTaskId} onConfirm={handleDelete} onCancel={() => setDeletingTaskId(null)} loading={deleteLoading} />
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ChatBot tasks={tasks} onRefresh={() => { fetchTasks(); fetchStats(); }} open={chatOpen} onToggle={setChatOpen} />
    </div>
  );
}
