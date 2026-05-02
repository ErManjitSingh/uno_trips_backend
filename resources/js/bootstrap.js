import axios from 'axios';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// Shared hosting par lambi form saves / Inertia visits ke liye zyada wait (default ~0 = hang feel)
window.axios.defaults.timeout = 120000;
