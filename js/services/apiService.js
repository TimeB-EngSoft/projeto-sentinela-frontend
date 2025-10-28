const API_BASE_URL = 'http://sentinelabackend-env.eba-c8cukuyj.sa-east-1.elasticbeanstalk.com';

async function handleResponse(response) {
    const resClone = response.clone();
    try {
        const data = await response.json();
        if (!response.ok) return Promise.reject(data);
        return data;
    } catch {
        const textData = await resClone.text();
        if (!resClone.ok) return Promise.reject({ message: textData });
        return textData;
    }
}

export async function loginUser(email, senha) {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('senha', senha);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
}

export async function recoverPassword(email) {
    const formData = new FormData();
    formData.append('email', email);
    const response = await fetch(`${API_BASE_URL}/auth/recuperar`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
}

export async function validateToken(token) {
    const formData = new FormData();
    formData.append('token', token);
    const response = await fetch(`${API_BASE_URL}/auth/validar-token`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
}

export async function resetPassword(token, newPassword) {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('novaSenha', newPassword);
    const response = await fetch(`${API_BASE_URL}/auth/redefinir`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
}

export async function logoutUser() {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    return handleResponse(response);
}

// Nova função para o Perfil
export async function updateUser(userId, userData) {
    const response = await fetch(`${API_BASE_URL}/edit/${userId}/user`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    return handleResponse(response);
}
