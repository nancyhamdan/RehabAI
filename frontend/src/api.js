import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:8000',
    // Allow sending cookies with requests (needed for authentication)
    withCredentials: true,
});