/**
 * URL base da sua API. Mude para o endereço do seu servidor.
 * Se estiver rodando localmente, pode ser 'http://localhost:3000/api'.
 */
const API_BASE_URL = 'http://localhost:8080/api'; // Exemplo de URL base

/**
 * Função para lidar com as respostas da API, tratando sucessos e erros.
 * @param {Response} response - O objeto de resposta da fetch API.
 * @returns {Promise<any>} - Retorna os dados em JSON se a resposta for bem-sucedida.
 * @throws {Error} - Lança um erro com a mensagem do servidor se houver falha.
 */
async function handleResponse(response) {
    // Converte a resposta para JSON
    const data = await response.json();

    if (response.ok) {
        // Se a resposta tiver status 2xx (sucesso), retorna os dados
        return data;
    } else {
        // Se houver erro, rejeita a promise com a mensagem de erro do back-end
        return Promise.reject(data);
    }
}

/**
 * Envia uma requisição de login para o back-end.
 * @param {string} email - O email ou CPF do usuário.
 * @param {string} password - A senha do usuário.
 * @returns {Promise<any>} - A resposta da API.
 */
export async function loginUser(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }), // Envia os dados como JSON
    });
    return handleResponse(response);
}

/**
 * Envia uma solicitação para solicitar acesso (cadastro).
 * @param {object} accessData - Os dados do formulário de solicitação de acesso.
 * @returns {Promise<any>} - A resposta da API.
 */
export async function requestAccess(accessData) {
    const response = await fetch(`${API_BASE_URL}/users/request-access`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(accessData),
    });
    return handleResponse(response);
}

/**
 * Envia uma solicitação de recuperação de senha.
 * @param {string} email - O email para o qual enviar as instruções.
 * @returns {Promise<any>} - A resposta da API.
 */
export async function recoverPassword(email) {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });
    return handleResponse(response);
}