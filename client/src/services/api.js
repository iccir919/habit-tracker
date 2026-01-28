const API_URL = import.meta.env.PROD 
  ? '/api'  // In production, use relative URLs
  : 'http://localhost:3000/api';  // In development, use localhost
  
class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.status = status;
        this.data = data;
        this.name = 'ApiError';
    }
}

async function handleResponse(response) {
    const contentType = response.headers.get('content-type');
    const data = contentType && contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
            const errorMessages = data.errors.map(err => err.msg).join(', ');
            throw new ApiError(errorMessages, response.status, data);
        }

        throw new ApiError(
            data.error || data.message || 'An error occurred',
            response.status,
            data
        );
    }

    return data;
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

export const api = {
    get: async (endpoint) => {
        const response = await fetch (`${API_URL}${endpoint}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },
    
    post: async (endpoint, data) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    put: async (endpoint, data) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    
    delete: async (endpoint) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    }
};