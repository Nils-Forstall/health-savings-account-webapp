import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

export const hsaService = {
  createHSA: async (userId) => {
    const response = await axios.post(`${API_BASE}/hsa/create`, {
      userId
    });
    return response.data;
  },

  getHSA: async (userId) => {
    const response = await axios.get(`${API_BASE}/hsa/${userId}`);
    return response.data;
  },

  deposit: async (userId, amount) => {
    const response = await axios.post(`${API_BASE}/hsa/deposit`, {
      userId,
      amount: parseFloat(amount)
    });
    return response.data;
  },

  withdraw: async (userId, amount, reason, cardNumber, expiryMonth, expiryYear, cvv) => {
    const response = await axios.post(`${API_BASE}/hsa/withdraw`, {
      userId,
      amount: parseFloat(amount),
      reason,
      cardNumber,
      expiryMonth: parseInt(expiryMonth),
      expiryYear: parseInt(expiryYear),
      cvv
    });
    return response.data;
  },

  getTransactions: async (userId) => {
    const response = await axios.get(`${API_BASE}/hsa/transactions/${userId}`);
    return response.data;
  },

  issueCard: async (hsaAccountId) => {
    const response = await axios.post(`${API_BASE}/card/issue`, {
      hsaAccountId
    });
    return response.data;
  },

  processTransaction: async (cardNumber, amount, merchant, description, expiryMonth, expiryYear, cvv) => {
    const response = await axios.post(`${API_BASE}/transaction/process`, {
      cardNumber,
      amount: parseFloat(amount),
      merchant,
      description,
      expiryMonth: parseInt(expiryMonth),
      expiryYear: parseInt(expiryYear),
      cvv
    });
    return response.data;
  },

  getContributionLimits: async (userId) => {
    const response = await axios.get(`${API_BASE}/hsa/contribution-limits/${userId}`);
    return response.data;
  }
};
