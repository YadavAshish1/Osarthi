import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const exploreApi = axios.create({
  baseURL: `${BASE}/api/explore`,
  headers: { 'Content-Type': 'application/json' },
});

export const getTree = () => exploreApi.get('/tree').then((r) => r.data);
export const getClasses = () => exploreApi.get('/classes').then((r) => r.data);
export const getSubjects = (classId) => exploreApi.get(`/subjects?classId=${classId}`).then((r) => r.data);
export const getTopics = (subjectId) => exploreApi.get(`/topics?subjectId=${subjectId}`).then((r) => r.data);
export const getFeatured = () => exploreApi.get('/featured').then((r) => r.data);
export const getBlogs = (params) => exploreApi.get('/blogs', { params }).then((r) => r.data);
export const getBlog = (id) => exploreApi.get(`/blogs/${id}`).then((r) => r.data);
