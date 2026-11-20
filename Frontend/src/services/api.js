import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const api = {
  // ─── Auth ──────────────────────────────────────────────────────────────────
  async login(username, password) {
    const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
    return res.data;
  },

  async register(username, email, password) {
    const res = await axios.post(`${API_BASE}/auth/register`, { username, email, password });
    return res.data;
  },

  async changePassword(token, currentPassword, newPassword) {
    const res = await axios.post(`${API_BASE}/auth/change-password`, { currentPassword, newPassword }, {
      headers: authHeaders(token),
    });
    return res.data;
  },

  // ─── Users ─────────────────────────────────────────────────────────────────
  async getUsers(token) {
    const res = await axios.get(`${API_BASE}/users`, { headers: authHeaders(token) });
    return res.data;
  },

  async createUser(token, userData) {
    const res = await axios.post(`${API_BASE}/users`, userData, {
      headers: authHeaders(token),
    });
    return res.data;
  },

  async updateUser(token, id, updates) {
    const res = await axios.put(`${API_BASE}/users/${id}`, updates, {
      headers: authHeaders(token),
    });
    return res.data;
  },

  async deleteUser(token, id) {
    const res = await axios.delete(`${API_BASE}/users/${id}`, {
      headers: authHeaders(token),
    });
    return res.data;
  },

  async getMe(token) {
    const res = await axios.get(`${API_BASE}/me`, { headers: authHeaders(token) });
    return res.data;
  },

  // ─── Tasks ─────────────────────────────────────────────────────────────────
  async getTasks(token, filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await axios.get(`${API_BASE}/tasks?${params}`, { headers: authHeaders(token) });
    return res.data;
  },

  async getTaskStats(token) {
    const res = await axios.get(`${API_BASE}/tasks/stats`, { headers: authHeaders(token) });
    return res.data;
  },

  async getTask(token, id) {
    const res = await axios.get(`${API_BASE}/tasks/${id}`, { headers: authHeaders(token) });
    return res.data;
  },

  async createTask(token, task) {
    const res = await axios.post(`${API_BASE}/tasks`, task, { headers: authHeaders(token) });
    return res.data;
  },

  async updateTask(token, id, updates) {
    const res = await axios.put(`${API_BASE}/tasks/${id}`, updates, { headers: authHeaders(token) });
    return res.data;
  },

  async updateTaskStatus(token, id, status, order) {
    const res = await axios.put(`${API_BASE}/tasks/${id}/status`, { status, order }, { headers: authHeaders(token) });
    return res.data;
  },

  async deleteTask(token, id) {
    const res = await axios.delete(`${API_BASE}/tasks/${id}`, { headers: authHeaders(token) });
    return res.data;
  },

  async addComment(token, taskId, content) {
    const res = await axios.post(`${API_BASE}/tasks/${taskId}/comments`, { content }, { headers: authHeaders(token) });
    return res.data;
  },

  // ─── Notifications ─────────────────────────────────────────────────────────
  async getNotifications(token, unreadOnly = false) {
    const params = unreadOnly ? "?unreadOnly=true" : "";
    const res = await axios.get(`${API_BASE}/notifications${params}`, { headers: authHeaders(token) });
    return res.data;
  },

  async markNotificationRead(token, id) {
    const res = await axios.put(`${API_BASE}/notifications/${id}/read`, {}, { headers: authHeaders(token) });
    return res.data;
  },

  async markAllNotificationsRead(token) {
    const res = await axios.put(`${API_BASE}/notifications/read-all`, {}, { headers: authHeaders(token) });
    return res.data;
  },

  // ─── Audit ─────────────────────────────────────────────────────────────────
  async getAuditLogs(token, params = {}) {
    const query = new URLSearchParams(params);
    const res = await axios.get(`${API_BASE}/audit?${query}`, { headers: authHeaders(token) });
    return res.data;
  },

  async getActivity(token, limit = 50) {
    const res = await axios.get(`${API_BASE}/audit/activity?limit=${limit}`, { headers: authHeaders(token) });
    return res.data;
  },

  async exportAuditCSV(token) {
    const res = await axios.get(`${API_BASE}/audit/export`, {
      headers: authHeaders(token),
      responseType: "blob",
    });
    return res.data;
  },
};

export default api;
