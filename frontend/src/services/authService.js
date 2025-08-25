import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

export const authService = {
  login: async (email, password) => {
    const response = await axios.post(`${API_BASE}/users/login`, {
      email,
      password
    });
    return response.data;
  },

  createUser: async (userData) => {
    const response = await axios.post(`${API_BASE}/users/create`, userData);
    return response.data;
  }
};
