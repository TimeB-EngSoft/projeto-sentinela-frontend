import { listarDenuncias } from '../../services/apiService.js';

const feedbackId = 'denunciasFeedback';
const tableBodyId = 'denunciasTableBody';

function setFeedback(message, type = 'info') {
    const feedback = document.getElementById(feedbackId);
    if (!feedback) return;
    const stateClass = type === 'error' ? 'is-error' : 'is-info';
    feedback.className = `card empty-card ${stateClass}`;
    feedback.textContent = message;
    feedback.style.display = message ? 'block' : 'none';
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('pt-BR');
}

function formatStatus(status) {
    if (!status) return '<span class="tag tag-status-pendente">Pendente</span>';
    const normalized = status.toString().toLowerCase();
    const map = {
        pendente: 'tag-status-pendente',
        aprovada: 'tag-status-aprovada',
        rejeitada: 'tag-status-rejeitada'
    };
    const klass = map[normalized] || 'tag-status-pendente';
    return `<span class="tag ${klass}">${status}</span>`;
}

function formatTipo(tipo) {
    if (!tipo) return '<span class="tag tag-tipo-desmatamento">—</span>';
    return `<span class="tag tag-tipo-terra">${tipo}</span>`;
}

function buildRow(denuncia) {
    const codigo = denuncia?.codigo || denuncia?.id || '—';
    const titulo = denuncia?.titulo || denuncia?.assunto || 'Sem título';
    const denunciante = denuncia?.denunciante || denuncia?.nomeDenunciante || denuncia?.nome || '—';
    const local = denuncia?.localizacao || denuncia?.cidade || denuncia?.estado ?
        [denuncia?.estado, denuncia?.cidade].filter(Boolean).join(' - ') || denuncia?.localizacao :
        'Localização não informada';
    const tipo = denuncia?.tipo || denuncia?.tipoConflito || '—';
    const data = denuncia?.dataRegistro || denuncia?.dataOcorrido || denuncia?.data || '';
    const prioridade = denuncia?.prioridade || '—';
    const status = denuncia?.status || denuncia?.statusDenuncia || 'Pendente';

    return `
        <tr>
            <td>${codigo}</td>
            <td>${titulo}</td>
            <td>${denunciante}</td>
            <td>${local}</td>
            <td>${formatTipo(tipo)}</td>
            <td>${formatDate(data)}</td>
            <td><span class="tag tag-prioridade-media">${prioridade}</span></td>
            <td>${formatStatus(status)}</td>
            <td><a href="#" class="btn btn-secondary btn-sm">Ver Detalhes</a></td>
        </tr>
    `;
}

async function renderDenuncias() {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;

    setFeedback('Carregando denúncias...', 'info');
    tbody.innerHTML = '';

    try {
        const denuncias = await listarDenuncias();
        if (!Array.isArray(denuncias) || denuncias.length === 0) {
            setFeedback('Nenhuma denúncia encontrada no momento.', 'info');
            return;
        }

        setFeedback('', 'info');
        tbody.innerHTML = denuncias.map(buildRow).join('');
    } catch (error) {
        console.error('Erro ao carregar denúncias:', error);
        setFeedback(error?.message || 'Não foi possível carregar as denúncias agora.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', renderDenuncias);