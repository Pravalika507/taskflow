import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTeamMembers, getComments, addComment, deleteComment, uploadAttachment, deleteAttachment } from '../utils/api';
import RichEditor from './RichEditor';

const initialForm = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  members: []
};

function initialsFor(name = '', email = '') {
  const source = name || email || '?';
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function avatarColor(str = '') {
  const colors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}


function MembersField({ members, onAdd, onRemove, currentUserId }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const isCurrentUser = (user) => {
    const userId = String(user?._id || user?.id || '');
    const currentId = String(currentUserId || '');
    return userId && currentId && userId === currentId;
  };

  useEffect(() => {
    getTeamMembers()
      .then((res) => {
        const list = (res.data.data || []).map((tm) => tm.member || tm);
        setTeamMembers(list.filter((m) => !isCurrentUser(m)));
      })
      .catch(() => setTeamMembers([]))
      .finally(() => setLoading(false));
  }, [currentUserId]);

  const selectedIds = members.map((m) => m._id);
  const available = teamMembers.filter((m) => !selectedIds.includes(m._id));

  return (
    <div className="form-group">
      <label>Assign to Team Members</label>

      {members.length > 0 && (
        <div className="member-chips">
          {members.map((m) => (
            <span key={m._id} className="member-chip" title={m.email}>
              <span
                className="member-avatar-btn"
                style={{ background: avatarColor(m.email || m.name) }}
              >
                {initialsFor(m.name, m.email)}
              </span>
              <span className="member-chip-name">{m.name || m.email}</span>
              <button
                type="button"
                className="member-chip-remove"
                onClick={() => onRemove(m._id)}
                aria-label={`Remove ${m.name || m.email}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <div className="member-result-empty">Loading team members...</div>
      ) : available.length > 0 ? (
        <div className="member-team-list">
          {available.map((u) => (
            <button
              type="button"
              key={u._id}
              className="member-result-item"
              onClick={() => onAdd(u)}
            >
              <span className="member-avatar" style={{ background: avatarColor(u.email || u.name) }}>
                {initialsFor(u.name, u.email)}
              </span>
              <span>
                <span className="member-result-name">{u.name}</span>
                <span className="member-result-email">{u.email}</span>
              </span>
            </button>
          ))}
        </div>
      ) : teamMembers.length > 0 ? (
        <div className="member-result-empty">All team members assigned.</div>
      ) : (
        <div className="member-result-empty">
          No team members yet. Invite someone from the sidebar first.
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function fileIcon(mimetype = '') {
  if (mimetype.startsWith('image/')) return '🖼️';
  if (mimetype === 'application/pdf') return '📄';
  if (mimetype.includes('word')) return '📝';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊';
  return '📎';
}

function AttachmentsSection({ taskId, initialAttachments }) {
  const [attachments, setAttachments] = useState(initialAttachments || []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await uploadAttachment(taskId, formData);
      setAttachments((prev) => [...prev, res.data.data]);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Max 10 MB. Images, PDF, Word, Excel allowed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (attachmentId) => {
    try {
      await deleteAttachment(taskId, attachmentId);
      setAttachments((prev) => prev.filter((a) => a._id !== attachmentId));
    } catch {
      setError('Could not delete file');
    }
  };

  return (
    <div className="form-group attachments-section">
      <label>Attachments</label>

      {attachments.length > 0 && (
        <div className="attachment-list">
          {attachments.map((a) => (
            <div key={a._id} className="attachment-item">
              <span className="attachment-file-icon">{fileIcon(a.mimetype)}</span>
              <a
                href={`http://localhost:5000/uploads/${a.filename}`}
                target="_blank"
                rel="noopener noreferrer"
                className="attachment-name"
                title={a.originalname}
              >
                {a.originalname}
              </a>
              <span className="attachment-size">{formatBytes(a.size)}</span>
              <button
                type="button"
                className="attachment-delete"
                onClick={() => handleDelete(a._id)}
                aria-label="Remove attachment"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="attachment-upload-btn"
        onClick={() => fileRef.current.click()}
        disabled={uploading}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
        {uploading ? 'Uploading...' : 'Attach file'}
      </button>
      <input
        ref={fileRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleUpload}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
      />
      <span className="attachment-hint">Images, PDF, Word, Excel, text — max 10 MB</span>

      {error && <div className="field-error" style={{ marginTop: 6 }}>{error}</div>}
    </div>
  );
}

function CommentsSection({ taskId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getComments(taskId)
      .then((res) => setComments(res.data.data || []))
      .catch(() => setError('Could not load comments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (taskId) load();
  }, [taskId]);

  const handlePost = async () => {
    const trimmed = text.replace(/<[^>]*>/g, '').trim();
    if (!trimmed) return;
    setPosting(true);
    setError('');
    try {
      const res = await addComment(taskId, trimmed);
      setComments((prev) => [...prev, res.data.data]);
      setText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post comment');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(taskId, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch {
      setError('Could not delete comment');
    }
  };

  return (
    <div className="form-group comments-section">
      <label>Comments &amp; Activity</label>
      <div className="comment-list">
        {loading && <div className="comment-empty">Loading comments...</div>}
        {!loading && comments.length === 0 && (
          <div className="comment-empty">No comments yet. Start the discussion.</div>
        )}
        {!loading && comments.map((c) => (
          <div key={c._id} className="comment-item">
            <span className="member-avatar" style={{ background: avatarColor(c.author?.email || '') }}>
              {initialsFor(c.author?.name, c.author?.email)}
            </span>
            <div className="comment-body">
              <div className="comment-meta">
                <span className="comment-author">{c.author?.name || c.author?.email || 'Unknown'}</span>
                <span className="comment-time">{timeAgo(c.createdAt)}</span>
              </div>
              <div className="comment-text re-output" dangerouslySetInnerHTML={{ __html: c.text }} />
            </div>
            {currentUser && c.author?._id === currentUser._id && (
              <button
                type="button"
                className="comment-delete"
                onClick={() => handleDelete(c._id)}
                aria-label="Delete comment"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="comment-input-row">
        <RichEditor
          content={text}
          onChange={setText}
          placeholder="Write a comment — supports bold, lists…"
          minHeight={64}
          simple
        />
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handlePost}
          disabled={posting || !text.replace(/<[^>]*>/g, '').trim()}
        >
          {posting ? 'Posting…' : 'Comment'}
        </button>
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export default function TaskModal({ isOpen, onClose, onSubmit, editingTask, loading }) {
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    if (editingTask) {
      setForm({
        title: editingTask.title || '',
        description: editingTask.description || '',
        status: editingTask.status || 'pending',
        priority: editingTask.priority || 'medium',
        dueDate: editingTask.dueDate ? editingTask.dueDate.split('T')[0] : '',
        members: editingTask.members || []
      });
    } else {
      setForm(initialForm);
    }
    setErrors({});
  }, [isOpen, editingTask]);

  const validate = () => {
    const errs = {};
    const title = form.title.trim();
    if (!title) errs.title = 'Title is required';
    else if (title.length < 3) errs.title = 'Title must be at least 3 characters';
    else if (title.length > 100) errs.title = 'Title cannot exceed 100 characters';
    if (form.description.replace(/<[^>]*>/g, '').length > 500) errs.description = 'Description cannot exceed 500 characters';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({
      ...form,
      dueDate: form.dueDate || null,
      members: form.members.map((m) => m._id)
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const addMember = (user) => {
    setForm((prev) =>
      prev.members.some((m) => m._id === user._id)
        ? prev
        : { ...prev, members: [...prev.members, user] }
    );
  };

  const removeMember = (userId) => {
    setForm((prev) => ({ ...prev, members: prev.members.filter((m) => m._id !== userId) }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="title">
                Title <span className="required">*</span>
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter task title"
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label>Description</label>
              <RichEditor
                content={form.description}
                onChange={(html) => {
                  setForm(prev => ({ ...prev, description: html }));
                  if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                }}
                placeholder="Add a description — supports bold, lists, code…"
                minHeight={100}
              />
              {errors.description && <span className="field-error">{errors.description}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" value={form.status} onChange={handleChange}>
                  <option value="todo">Todo</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select id="priority" name="priority" value={form.priority} onChange={handleChange}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                id="dueDate"
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
              />
            </div>

            <MembersField
              members={form.members}
              onAdd={addMember}
              onRemove={removeMember}
              currentUserId={currentUser?._id || currentUser?.id}
            />

            {editingTask && (
              <AttachmentsSection
                taskId={editingTask._id}
                initialAttachments={editingTask.attachments || []}
              />
            )}

            {editingTask && (
              <CommentsSection taskId={editingTask._id} currentUser={currentUser} />
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
