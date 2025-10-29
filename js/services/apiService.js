// const API_BASE_URL = 'http://sentinelabackend-env.eba-c8cukuyj.sa-east-1.elasticbeanstalk.com';
const API_BASE_URL = 'http://localhost:5000';

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

    const response = await fetch(`${API_BASE_URL}/user/login`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
}

export async function recoverPassword(email) {
    const formData = new FormData();
    formData.append('email', email);
    const response = await fetch(`${API_BASE_URL}/user/recuperar`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
}

export async function validateToken(token) {
    const formData = new FormData();
    formData.append('token', token);
    const response = await fetch(`${API_BASE_URL}/user/validar-token`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
}

export async function resetPassword(token, newPassword) {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('novaSenha', newPassword);
    const response = await fetch(`${API_BASE_URL}/user/redefinir`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
}

export async function logoutUser() {
    const response = await fetch(`${API_BASE_URL}/user/logout`, { method: 'POST' });
    return handleResponse(response);
}

// Nova função para o Perfil
export async function updateUser(userId, userData) {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/atualizar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    return handleResponse(response);
}

export async function updatePassword(userId, senhaAtual, novaSenha) {
  const response = await fetch(`${API_BASE_URL}/user/${userId}/senha`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senhaAtual, novaSenha }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Erro ao atualizar senha.');
  }

  return await response.text();
}

export async function getUserData(userId) {
    // Faz uma requisição GET para o endpoint que retorna os dados do usuário
    const response = await fetch(`${API_BASE_URL}/user/${userId}/informacoes`, {
        method: 'GET',
    });
    return handleResponse(response);
}
