import { httpClient, toFormData } from './httpClient.js';
import { API_ENDPOINTS } from './config.js';

/**
 * Todas as funções abaixo servem como camada de "serviço" entre as páginas
 * e o cliente HTTP. Aqui concentramos apenas a regra de negócio necessária
 * para montar cada requisição (ex.: body, query params, conversões, etc.).
 */

/**
 * Envia uma solicitação de cadastro parcial (solicitação de acesso).
 */
export function cadastrarParcial(partialData) {
    const formData = toFormData({
        nome: partialData.nome,
        email: partialData.email,
        instituicao: partialData.instituicao,
        cargo: partialData.cargo,
        justificativa: partialData.justificativa,
    });

    return httpClient.post(API_ENDPOINTS.user.partialSignup, formData, { isForm: true });
}

/**
 * Finaliza o cadastro de um usuário usando o token enviado por e-mail.
 */
export function cadastrarCompleto(token, senha, telefone, dataNascimento, cpf) {
    const formData = toFormData({ token, senha, telefone, dataNascimento, cpf });
    return httpClient.post(API_ENDPOINTS.user.completeSignup, formData, { isForm: true });
}

/**
 * Autentica o usuário retornando o objeto completo do backend.
 */
export function loginUser(email, senha) {
    const formData = toFormData({ email, senha });
    return httpClient.post(API_ENDPOINTS.user.login, formData, { isForm: true });
}

/**
 * Inicia o fluxo de recuperação de senha enviando o e-mail do usuário.
 */
export function recoverPassword(email) {
    const formData = toFormData({ email });
    return httpClient.post(API_ENDPOINTS.user.recover, formData, { isForm: true });
}

/**
 * Valida o token recebido na etapa anterior do fluxo de recuperação.
 */
export function validateToken(token) {
    const formData = toFormData({ token });
    return httpClient.post(API_ENDPOINTS.user.validateToken, formData, { isForm: true });
}

/**
 * Redefine a senha do usuário utilizando o token validado.
 */
export function resetPassword(token, novaSenha) {
    const formData = toFormData({ token, novaSenha });
    return httpClient.post(API_ENDPOINTS.user.resetPassword, formData, { isForm: true });
}

/**
 * Encerra a sessão do usuário logado.
 */
export function logoutUser() {
    return httpClient.post(API_ENDPOINTS.user.logout);
}

/**
 * Atualiza dados cadastrais do usuário logado.
 */
export function updateUser(userId, userData) {
    return httpClient.patch(API_ENDPOINTS.user.update(userId), userData);
}

/**
 * Atualiza a senha a partir da senha atual e da nova senha desejada.
 */
export function updatePassword(userId, senhaAtual, novaSenha) {
    return httpClient.patch(API_ENDPOINTS.user.updatePassword(userId), { senhaAtual, novaSenha });
}

/**
 * Obtém os dados mais recentes do usuário logado diretamente do backend.
 */
export function getUserData(userId) {
    return httpClient.get(API_ENDPOINTS.user.info(userId));
}

/**
 * Lista usuários filtrando por status (ex.: PENDENTE, ATIVO).
 */
export function listUsersByStatus(status) {
    const path = `${API_ENDPOINTS.user.listByStatus}?status=${encodeURIComponent(status)}`;
    return httpClient.get(path);
}

/**
 * Aprova ou rejeita um usuário pendente de acordo com o botão clicado.
 */
export function approveOrRejectUser(userId, isApproved) {
    return httpClient.patch(API_ENDPOINTS.user.approve(userId, isApproved));
}