/**
 * Configurações centrais utilizadas em todas as integrações com o back-end.
 * A ideia é ter um único lugar que saiba qual URL base utilizar, independente
 * do ambiente (desenvolvimento local ou produção). Assim, qualquer ajuste
 * futuro precisa ser feito apenas aqui.
 */
const ENVIRONMENTS = {
    development: {
        name: 'development',
        apiBaseUrl: 'http://localhost:5000'
    },
    production: {
        name: 'production',
        // Troque pelo endpoint oficial assim que estiver disponível.
        apiBaseUrl: 'https://serene-beyond-01511-6c0e17f4c92b.herokuapp.com/'
    }
};

/**
 * Descobre automaticamente o ambiente com base na origem em que o front-end
 * está sendo executado. Caso o host contenha "localhost" ou "127.0.0.1",
 * considera-se ambiente de desenvolvimento.
 */
const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
);

const CURRENT_ENV = isLocalhost ? ENVIRONMENTS.development : ENVIRONMENTS.production;

/**
 * Mapeamento centralizado de todos os endpoints utilizados pela aplicação.
 * Manter esse objeto atualizado facilita a vida de quem precisar encontrar
 * um caminho de API específico ou adicionar novos recursos.
 */
export const API_ENDPOINTS = {
    user: {
        partialSignup: '/user/cadastrar-parcial',
        completeSignup: '/user/cadastrar-completo',
        login: '/user/login',
        logout: '/user/logout',
        recover: '/user/recuperar',
        validateToken: '/user/validar-token',
        resetPassword: '/user/redefinir',
        info: (userId) => `/user/${userId}/informacoes`,
        update: (userId) => `/user/${userId}/atualizar`,
        updatePassword: (userId) => `/user/${userId}/senha`,
        listByStatus: '/user/listByStatus',
        approve: (userId) => `/user/${userId}/aprovar`
    },

    instituicao: {
        cadastrar: '/instituicoes/cadastrar', 
        atualizar: (id) => `/instituicoes/${id}/atualizar`, 
        listar: '/instituicoes/listar', 
        listarUsuarios: (id) => `/instituicoes/${id}/listUsers` 
    },

    denuncia: {
        listar: '/denuncias/listarDenuncias',
        registrarExterna: '/denuncias/registrarexterna',
        atualizar: (id) => `/denuncias/${id}`
    },

    conflito: {
        cadastrar: '/conflito/cadastroDireto',
        listar: '/conflito/listarConflitos',
        buscar: (id) => `/conflito/${id}`,
        atualizar: (id) => `/conflito/${id}`
    }
};

export const API_CONFIG = {
    baseUrl: CURRENT_ENV.apiBaseUrl,
    environment: CURRENT_ENV.name
};