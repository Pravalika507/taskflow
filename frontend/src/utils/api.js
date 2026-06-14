import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Always attach the token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export const searchUsers = (q) => api.get('/users/search', { params: { q } });
export const getTeamMembers = () => api.get('/invite/team');

export const getComments = (taskId) => api.get(`/tasks/${taskId}/comments`);
export const addComment = (taskId, text) => api.post(`/tasks/${taskId}/comments`, { text });
export const deleteComment = (taskId, commentId) => api.delete(`/tasks/${taskId}/comments/${commentId}`);

export const uploadAttachment = (taskId, formData) =>
  api.post(`/tasks/${taskId}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteAttachment = (taskId, attachmentId) =>
  api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);

export const chatWithAI = (message, tasks) => api.post('/ai/chat', { message, tasks });
export const previewInvite = (token) => api.get('/invite/preview', { params: { token } });

export default api;
export const inviteUser = (email, name) => api.post('/users/invite', { email, name });
