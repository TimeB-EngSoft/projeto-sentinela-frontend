//const API_BASE_URL = 'http://sentinelabackend-env.eba-c8cukuyj.sa-east-1.elasticbeanstalk.com';
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

/**
 * Envia uma solicitação de cadastro parcial (solicitação de acesso).
 * @param {object} partialData - Objeto contendo os dados do formulário.
 */
export async function cadastrarParcial(partialData) {
    // O backend espera FormData porque usa @RequestParam
    const formData = new FormData();
    
    // Mapeia os dados do objeto para o FormData
    // Os nomes aqui (ex: 'cargo') devem ser idênticos aos @RequestParam no Java
    formData.append('nome', partialData.nome);
    formData.append('email', partialData.email);
    formData.append('instituicao', partialData.instituicao);
    formData.append('cargo', partialData.cargo); // 'cargo' é o nome esperado pelo backend
    formData.append('justificativa', partialData.justificativa);
    // Nota: 'departamento' não é enviado pois não é esperado pelo seu ControladorUser.java

    const response = await fetch(`${API_BASE_URL}/user/cadastrar-parcial`, {
        method: 'POST',
        body: formData,
    });
    
    // Reutiliza o handleResponse que já trata respostas de texto
    return handleResponse(response);
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

/**
 * Busca usuários com base em um status (ex: PENDENTE, ATIVO).
 */
export async function listUsersByStatus(status) {
    const response = await fetch(`${API_BASE_URL}/user/listByStatus?status=${status}`, {
        method: 'GET',
    });
    return handleResponse(response);
}

/**
 * Aprova ou rejeita o cadastro de um usuário.
 * @param {number} userId - O ID do usuário.
 * @param {boolean} isApproved - true para aprovar, false para rejeitar.
 */
export async function approveOrRejectUser(userId, isApproved) {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/aprovar?aprovado=${isApproved}`, {
        method: 'PATCH',
    });
    // O backend retorna uma string de sucesso, então handleResponse deve tratar isso
    return handleResponse(response); 
}

/**
 * Finaliza o cadastro de um usuário usando o token.
 */
export async function cadastrarCompleto(token, senha, telefone, dataNascimento, cpf) {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('senha', senha);
    formData.append('telefone', telefone);
    formData.append('dataNascimento', dataNascimento);
    formData.append('cpf', cpf);

    const response = await fetch(`${API_BASE_URL}/user/cadastrar-completo`, {
        method: 'POST',
        body: formData,
    });
    
    return handleResponse(response);
}