import { supabase } from './supabase';

// Tidak diisi di build produksi web = backend di domain yang sama (deploy Vercel: /api/*).
// Pengembangan lokal = http://localhost:8000. Android (Capacitor) wajib mengisi VITE_API_URL.
const RAW_API = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:8000');
export const API_URL = RAW_API.replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = true, headers = {} } = {}) {
  const h = { 'Content-Type': 'application/json', ...headers };
  if (auth && supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) h.Authorization = `Bearer ${data.session.access_token}`;
  }
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server kerajaan. Periksa koneksi internet atau pastikan backend berjalan.', 0);
  }
  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* respons kosong */
  }
  if (!res.ok) {
    const detail = data?.detail;
    const msg = typeof detail === 'string' ? detail
      : Array.isArray(detail) ? 'Data yang dikirim belum lengkap atau tidak valid.'
      : 'Terjadi kesalahan. Coba lagi, ya.';
    throw new ApiError(msg, res.status);
  }
  return data;
}

export const api = {
  login: (student_code) => request('/api/auth/login', { method: 'POST', body: { student_code }, auth: false }),
  startSession: (kind, ref_id, opts = {}) => request('/api/sessions', { method: 'POST', body: { kind, ref_id, ...opts } }),
  getSession: (id) => request(`/api/sessions/${id}`),
  answer: (id, index, answer, reason) => request(`/api/sessions/${id}/answer`, { method: 'POST', body: { index, answer, reason } }),
  hint: (id, index) => request(`/api/sessions/${id}/hint`, { method: 'POST', body: { index } }),
  finish: (id) => request(`/api/sessions/${id}/finish`, { method: 'POST' }),
  completeLesson: (lessonId) => request(`/api/lessons/${lessonId}/complete`, { method: 'POST' }),
  admin: {
    list: (key) => request('/api/admin/students', { auth: false, headers: { 'X-Admin-Key': key } }),
    create: (key, body) => request('/api/admin/students', { method: 'POST', body, auth: false, headers: { 'X-Admin-Key': key } }),
    remove: (key, id) => request(`/api/admin/students/${id}`, { method: 'DELETE', auth: false, headers: { 'X-Admin-Key': key } }),
  },
};
