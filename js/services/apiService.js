import { httpClient, toFormData } from './httpClient.js';
import { API_ENDPOINTS } from './config.js';

/**
 * Todas as funções abaixo servem como camada de "serviço" entre as páginas
 * e o cliente HTTP. Aqui concentramos apenas a regra de negócio necessária
 * para montar cada requisição (ex.: body, query params, conversões, etc.).
 */

// ######################################################################
// ##                       SERVIÇOS DE USUÁRIO                        ##
// ######################################################################

/**
 * Envia uma solicitação de cadastro parcial (solicitação de acesso).
 * @param {object} partialData - Objeto contendo nome, email, instituicao, cargo, justificativa.
 * @returns {Promise<string>} - A mensagem de sucesso do backend (ex: "Solicitação enviada").
 */
export function cadastrarParcial(partialData) {
    const formData = toFormData({
        nome: partialData.nome,
        email: partialData.email,
        instituicao: partialData.instituicao,
        cargo: partialData.cargo,
        justificativa: partialData.justificativa,
    });
    // [ControladorUser.java, @PostMapping("/cadastrar-parcial")]
    return httpClient.post(API_ENDPOINTS.user.partialSignup, formData, { isForm: true });
}

/**
 * Finaliza o cadastro de um usuário usando o token enviado por e-mail.
 * @param {string} token - Token recebido por e-mail.
 * @param {string} senha - Nova senha.
 * @param {string} telefone - Telefone do usuário.
 * @param {string} dataNascimento - Data de nascimento.
 * @param {string} cpf - CPF do usuário.
 * @returns {Promise<string>} - A mensagem de sucesso do backend (ex: "Cadastro completo...").
 */
export function cadastrarCompleto(token, senha, telefone, dataNascimento, cpf) {
    const formData = toFormData({ token, senha, telefone, dataNascimento, cpf });
    // [ControladorUser.java, @PostMapping("/cadastrar-completo")]
    return httpClient.post(API_ENDPOINTS.user.completeSignup, formData, { isForm: true });
}

/**
 * Autentica o usuário retornando o objeto completo do backend.
 * @param {string} email - Email do usuário.
 * @param {string} senha - Senha do usuário.
 * @returns {Promise<object>} - O objeto completo do usuário (UserAbstract).
 */
export function loginUser(email, senha) {
    const formData = toFormData({ email, senha });
    // [ControladorUser.java, @PostMapping("/login")]
    return httpClient.post(API_ENDPOINTS.user.login, formData, { isForm: true });
}

/**
 * Inicia o fluxo de recuperação de senha enviando o e-mail do usuário.
 * @param {string} email - Email para o qual enviar as instruções.
 * @returns {Promise<string>} - A mensagem de sucesso do backend.
 */
export function recoverPassword(email) {
    const formData = toFormData({ email });
    // [ControladorUser.java, @PostMapping("/recuperar")]
    return httpClient.post(API_ENDPOINTS.user.recover, formData, { isForm: true });
}

/**
 * Valida o token recebido na etapa anterior do fluxo de recuperação.
 * @param {string} token - O token a ser validado.
 * @returns {Promise<string>} - A mensagem de sucesso ("Token é válido.").
 */
export function validateToken(token) {
    const formData = toFormData({ token });
    // [ControladorUser.java, @PostMapping("/validar-token")]
    return httpClient.post(API_ENDPOINTS.user.validateToken, formData, { isForm: true });
}

/**
 * Redefine a senha do usuário utilizando o token validado.
 * @param {string} token - O token validado.
 * @param {string} novaSenha - A nova senha a ser definida.
 * @returns {Promise<string>} - A mensagem de sucesso ("Senha redefinida...").
 */
export function resetPassword(token, novaSenha) {
    const formData = toFormData({ token, novaSenha });
    // [ControladorUser.java, @PostMapping("/redefinir")]
    return httpClient.post(API_ENDPOINTS.user.resetPassword, formData, { isForm: true });
}

/**
 * Encerra a sessão do usuário logado.
 * @returns {Promise<string>} - A mensagem de sucesso ("Logout efetuado...").
 */
export function logoutUser() {
    // [ControladorUser.java, @PostMapping("/logout")]
    // Assumindo que o logout no front-end limpa o localStorage e o backend
    // pode aceitar um POST vazio ou com dados de sessão que o httpClient envia (cookies, etc).
    return httpClient.post(API_ENDPOINTS.user.logout);
}

/**
 * Atualiza dados cadastrais do usuário logado (enviados como JSON).
 * @param {number|string} userId - ID do usuário a ser atualizado.
 * @param {object} userData - Objeto (UpUserDTO) com os dados a serem atualizados (ex: nome, telefone).
 * @returns {Promise<object>} - O objeto do usuário (UserAbstract) com os dados atualizados.
 */
export function updateUser(userId, userData) {
    // [ControladorUser.java, @PatchMapping("/{id}/atualizar")]
    // O @RequestBody no Java espera JSON. O httpClient faz isso automaticamente
    // quando 'isForm' não é true.
    return httpClient.patch(API_ENDPOINTS.user.update(userId), userData);
}

/**
 * Atualiza a senha a partir da senha atual e da nova senha desejada (enviadas como JSON).
 * @param {number|string} userId - ID do usuário.
 * @param {string} senhaAtual - A senha atual para verificação.
 * @param {string} novaSenha - A nova senha a ser definida.
 * @returns {Promise<string>} - A mensagem de sucesso ("Senha atualizada...").
 */
export function updatePassword(userId, senhaAtual, novaSenha) {
    // [ControladorUser.java, @PatchMapping("/{id}/senha")]
    // O @RequestBody no Java espera JSON.
    return httpClient.patch(API_ENDPOINTS.user.updatePassword(userId), { senhaAtual, novaSenha });
}

/**
 * Obtém os dados mais recentes do usuário logado diretamente do backend.
 * @param {number|string} userId - ID do usuário.
 * @returns {Promise<object>} - O objeto completo do usuário (UserAbstract).
 */
export function getUserData(userId) {
    // [ControladorUser.java, @GetMapping("/{id}/informacoes")]
    return httpClient.get(API_ENDPOINTS.user.info(userId));
}

/**
 * Lista usuários filtrando por status (ex.: PENDENTE, ATIVO).
 * @param {string} status - O status para filtrar (ex: "PENDENTE").
 * @returns {Promise<Array<object>>} - Uma lista de objetos de usuário.
 */
export function listUsersByStatus(status) {
    // [ControladorUser.java, @GetMapping("/listByStatus")]
    const path = `${API_ENDPOINTS.user.listByStatus}?status=${encodeURIComponent(status)}`;
    return httpClient.get(path);
}

/**
 * Aprova ou rejeita um usuário pendente de acordo com o botão clicado.
 * @param {number|string} userId - ID do usuário a aprovar/rejeitar.
 * @param {boolean} isApproved - true para aprovar, false para rejeitar.
 * @returns {Promise<string>} - A mensagem de sucesso do backend (ex: "Usuário aprovado...").
 */
export function approveOrRejectUser(userId, isApproved) {
    // [ControladorUser.java, @PatchMapping("/{id}/aprovar")]
    const path = `${API_ENDPOINTS.user.approve(userId)}?aprovado=${isApproved}`;
    return httpClient.patch(path);
}


// ######################################################################
// ##                     SERVIÇOS DE INSTITUIÇÃO                      ##
// ######################################################################

/**
 * Cadastra uma nova instituição (enviado como JSON).
 * @param {object} instituicaoData - Objeto (InstituicaoDTO) com os dados da nova instituição.
 * @returns {Promise<object>} - O objeto da instituição recém-criada.
 */
export function cadastrarInstituicao(instituicaoData) {
    // [ControladorInstituicao.java, @PostMapping("/cadastrar")]
    // @RequestBody espera JSON.
    return httpClient.post(API_ENDPOINTS.instituicao.cadastrar, instituicaoData);
}

/**
 * Atualiza dados de uma instituição (enviado como JSON).
 * @param {number|string} id - ID da instituição a ser atualizada.
 * @param {object} instituicaoData - Objeto (UpInstituicaoDTO) com os dados a serem atualizados.
 * @returns {Promise<object>} - O objeto da instituição com os dados atualizados.
 */
export function atualizarInstituicao(id, instituicaoData) {
    // [ControladorInstituicao.java, @PatchMapping("/{id}/atualizar")]
    // @RequestBody espera JSON.
    return httpClient.patch(API_ENDPOINTS.instituicao.atualizar(id), instituicaoData);
}

/**
 * Lista todas as instituições cadastradas.
 * @returns {Promise<Array<object>>} - Uma lista de objetos de instituição.
 */
export function listarInstituicoes() {
    // [ControladorInstituicao.java, @GetMapping("/listar")]
    return httpClient.get(API_ENDPOINTS.instituicao.listar);
}

/**
 * Lista usuários de uma instituição específica por tipo.
 * @param {number|string} id - ID da instituição.
 * @param {string} tipo - Tipo de usuário a listar (ex: "GESTOR", "USUARIO").
 * @returns {Promise<Array<object>>} - Uma lista de objetos de usuário.
 */
export function listarUsuariosPorInstituicao(id, tipo) {
    // [ControladorInstituicao.java, @GetMapping("/{id}/listUsers")]
    const path = `${API_ENDPOINTS.instituicao.listarUsuarios(id)}?tipo=${encodeURIComponent(tipo)}`;
    return httpClient.get(path);
}


// ######################################################################
// ##                      SERVIÇOS DE DENÚNCIA                       ##
// ######################################################################

/**
 * Lista todas as denúncias.
 * @returns {Promise<Array<object>>} - Uma lista de objetos de denúncia.
 */
export function listarDenuncias() {
    // [ControladorDenuncias.java, @GetMapping("/listarDenuncias")]
    return httpClient.get(API_ENDPOINTS.denuncia.listar);
}

/**
 * Registra uma nova denúncia externa (enviado como JSON).
 * @param {object} denunciaData - Objeto (DenunciaDTO) com os dados da denúncia.
 * @returns {Promise<object>} - O objeto da denúncia recém-registrada.
 */
export function registrarDenunciaExterna(denunciaData) {
    // [ControladorDenuncias.java, @PatchMapping("/registrarexterna")]
    // @RequestBody espera JSON.
    return httpClient.patch(API_ENDPOINTS.denuncia.registrarExterna, denunciaData);
}

/**
 * Atualiza uma denúncia existente (enviado como JSON).
 * @param {number|string} id - ID da denúncia a ser atualizada.
 * @param {object} denunciaData - Objeto (DenunciaDTO) com os dados a serem atualizados.
 * @returns {Promise<object>} - O objeto da denúncia com os dados atualizados.
 */
export function atualizarDenuncia(id, denunciaData) {
    // [ControladorDenuncias.java, @PatchMapping("/{id}")]
    // @RequestBody espera JSON.
    return httpClient.patch(API_ENDPOINTS.denuncia.atualizar(id), denunciaData);
}


// ######################################################################
// ##                      SERVIÇOS DE CONFLITO                       ##
// ######################################################################

/**
 * Cadastra um novo conflito diretamente (enviado como JSON).
 * @param {object} conflitoData - Objeto (ConflitoDTO) com os dados do novo conflito.
 * @returns {Promise<object>} - O objeto do conflito recém-criado.
 */
export function cadastrarConflito(conflitoData) {
    // [ControladorConflito.java, @PostMapping("/cadastroDireto")]
    // @RequestBody espera JSON.
    return httpClient.post(API_ENDPOINTS.conflito.cadastrar, conflitoData);
}

/**
 * Lista todos os conflitos.
 * @returns {Promise<Array<object>>} - Uma lista de objetos de conflito.
 */
export function listarConflitos() {
    // [ControladorConflito.java, @GetMapping("/listarConflitos")]
    return httpClient.get(API_ENDPOINTS.conflito.listar);
}

/**
 * Busca um conflito específico pelo seu ID.
 * @param {number|string} id - ID do conflito.
 * @returns {Promise<object>} - O objeto do conflito encontrado.
 */
export function buscarConflitoPorId(id) {
    // [ControladorConflito.java, @GetMapping("/{id}")]
    return httpClient.get(API_ENDPOINTS.conflito.buscar(id));
}

/**
 * Atualiza um conflito existente (enviado como JSON).
 * @param {number|string} id - ID do conflito a ser atualizado.
 * @param {object} conflitoData - Objeto (ConflitoDTO) com os dados a serem atualizados.
 * @returns {Promise<object>} - O objeto do conflito com os dados atualizados.
 */
export function atualizarConflito(id, conflitoData) {
    // [ControladorConflito.java, @PatchMapping("/{id}")]
    // @RequestBody espera JSON.
    return httpClient.patch(API_ENDPOINTS.conflito.atualizar(id), conflitoData);
}