/**
 * URL base do seu servidor. O endpoint específico (ex: /auth) será adicionado em cada função.
 */
const API_BASE_URL = 'http://localhost:8080';

/**
 * Função aprimorada para lidar com respostas da API que podem ser JSON ou texto.
 * @param {Response} response - O objeto de resposta da fetch API.
 */
async function handleResponse(response) {
    // Clona a resposta para poder ler o corpo de duas formas diferentes se necessário
    const resClone = response.clone();
    try {
        // Tenta converter a resposta para JSON
        const data = await response.json();
        if (!response.ok) return Promise.reject(data);
        return data;
    } catch (e) {
        // Se falhar (porque não é JSON), tenta ler como texto
        const textData = await resClone.text();
        if (!resClone.ok) return Promise.reject({ message: textData });
        return textData; // Retorna o texto puro em caso de sucesso (ex: login)
    }
}

/**
 * Envia uma requisição de login para o back-end usando FormData.
 * Corresponde a: @PostMapping("/login") com @RequestParam
 * @param {string} email - O email ou CPF do usuário.
 * @param {string} senha - A senha do usuário.
 */
export async function loginUser(email, senha) {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('senha', senha);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        body: formData, // Envia como FormData, não JSON
    });
    return handleResponse(response);
}

/**
 * Envia uma solicitação de cadastro parcial.
 * Corresponde a: @PostMapping("/cadastrar-parcial") com @RequestParam
 * @param {object} partialData - Objeto com nome, email, instituicao, cargo, justificativa.
 */
export async function cadastrarParcial(partialData) {
    const formData = new FormData();
    formData.append('nome', partialData.nome);
    formData.append('email', partialData.email);
    formData.append('instituicao', partialData.instituicao);
    formData.append('cargo', partialData.cargo);
    formData.append('justificativa', partialData.justificativa);

    const response = await fetch(`${API_BASE_URL}/auth/cadastrar-parcial`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
}


/**
 * Envia uma solicitação de recuperação de senha.
 * Corresponde a: @PostMapping("/recuperar") com @RequestParam
 * @param {string} email - O email para o qual enviar as instruções.
 */
export async function recoverPassword(email) {
    const formData = new FormData();
    formData.append('email', email);

    const response = await fetch(`${API_BASE_URL}/auth/recuperar`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
}

/**
 * Valida um token de recuperação de senha.
 * Corresponde a: @PostMapping("/validar-token") com @RequestParam
 * @param {string} token - O token a ser validado.
 */
export async function validateToken(token) {
    const formData = new FormData();
    formData.append('token', token);

    const response = await fetch(`${API_BASE_URL}/auth/validar-token`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
}

/**
 * Envia o token e a nova senha para o backend para finalizar a redefinição.
 * CORRIGIDO para incluir o API_BASE_URL e usar handleResponse para consistência.
 * @param {string} token - O token de validação.
 * @param {string} newPassword - A nova senha digitada pelo usuário.
 */
export async function resetPassword(token, newPassword) {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('novaSenha', newPassword); // O nome 'novaSenha' deve ser idêntico ao do @RequestParam

    // A chamada agora é feita para a URL completa e correta
    const response = await fetch(`${API_BASE_URL}/auth/redefinir`, {
        method: 'POST',
        body: formData, // Envia como FormData, que é esperado pelo @RequestParam
    });
    
    // Utiliza a sua função padrão de tratamento de resposta
    return handleResponse(response);
}