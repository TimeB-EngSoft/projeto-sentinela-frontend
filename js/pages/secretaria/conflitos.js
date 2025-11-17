import { 
    listarConflitos, 
    buscarConflitoPorId, 
    cadastrarConflito 
} from '../../services/apiService.js';

const feedbackId = 'conflitosFeedback';
const tableBodyId = 'conflitosTableBody';
let allConflitos = []; // Armazena a lista completa

document.addEventListener('DOMContentLoaded', () => {
    loadConflitos();
    setupFilters();
    setupDetailsModal();
    setupAddConflitoModal();
});

function setFeedback(message, type = 'info') {
    const feedback = document.getElementById(feedbackId);
    if (!feedback) return;
    const stateClass = type === 'error' ? 'is-error' : 'is-info';
    feedback.className = `card empty-card ${stateClass}`;
    feedback.textContent = message;
    feedback.style.display = message ? 'block' : 'none';
}

function formatStatus(status) {
    if (!status) return '<span class="status-tag status-pendente"><i class="fas fa-hourglass-half"></i> PENDENTE</span>';
    const normalized = status.toString().toUpperCase();
    const map = {
        PENDENTE: { class: 'status-pendente', icon: 'fa-hourglass-half' },
        EM_ANALISE: { class: 'status-analise', icon: 'fa-search' },
        RESOLVIDO: { class: 'status-resolvido', icon: 'fa-check-circle' }
    };
    const s = map[normalized] || map.EM_ANALISE;
    const text = status.replace('_', ' ');
    return `<span class="status-tag ${s.class}"><i class="fas ${s.icon}"></i> ${text}</span>`;
}

function formatPriority(priority) {
    if (!priority) return '<span class="tag tag-prioridade-media">—</span>';
    const normalized = priority.toString().toUpperCase();
    const map = {
        ALTA: 'tag-prioridade-alta',
        MEDIA: 'tag-prioridade-media',
        BAIXA: 'tag-prioridade-baixa'
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
    const titulo = conflito?.tituloConflito || 'Conflito sem título';
    const envolvidos = [conflito?.parteReclamante, conflito?.parteReclamada].filter(Boolean).join(' vs ') || '—';
    const prioridade = conflito?.prioridade || 'MEDIA';
    const status = conflito?.status || 'PENDENTE';
    const data = conflito?.dataInicio || conflito?.dataCriacao || '';
    const responsavel = conflito?.usuarioResponsavel?.nome || '—'; // Assumindo aninhamento

    return `
        <tr>
            <td>${titulo}</td>
            <td class="envolvidos-cell">${envolvidos}</td>
            <td>${formatPriority(prioridade)}</td>
            <td>${formatStatus(status)}</td>
            <td>${formatDate(data)}</td>
            <td>${responsavel}</td>
            <td class="table-actions">
                <a href="#" title="Ver Detalhes" data-action="details" data-id="${conflito.id}"><i class="fas fa-eye"></i></a>
                <a href="#" title="Editar"><i class="fas fa-pen"></i></a>
            </td>
        </tr>
    `;
}

async function loadConflitos() {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;

    setFeedback('Carregando conflitos...', 'info');
    tbody.innerHTML = '';

    try {
        const conflitos = await listarConflitos();
        if (!Array.isArray(conflitos) || conflitos.length === 0) {
            allConflitos = [];
            setFeedback('Nenhum conflito encontrado no momento.', 'info');
        } else {
            allConflitos = conflitos;
            setFeedback('', 'info');
            renderConflitosTable(allConflitos);
        }
        updateStatsCards(allConflitos);
    } catch (error) {
        console.error('Erro ao carregar conflitos:', error);
        allConflitos = [];
        updateStatsCards([]);
        setFeedback(error?.message || 'Não foi possível carregar os conflitos agora.', 'error');
    }
}

function renderConflitosTable(conflitos) {
    const tbody = document.getElementById(tableBodyId);
    tbody.innerHTML = '';
    
    if (conflitos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum conflito encontrado para os filtros.</td></tr>';
        return;
    }
    
    tbody.innerHTML = conflitos.map(buildRow).join('');
}

function updateStatsCards(conflitos) {
    const total = conflitos.length;
    const pendentes = conflitos.filter(c => (c.status || 'PENDENTE') === 'PENDENTE').length;
    const analise = conflitos.filter(c => c.status === 'EM_ANALISE').length;
    const resolvidos = conflitos.filter(c => c.status === 'RESOLVIDO').length;

    document.getElementById('stat-total-conflitos').textContent = total;
    document.getElementById('stat-pendentes').textContent = pendentes;
    document.getElementById('stat-analise').textContent = analise;
    document.getElementById('stat-resolvidos').textContent = resolvidos;
}

// ##################################################################
// ##                      LÓGICA DE FILTROS                       ##
// ##################################################################

function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const prioridadeFilter = document.getElementById('prioridade-filter');

    const applyFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const status = statusFilter.value;
        const prioridade = prioridadeFilter.value;

        const filteredConflitos = allConflitos.filter(conflito => {
            const statusMatch = !status || (conflito.status || 'PENDENTE') === status;
            const prioridadeMatch = !prioridade || (conflito.prioridade || 'MEDIA') === prioridade;

            const searchMatch = !searchTerm ||
                (conflito.tituloConflito?.toLowerCase().includes(searchTerm)) ||
                (conflito.parteReclamante?.toLowerCase().includes(searchTerm)) ||
                (conflito.parteReclamada?.toLowerCase().includes(searchTerm));

            return statusMatch && prioridadeMatch && searchMatch;
        });

        renderConflitosTable(filteredConflitos);
    };

    searchInput.addEventListener('keyup', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    prioridadeFilter.addEventListener('change', applyFilters);
}

// ##################################################################
// ##                 LÓGICA DO MODAL DE DETALHES                  ##
// ##################################################################

function setupDetailsModal() {
    const tbody = document.getElementById(tableBodyId);
    const modal = document.getElementById('modal-conflito-details');
    
    tbody.addEventListener('click', (event) => {
        const button = event.target.closest('a[data-action="details"]');
        if (button) {
            event.preventDefault();
            const conflitoId = button.dataset.id;
            handleViewDetails(conflitoId);
        }
    });

    modal.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => modal.classList.remove('show'));
    });
}

async function handleViewDetails(conflitoId) {
    const modal = document.getElementById('modal-conflito-details');
    const modalBody = document.getElementById('detail-modal-body');
    modal.classList.add('show');
    modalBody.innerHTML = '<p>Carregando...</p>';

    try {
        const conflito = await buscarConflitoPorId(conflitoId);
        
        const statusTag = formatStatus(conflito.status);
        const prioridadeTag = formatPriority(conflito.prioridade);

        modalBody.innerHTML = `
            <div class="details-grid">
                <div class="detail-item full-width">
                    <strong>Título</strong>
                    <span>${conflito.tituloConflito || 'Não informado'}</span>
                </div>
                <div class="detail-item">
                    <strong>Status</strong>
                    <span>${statusTag}</span>
                </div>
                <div class="detail-item">
                    <strong>Prioridade</strong>
                    <span>${prioridadeTag}</span>
                </div>
                <div class="detail-item">
                    <strong>Tipo de Conflito</strong>
                    <span>${conflito.tipoConflito || 'Não informado'}</span>
                </div>
                <div class="detail-item">
                    <strong>Data de Início</strong>
                    <span>${formatDate(conflito.dataInicio)}</span>
                </div>
                <div class="detail-item">
                    <strong>Parte Reclamante</strong>
                    <span>${conflito.parteReclamante || 'Não informado'}</span>
                </div>
                <div class="detail-item">
                    <strong>Parte Reclamada</strong>
                    <span>${conflito.parteReclamada || 'Não informado'}</span>
                </div>
                <div class="detail-item full-width">
                    <strong>Grupos Vulneráveis</strong>
                    <span>${conflito.gruposVulneraveis || 'Nenhum'}</span>
                </div>
                <div class="detail-item full-width">
                    <strong>Descrição</strong>
                    <p>${conflito.descricaoConflito || 'Sem descrição.'}</p>
                </div>
                <div class="detail-item">
                    <strong>Fonte da Denúncia</strong>
                    <span>${conflito.fonteDenuncia || 'Não informada'}</span>
                </div>
                <div class="detail-item">
                    <strong>Responsável</strong>
                    <span>${conflito.usuarioResponsavel?.nome || 'Ninguém atribuído'}</span>
                </div>
            </div>
        `;
    } catch (error) {
        modalBody.innerHTML = `<p style="color: red;">${error.message || 'Erro ao carregar detalhes.'}</p>`;
    }
}

// ##################################################################
// ##               LÓGICA DO MODAL (ADD CONFLITO)                 ##
// ##################################################################

function setupAddConflitoModal() {
    const modal = document.getElementById('modal-add-conflito');
    const openButton = document.getElementById('addConflitoButton');
    const form = document.getElementById('form-add-conflito');
    
    openButton.addEventListener('click', (e) => {
        e.preventDefault();
        form.reset(); // Limpa o formulário
        modal.classList.add('show');
    });

    modal.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => modal.classList.remove('show'));
    });

    form.addEventListener('submit', handleAddConflitoSubmit);
}

async function handleAddConflitoSubmit(event) {
    event.preventDefault();
    const submitButton = document.getElementById('add-conflito-submit-button');
    submitButton.disabled = true;
    submitButton.textContent = 'Salvando...';

    try {
        const dataInicio = document.getElementById('conflito-data-inicio').value;
        
        const conflitoData = {
            tituloConflito: document.getElementById('conflito-titulo').value,
            tipoConflito: document.getElementById('conflito-tipo').value,
            dataInicio: dataInicio ? `${dataInicio}T00:00:00` : null, // Formato LocalDateTime
            status: document.getElementById('conflito-status').value,
            prioridade: document.getElementById('conflito-prioridade').value,
            descricaoConflito: document.getElementById('conflito-descricao').value,
            parteReclamante: document.getElementById('conflito-reclamante').value,
            parteReclamada: document.getElementById('conflito-reclamada').value,
            gruposVulneraveis: document.getElementById('conflito-grupos').value,
            fonteDenuncia: 'INTERNA' // Definido como interna, já que foi cadastro direto
        };

        await cadastrarConflito(conflitoData);
        
        alert('Conflito registrado com sucesso!');
        document.getElementById('modal-add-conflito').classList.remove('show');
        loadConflitos(); // Recarrega a lista

    } catch (error) {
        console.error('Erro ao registrar conflito:', error);
        alert(error.message || 'Erro ao salvar o conflito.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar Conflito';
    }
}