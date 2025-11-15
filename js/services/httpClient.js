import { API_CONFIG } from './config.js';

/**
 * Erro customizado que padroniza as informações retornadas pelas chamadas.
 */
export class ApiError extends Error {
    constructor(message, status, payload) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.payload = payload;
    }
}

/**
 * Cliente HTTP extremamente simples que encapsula o uso do fetch e garante
 * tratamento consistente de erros, cabeçalhos e serialização de dados.
 */
class HttpClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    /**
     * Executa uma requisição genérica.
     * @param {string} path - Endpoint relativo (ex.: "/user/login").
     * @param {object} options - Configurações adicionais do fetch.
     */
    async request(path, options = {}) {
        const { method = 'GET', headers = {}, body = null, isForm = false } = options;

        const finalHeaders = new Headers(headers);
        let finalBody = body;

        // Se não for formulário, garante serialização em JSON automaticamente.
        if (!isForm && body && !(body instanceof FormData) && method !== 'GET') {
            finalHeaders.set('Content-Type', 'application/json');
            finalBody = JSON.stringify(body);
        }

        const response = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: finalHeaders,
            body: finalBody,
        });

        const parsedBody = await this.parseResponse(response);
        if (!response.ok) {
            const normalizedError = this.normalizeError(parsedBody);
            throw new ApiError(normalizedError.message, response.status, normalizedError);
        }
        return parsedBody;
    }

    get(path, options = {}) {
        return this.request(path, { ...options, method: 'GET' });
    }

    post(path, body, options = {}) {
        return this.request(path, { ...options, method: 'POST', body });
    }

    patch(path, body, options = {}) {
        return this.request(path, { ...options, method: 'PATCH', body });
    }

    /**
     * Converte a resposta em JSON quando possível, caindo para texto quando necessário.
     */
    async parseResponse(response) {
        const clone = response.clone();
        try {
            return await response.json();
        } catch (jsonError) {
            const text = await clone.text();
            return text || null;
        }
    }

    /**
     * Garante que sempre teremos um objeto de erro com propriedade message.
     */
    normalizeError(payload) {
        if (!payload) return { message: 'Erro ao se comunicar com o servidor.' };
        if (typeof payload === 'string') return { message: payload };
        if (payload.message) return payload;
        return { ...payload, message: 'Erro ao se comunicar com o servidor.' };
    }
}

/**
 * Instância única do cliente a ser compartilhada em todos os serviços.
 */
export const httpClient = new HttpClient(API_CONFIG.baseUrl);

/**
 * Helper que transforma objetos simples em FormData, mantendo a legibilidade
 * dos serviços e evitando repetição de código.
 */
export function toFormData(payload = {}) {
    if (payload instanceof FormData) return payload;
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            formData.append(key, value);
        }
    });
    return formData;
}