import { listarConflitos } from '../../services/apiService.js';

const feedbackId = 'conflitosFeedback';
const tableBodyId = 'conflitosTableBody';

function setFeedback(message, type = 'info') {
    const feedback = document.getElementById(feedbackId);
    if (!feedback) return;
    const stateClass = type === 'error' ? 'is-error' : 'is-info';
    feedback.className = `card empty-card ${stateClass}`;
    feedback.textContent = message;
    feedback.style.display = message ? 'block' : 'none';
}

function formatStatus(status) {
    if (!status) return '<span class="status-tag status-pendente"><i class="fas fa-hourglass-half"></i> Pendente</span>';
    const normalized = status.toString().toLowerCase();
    const map = {
        pendente: 'status-pendente',
        analise: 'status-analise',
        resolvido: 'status-resolvido',
        concluido: 'status-resolvido'
    };
    const klass = map[normalized] || 'status-analise';
    const iconMap = {
        'status-pendente': 'fa-hourglass-half',
        'status-analise': 'fa-search',
        'status-resolvido': 'fa-check-circle'
    };
    const icon = iconMap[klass] || 'fa-search';
    return `<span class="status-tag ${klass}"><i class="fas ${icon}"></i> ${status}</span>`;
}

function formatPriority(priority) {
    if (!priority) return '<span class="tag tag-prioridade-media">—</span>';
    const normalized = priority.toString().toLowerCase();
    const map = {
        alta: 'tag-prioridade-alta',
        media: 'tag-prioridade-media',
        baixa: 'tag-prioridade-baixa'
    };
    const klass = map[normalized] || 'tag-prioridade-media';
    return `<span class="tag ${klass}">${priority}</span>`;
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
}

function buildRow(conflito) {
    const titulo = conflito?.titulo || conflito?.nome || 'Conflito sem título';
    const instituicao = conflito?.instituicao?.nome || conflito?.instituicao || '—';
    const envolvidos = conflito?.envolvidos?.length ? conflito.envolvidos.join(', ') : '—';
    const prioridade = conflito?.prioridade || conflito?.grauPrioridade || '—';
    const status = conflito?.status || conflito?.situacao || 'Em Análise';
    const data = conflito?.data || conflito?.dataRegistro || conflito?.dataOcorrido || '';
    const responsavel = conflito?.responsavel || '—';

    return `
        <tr>
            <td>${titulo}</td>
            <td>${instituicao}</td>
            <td class="envolvidos-cell">${envolvidos}</td>
            <td>${formatPriority(prioridade)}</td>
            <td>${formatStatus(status)}</td>
            <td>${formatDate(data)}</td>
            <td>${responsavel}</td>
            <td class="table-actions">
                <a href="#" title="Ver"><i class="fas fa-eye"></i></a>
                <a href="#" title="Editar"><i class="fas fa-pen"></i></a>
            </td>
        </tr>
    `;
}

async function renderConflitos() {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;

    setFeedback('Carregando conflitos...', 'info');
    tbody.innerHTML = '';

    try {
        const conflitos = await listarConflitos();
        if (!Array.isArray(conflitos) || conflitos.length === 0) {
            setFeedback('Nenhum conflito encontrado no momento.', 'info');
            return;
        }

        setFeedback('', 'info');
        tbody.innerHTML = conflitos.map(buildRow).join('');
    } catch (error) {
        console.error('Erro ao carregar conflitos:', error);
        setFeedback(error?.message || 'Não foi possível carregar os conflitos agora.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', renderConflitos);