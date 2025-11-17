import { 
    listarDenuncias, 
    cadastrarConflito, 
    atualizarDenuncia 
} from '../../services/apiService.js';

const feedbackId = 'denunciasFeedback';
const tableBodyId = 'denunciasTableBody';
let allDenuncias = []; // Armazena a lista completa

document.addEventListener('DOMContentLoaded', () => {
    loadDenuncias();
    setupFilters();
    setupDetailsModal();
});

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
    const normalized = status.toString().toUpperCase();
    const map = {
        PENDENTE: 'tag-status-pendente',
        APROVADA: 'tag-status-aprovada',
        REJEITADA: 'tag-status-rejeitada'
    };
    const klass = map[normalized] || 'tag-status-pendente';
    return `<span class="tag ${klass}">${status.replace('_', ' ')}</span>`;
}

function formatTipo(tipo) {
    if (!tipo) return '<span class="tag tag-tipo-desmatamento">—</span>';
    const text = tipo.replace(/_/g, ' ').toLowerCase();
    const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
    // Classe CSS baseada no enum (ex: tag-tipo-terra-indigena)
    const klass = `tag-tipo-${tipo.toLowerCase().replace(/_/g, '-')}`;
    return `<span class="tag ${klass}">${capitalized}</span>`;
}

function buildRow(denuncia) {
    const codigo = denuncia?.id || '—';
    const titulo = denuncia?.tituloDenuncia || 'Sem título';
    const denunciante = denuncia?.nomeDenunciante || 'Anônimo';
    
    const local = denuncia?.cidade || denuncia?.estado ?
        [denuncia?.cidade, denuncia?.estado].filter(Boolean).join(' - ') :
        'Não informada';
        
    const tipo = denuncia?.tipoDenuncia || '—';
    const data = denuncia?.dataOcorrido || denuncia?.dataCriacao || '';
    const status = denuncia?.status || 'PENDENTE';

    return `
        <tr>
            <td>${codigo}</td>
            <td>${titulo}</td>
            <td>${denunciante}</td>
            <td>${local}</td>
            <td>${formatTipo(tipo)}</td>
            <td>${formatDate(data)}</td>
            <td>${formatStatus(status)}</td>
            <td>
                <a href="#" class="btn btn-secondary btn-sm" data-action="details" data-id="${denuncia.id}">
                    Ver Detalhes
                </a>
            </td>
        </tr>
    `;
}

async function loadDenuncias() {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;

    setFeedback('Carregando denúncias...', 'info');
    tbody.innerHTML = '';

    try {
        const denuncias = await listarDenuncias();
        if (!Array.isArray(denuncias) || denuncias.length === 0) {
            allDenuncias = [];
            setFeedback('Nenhuma denúncia encontrada no momento.', 'info');
        } else {
            allDenuncias = denuncias;
            setFeedback('', 'info'); // Limpa o feedback
            // renderDenunciasTable(allDenuncias); // <--- ALTERAÇÃO: Removido
            applyFilters(); // <--- ALTERAÇÃO: Aplica filtros no carregamento inicial
        }
        updateStatsCards(allDenuncias); // Atualiza os stats
    } catch (error) {
        console.error('Erro ao carregar denúncias:', error);
        allDenuncias = [];
        updateStatsCards([]);
        setFeedback(error?.message || 'Não foi possível carregar as denúncias agora.', 'error');
    }
}

function renderDenunciasTable(denuncias) {
    const tbody = document.getElementById(tableBodyId);
    tbody.innerHTML = '';
    
    if (denuncias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Nenhuma denúncia encontrada para os filtros.</td></tr>';
        return;
    }
    
    tbody.innerHTML = denuncias.map(buildRow).join('');
}

function updateStatsCards(denuncias) {
    const total = denuncias.length;
    const pendentes = denuncias.filter(d => (d.status || 'PENDENTE') === 'PENDENTE').length;
    const aprovadas = denuncias.filter(d => d.status === 'APROVADA').length;
    const rejeitadas = denuncias.filter(d => d.status === 'REJEITADA').length;

    document.getElementById('stat-total-denuncias').textContent = total;
    document.getElementById('stat-pendentes').textContent = pendentes;
    document.getElementById('stat-aprovadas').textContent = aprovadas;
    document.getElementById('stat-rejeitadas').textContent = rejeitadas;
}

// ##################################################################
// ##                      LÓGICA DE FILTROS                       ##
// ##################################################################

// <--- ALTERAÇÃO: 'applyFilters' movida para fora de 'setupFilters'
function applyFilters() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const tipoFilter = document.getElementById('tipo-filter');

    const searchTerm = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    const tipo = tipoFilter.value;

    const filteredDenuncias = allDenuncias.filter(denuncia => {
        const statusMatch = !status || (denuncia.status || 'PENDENTE') === status;
        const tipoMatch = !tipo || denuncia.tipoDenuncia === tipo;

        const searchMatch = !searchTerm ||
            (denuncia.id?.toString().includes(searchTerm)) ||
            (denuncia.tituloDenuncia?.toLowerCase().includes(searchTerm)) ||
            (denuncia.cidade?.toLowerCase().includes(searchTerm)) ||
            (denuncia.estado?.toLowerCase().includes(searchTerm));

        return statusMatch && tipoMatch && searchMatch;
    });

    renderDenunciasTable(filteredDenuncias);
}

function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const tipoFilter = document.getElementById('tipo-filter');

    searchInput.addEventListener('keyup', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    tipoFilter.addEventListener('change', applyFilters);
}

// ##################################################################
// ##                 LÓGICA DO MODAL DE DETALHES                  ##
// ##################################################################

function setupDetailsModal() {
    const tbody = document.getElementById(tableBodyId);
    const modal = document.getElementById('modal-denuncia-details');
    
    tbody.addEventListener('click', (event) => {
        const button = event.target.closest('a[data-action="details"]');
        if (button) {
            event.preventDefault();
            const denunciaId = button.dataset.id;
            handleViewDetails(denunciaId);
        }
    });

    modal.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => modal.classList.remove('show'));
    });
}

function handleViewDetails(denunciaId) {
    const modal = document.getElementById('modal-denuncia-details');
    const modalBody = document.getElementById('detail-modal-body');
    const convertButton = document.getElementById('btn-converter-conflito');
    
    const denuncia = allDenuncias.find(d => d.id.toString() === denunciaId);
    
    if (!denuncia) {
        modalBody.innerHTML = '<p style="color: red;">Erro: Denúncia não encontrada.</p>';
        modal.classList.add('show');
        return;
    }

    const statusTag = formatStatus(denuncia.status || 'PENDENTE');
    const tipoTag = formatTipo(denuncia.tipoDenuncia);

    modalBody.innerHTML = `
        <div class="details-grid">
            <div class="detail-item">
                <strong>Denunciante</strong>
                <span>${denuncia.nomeDenunciante || 'Anônimo'}</span>
            </div>
            <div class="detail-item">
                <strong>Status</strong>
                <span>${statusTag}</span>
            </div>
            <div class="detail-item">
                <strong>Email</strong>
                <span>${denuncia.emailDenunciante || 'Não informado'}</span>
            </div>
            <div class="detail-item">
                <strong>Telefone</strong>
                <span>${denuncia.telefoneDenunciante || 'Não informado'}</span>
            </div>
            <div class="detail-item">
                <strong>CPF</strong>
                <span>${denuncia.cpfDenunciante || 'Não informado'}</span>
            </div>
            <div class="detail-item">
                <strong>Data da Ocorrência</strong>
                <span>${formatDate(denuncia.dataOcorrido)}</span>
            </div>
            
            <div class="detail-item full-width">
                <strong>Tipo de Conflito</strong>
                <span>${tipoTag}</span>
            </div>
            <div class="detail-item full-width">
                <strong>Título</strong>
                <span>${denuncia.tituloDenuncia || 'Sem título'}</span>
            </div>
            <div class="detail-item full-width">
                <strong>Descrição</strong>
                <p>${denuncia.descricaoDenuncia || 'Sem descrição.'}</p>
            </div>
            <div class="detail-item full-width">
                <strong>Partes Envolvidas</strong>
                <p>${denuncia.descricaoPartesEnvolvidas || 'Não informado.'}</p>
            </div>
        </div>
    `;

    const newConvertButton = convertButton.cloneNode(true);
    convertButton.parentNode.replaceChild(newConvertButton, convertButton);

    if ((denuncia.status || 'PENDENTE') === 'PENDENTE') {
        newConvertButton.style.display = 'inline-block';
        newConvertButton.addEventListener('click', () => {
            handleConvertToConflito(denuncia, newConvertButton);
        });
    } else {
        newConvertButton.style.display = 'none';
    }
    
    modal.classList.add('show');
}

/**
 * Manipula a conversão de Denúncia para Conflito
 */
async function handleConvertToConflito(denuncia, button) {
    if (!confirm(`Tem certeza que deseja converter a denúncia #${denuncia.id} em um novo conflito? A denúncia será marcada como "Aprovada".`)) {
        return;
    }

    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Convertendo...';

    try {
        // 1. Mapeia os dados da Denúncia para um ConflitoDTO
        const conflitoData = {
            tituloConflito: denuncia.tituloDenuncia,
            tipoConflito: denuncia.tipoDenuncia,
            dataInicio: denuncia.dataOcorrido,
            descricaoConflito: `CONFLITO GERADO A PARTIR DA DENÚNCIA CÓDIGO #${denuncia.id}:\n\n${denuncia.descricaoDenuncia}`,
            parteReclamante: denuncia.nomeDenunciante,
            parteReclamada: denuncia.descricaoPartesEnvolvidas,
            status: 'ATIVO',
            prioridade: 'MEDIA',
            fonteDenuncia: 'FORMULARIO_PUBLICO'
        };

        // 2. Chama a API para cadastrar o conflito
        await cadastrarConflito(conflitoData);

        // 3. Se teve sucesso, atualiza o status da denúncia para "APROVADA"
        await atualizarDenuncia(denuncia.id, { status: 'APROVADA' });

        alert('Denúncia convertida em conflito com sucesso! O status da denúncia foi atualizado para "Aprovada".');
        
        // --- INÍCIO DA ALTERAÇÃO ---
        // 4. Atualiza a denúncia na lista local
        const denunciaIndex = allDenuncias.findIndex(d => d.id === denuncia.id);
        if (denunciaIndex > -1) {
            allDenuncias[denunciaIndex].status = 'APROVADA';
        }
        
        // 5. Atualiza os cards de estatísticas
        updateStatsCards(allDenuncias);
        
        // 6. Re-aplica os filtros (que removerá a denúncia da vista "Pendente")
        applyFilters();
        // --- FIM DA ALTERAÇÃO ---

        document.getElementById('modal-denuncia-details').classList.remove('show');
        // loadDenuncias(); // <--- ALTERAÇÃO: Removido para evitar recarregamento total

    } catch (error) {
        console.error("Erro ao converter denúncia:", error);
        alert(error.message || 'Não foi possível converter a denúncia.');
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-file-export"></i> Converter em Conflito';
    }
}