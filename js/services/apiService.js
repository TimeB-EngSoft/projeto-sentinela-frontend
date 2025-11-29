// ... (Importações existentes)
import { httpClient, toFormData } from './httpClient.js';
import { API_ENDPOINTS, API_CONFIG } from './config.js';

// ... (Códigos existentes de User, Instituicao, etc)

// ######################################################################
// ##                      SERVIÇOS DE AUDITORIA                       ##
// ######################################################################

export function listarLogsAuditoria() {
    return httpClient.get('/auditoria/logs');
}

export function obterStatsAuditoria() {
    return httpClient.get('/auditoria/stats');
}

// ######################################################################
// ##                      SERVIÇOS DE RELATÓRIOS                      ##
// ######################################################################

export async function gerarRelatorio(filtros) {
    // A chamada de arquivo precisa ser tratada diferente para download
    const response = await fetch(`${API_CONFIG.baseUrl}/relatorios/gerar`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(filtros)
    });

    if (!response.ok) throw new Error('Erro ao gerar relatório');
    return await response.blob();
}

// ######################################################################
// ##                       SERVIÇOS DE USUÁRIO                        ##
// ######################################################################

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

export function cadastrarCompleto(token, senha, telefone, dataNascimento, cpf) {
    const formData = toFormData({ token, senha, telefone, dataNascimento, cpf });
    return httpClient.post(API_ENDPOINTS.user.completeSignup, formData, { isForm: true });
}

export function loginUser(email, senha) {
    const formData = toFormData({ email, senha });
    return httpClient.post(API_ENDPOINTS.user.login, formData, { isForm: true });
}

export function recoverPassword(email) {
    const formData = toFormData({ email });
    return httpClient.post(API_ENDPOINTS.user.recover, formData, { isForm: true });
}

export function validateToken(token) {
    const formData = toFormData({ token });
    return httpClient.post(API_ENDPOINTS.user.validateToken, formData, { isForm: true });
}

export function resetPassword(token, novaSenha) {
    const formData = toFormData({ token, novaSenha });
    return httpClient.post(API_ENDPOINTS.user.resetPassword, formData, { isForm: true });
}

export function logoutUser() {
    return httpClient.post(API_ENDPOINTS.user.logout);
}

export function updateUser(userId, userData) {
    return httpClient.patch(API_ENDPOINTS.user.update(userId), userData);
}

export function updatePassword(userId, senhaAtual, novaSenha) {
    return httpClient.patch(API_ENDPOINTS.user.updatePassword(userId), { senhaAtual, novaSenha });
}

export function getUserData(userId) {
    return httpClient.get(API_ENDPOINTS.user.info(userId));
}

/**
 * Lista usuários filtrando por status e outros critérios opcionais.
 * @param {object|string} filters - Objeto { status, instituicaoId, cargo, filtroEspecial } ou string de status.
 */
export function listUsersByStatus(filters) {
    // Mantém compatibilidade se passar apenas string
    if (typeof filters === 'string') {
        filters = { status: filters };
    }

    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.instituicaoId) params.append('instituicaoId', filters.instituicaoId);
    if (filters.cargo) params.append('cargo', filters.cargo);
    if (filters.filtroEspecial) params.append('filtroEspecial', filters.filtroEspecial);

    return httpClient.get(`${API_ENDPOINTS.user.listByStatus}?${params.toString()}`);
}

export function approveOrRejectUser(userId, isApproved) {
    const path = `${API_ENDPOINTS.user.approve(userId)}?aprovado=${isApproved}`;
    return httpClient.patch(path);
}

// ######################################################################
// ##                     SERVIÇOS DE INSTITUIÇÃO                      ##
// ######################################################################

export function cadastrarInstituicao(instituicaoData) {
    return httpClient.post(API_ENDPOINTS.instituicao.cadastrar, instituicaoData);
}

export function atualizarInstituicao(id, instituicaoData) {
    return httpClient.patch(API_ENDPOINTS.instituicao.atualizar(id), instituicaoData);
}

export function listarInstituicoes() {
    return httpClient.get(API_ENDPOINTS.instituicao.listar);
}

export function listarUsuariosPorInstituicao(id, tipo) {
    const path = `${API_ENDPOINTS.instituicao.listarUsuarios(id)}?tipo=${encodeURIComponent(tipo)}`;
    return httpClient.get(path);
}

// ######################################################################
// ##                      SERVIÇOS DE DENÚNCIA                       ##
// ######################################################################

export function listarDenuncias() {
    return httpClient.get(API_ENDPOINTS.denuncia.listar);
}

export function registrarDenunciaExterna(denunciaData) {
    return httpClient.patch(API_ENDPOINTS.denuncia.registrarExterna, denunciaData);
}

export function atualizarDenuncia(id, denunciaData) {
    return httpClient.patch(API_ENDPOINTS.denuncia.atualizar(id), denunciaData);
}

// ######################################################################
// ##                      SERVIÇOS DE CONFLITO                       ##
// ######################################################################

export function cadastrarConflito(conflitoData) {
    return httpClient.post(API_ENDPOINTS.conflito.cadastrar, conflitoData);
}

export function listarConflitos() {
    return httpClient.get(API_ENDPOINTS.conflito.listar);
}

export function buscarConflitoPorId(id) {
    return httpClient.get(API_ENDPOINTS.conflito.buscar(id));
}

export function atualizarConflito(id, conflitoData) {
    return httpClient.patch(API_ENDPOINTS.conflito.atualizar(id), conflitoData);
}