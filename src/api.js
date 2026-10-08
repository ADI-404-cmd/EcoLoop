const API_BASE = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    ...options,
  });
  let payload;
  try { payload = await response.json(); } catch { throw new Error('The service returned an unreadable response.'); }
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || `Request failed (${response.status}).`);
  }
  return payload;
}

const query = params => {
  const search = new URLSearchParams(params).toString();
  return search ? `?${search}` : '';
};
const json = (method, body) => ({ method, body: JSON.stringify(body) });

export const api = {
  analytics: () => request('/analytics'),
  submissions: (params = {}) => request(`/submissions${query(params)}`),
  register: payload => request('/submissions', json('POST', payload)),
  categories: () => request('/categories'),
  exactModels: params => request(`/exact-models${query(params || {})}`),
  evaluate: payload => request('/calculator/evaluate', json('POST', payload)),
  references: () => request('/references'),
  centers: (params = {}) => request(`/collection-centers${query(params)}`),
  journey: code => request(`/circular-journey/${encodeURIComponent(code)}`),
  updateSubmissionStatus: (id, payload) => request(`/submissions/${encodeURIComponent(id)}/status`, json('PATCH', payload)),
};
