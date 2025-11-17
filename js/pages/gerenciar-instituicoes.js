// Importa as funções da API
import { 
    listarInstituicoes, 
    cadastrarInstituicao,
    listarUsuariosPorInstituicao
} from '../services/apiService.js';

// Armazena todas as instituições para filtragem
let allInstitutions = [];
let container = null;

// ##################################################################
// ##                  INICIALIZAÇÃO DA PÁGINA                     ##
// ##################################################################

document.addEventListener('DOMContentLoaded', () => {
    container = document.getElementById('institutionsContainer');

    loadHeaderUserData();
    setupSidebarToggle();
    loadInstitutions();
    setupModalListeners(); // Modal de Cadastro
    setupViewUsersModalListeners(); // Modal de "Ver Usuários"
    setupInstitutionSearch(); // Configura a barra de busca
});


// ##################################################################
// ##                  FUNÇÕES BÁSICAS DE SETUP                    ##
// ##################################################################

function loadHeaderUserData() {
    const userName = localStorage.getItem('userName');
    const headerName = document.getElementById('headerUserName');
    if (headerName) {
        headerName.textContent = userName || 'Usuário';
    }
    // ... (resto do código do avatar)
}

function setupSidebarToggle() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    // ... (resto do código do toggle)
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    document.addEventListener('click', (event) => {
        if (sidebar && sidebar.classList.contains('open')) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnMenuToggle = menuToggle ? menuToggle.contains(event.target) : false;

            if (!isClickInsideSidebar && !isClickOnMenuToggle) {
                sidebar.classList.remove('open');
            }
        }
    });
}

function setFeedback(message, type = 'info') {
    const feedback = document.getElementById('institutionsFeedback');
    if (!feedback) return;

    const stateClass = type === 'error' ? 'is-error' : 'is-info';
    feedback.className = ['card', 'empty-card', stateClass].join(' ');
    feedback.textContent = message;
    feedback.dataset.state = type;
    feedback.style.display = message ? 'block' : 'none';
}

// ##################################################################
// ##               FUNCIONALIDADE DE BUSCA (NOVO)                 ##
// ##################################################################

function setupInstitutionSearch() {
    const searchInput = document.querySelector('.institution-search-bar input');
    const searchButton = document.querySelector('.institution-search-bar button');

    if (searchInput && searchButton) {
        const performSearch = () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            filterAndRenderInstitutions(searchTerm);
        };
        
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keyup', (event) => {
            // Busca em tempo real (a cada tecla)
            performSearch();
        });
    }
}

function filterAndRenderInstitutions(searchTerm) {
    let filteredInstitutions;

    if (!searchTerm) {
        filteredInstitutions = allInstitutions;
    } else {
        filteredInstitutions = allInstitutions.filter(inst => {
            const nome = (inst.nome || '').toLowerCase();
            const sigla = (inst.sigla || '').toLowerCase();
            // 'tipo' na busca se refere à área de atuação
            const area = (inst.areaAtuacao || '').toLowerCase(); 

            return nome.includes(searchTerm) ||
                   sigla.includes(searchTerm) ||
                   area.includes(searchTerm);
        });
    }
    
    renderInstitutions(filteredInstitutions);
}


// ##################################################################
// ##               CARREGAR E RENDERIZAR INSTITUIÇÕES             ##
// ##################################################################

async function loadInstitutions() {
    if (!container) return;

    setFeedback('Carregando instituições...', 'info');
    container.innerHTML = '';

    try {
        const institutions = await listarInstituicoes();
        if (!Array.isArray(institutions) || institutions.length === 0) {
            allInstitutions = [];
            setFeedback('Nenhuma instituição encontrada no momento.', 'info');
            return;
        }

        allInstitutions = institutions; // Armazena a lista completa
        renderInstitutions(allInstitutions); // Renderiza a lista
        
    } catch (error) {
        console.error('Erro ao carregar instituições:', error);
        allInstitutions = [];
        setFeedback(error?.message || 'Não foi possível carregar as instituições agora.', 'error');
    }
}

/**
 * Renderiza os cards de instituição no container (Função Separada)
 */
function renderInstitutions(institutionsToRender) {
    if (!container) return;
    
    container.innerHTML = ''; // Limpa o container

    if (!institutionsToRender || institutionsToRender.length === 0) {
        setFeedback('Nenhuma instituição encontrada para os termos da busca.', 'info');
        return;
    }
    
    setFeedback('', 'info'); // Limpa o feedback
    container.innerHTML = institutionsToRender.map(buildInstitutionCard).join('');
}


function formatLocation(instituicao) {
    const cidade = instituicao?.cidade || instituicao?.municipio;
    const estado = instituicao?.estado || instituicao?.uf;
    const partes = [cidade, estado].filter(Boolean);
    if (!partes.length && instituicao?.endereco) return instituicao.endereco;
    return partes.join(' - ') || 'Localização não informada';
}

function buildInstitutionCard(instituicao) {
    const tipo = instituicao?.tipo || instituicao?.categoria || 'Instituição';
    const sigla = instituicao?.sigla || instituicao?.nomeCurto || instituicao?.nome || 'Instituição';
    const nome = instituicao?.nome || instituicao?.razaoSocial || sigla;
    
    // !! NOTA: Estes dados (gestor, totalUsuarios, totalConflitos) não estão vindo da API.
    // O backend (ServicoInstituicao.java) precisa ser atualizado para enviá-los.
    const gestor = instituicao?.gestorResponsavel || '—';
    const totalUsuarios = instituicao?.totalUsuarios ?? '—';
    const totalConflitos = instituicao?.totalConflitos ?? '—';

    const tipoReal = instituicao.areaAtuacao || tipo;

    // Adicionamos o nome da instituição (sigla) ao botão para usar no título do modal
    return `
        <article class="institution-card card">
            <div class="inst-card-header">
                <div class="inst-card-id">
                    <div class="inst-card-icon"><i class="fas fa-landmark"></i></div>
                    <div class="inst-card-title">
                        <h3>${sigla}</h3>
                        <div class="inst-card-tags">
                            <span class="tag tag-neutral">${tipoReal}</span>
                        </div>
                    </div>
                </div>
                <button class="icon-button" title="Mais opções"><i class="fas fa-ellipsis-v"></i></button>
            </div>
            <p class="inst-card-fullname">${nome}</p>
            <p class="inst-card-location"><i class="fas fa-map-marker-alt"></i> ${formatLocation(instituicao)}</p>
            <div class="inst-card-stats">
                <div class="stat-item">
                    <span>${totalUsuarios}</span>
                    <p><i class="fas fa-users"></i> Usuários</p>
                </div>
                <div class="stat-item">
                    <span>${totalConflitos}</span>
                    <p><i class="fas fa-exclamation-triangle"></i> Conflitos</p>
                </div>
            </div>

            <div class="inst-card-footer">
                <div class="footer-info">
                    <small>Gestor Responsável</small>
                    <p>${gestor}</p>
                </div>
                <a href="#" class="btn btn-secondary btn-sm" data-institution-id="${instituicao.id}" data-institution-name="${sigla}">
                    <i class="fas fa-users"></i> Ver Usuários
                </a>
            </div>
            </article>
    `;
}


// ##################################################################
// ##               LÓGICA DO MODAL (CADASTRAR)                  ##
// ##################################################################

function setupModalListeners() {
    const modal = document.getElementById('add-institution-modal');
    const openButton = document.getElementById('addInstitutionButton');
    const closeButton = document.getElementById('modal-inst-close-button');
    const cancelButton = document.getElementById('modal-inst-cancel-button');
    const form = document.getElementById('add-institution-form');

    if (!modal || !openButton || !closeButton || !cancelButton || !form) {
        console.warn('Elementos do modal de cadastro não encontrados.');
        return;
    }

    openButton.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    const closeModal = () => {
        modal.style.display = 'none';
        form.reset();
    };

    closeButton.addEventListener('click', closeModal);
    cancelButton.addEventListener('click', closeModal);
    
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });

    form.addEventListener('submit', handleRegisterSubmit);
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    
    const submitButton = document.getElementById('modal-inst-submit-button');
    submitButton.disabled = true;
    submitButton.textContent = 'Salvando...';

    const instituicaoData = {
        nome: document.getElementById('inst-nome').value,
        sigla: document.getElementById('inst-sigla').value,
        cnpj: document.getElementById('inst-cnpj').value,
        email: document.getElementById('inst-email').value,
        telefone: document.getElementById('inst-telefone').value,
        areaAtuacao: document.getElementById('inst-area').value,
        descricao: document.getElementById('inst-descricao').value,
    };

    try {
        const novaInstituicao = await cadastrarInstituicao(instituicaoData);
        alert(`Instituição "${novaInstituicao.nome}" cadastrada com sucesso!`);
        document.getElementById('modal-inst-close-button').click();
        
        // Recarrega a lista e aplica o filtro atual (se houver)
        await loadInstitutions();
        const searchTerm = document.querySelector('.institution-search-bar input').value.toLowerCase().trim();
        filterAndRenderInstitutions(searchTerm);

    } catch (error) {
        console.error('Erro ao cadastrar instituição:', error);
        alert(`Erro: ${error.message || 'Não foi possível cadastrar a instituição.'}`);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar Instituição';
    }
}


// ##################################################################
// ##                LÓGICA DO MODAL (VER USUÁRIOS)                ##
// ##################################################################

/**
 * Configura os listeners para o modal "Ver Usuários".
 */
function setupViewUsersModalListeners() {
    const modal = document.getElementById('view-users-modal');
    const closeButton = document.getElementById('modal-view-users-close-button');
    const cancelButton = document.getElementById('modal-view-users-cancel-button');
    const container = document.getElementById('institutionsContainer');

    if (!modal || !closeButton || !cancelButton || !container) {
        console.warn('Elementos do modal "Ver Usuários" não encontrados.');
        return;
    }

    // Listener de clique no container principal para pegar cliques nos botões
    container.addEventListener('click', (event) => {
        const button = event.target.closest('a[data-institution-id]');
        if (button) {
            event.preventDefault(); // Impede a navegação do link '#'
            
            const institutionId = button.dataset.institutionId;
            const institutionName = button.dataset.institutionName;
            
            // Abre o modal e carrega os dados
            modal.style.display = 'block';
            loadAndShowUsers(institutionId, institutionName);
        }
    });

    // Listeners para fechar o modal
    const closeModal = () => {
        modal.style.display = 'none';
        // Limpa o conteúdo ao fechar
        const listContainer = document.getElementById('view-users-list-container');
        listContainer.innerHTML = '<p>Carregando usuários...</p>';
    };

    closeButton.addEventListener('click', closeModal);
    cancelButton.addEventListener('click', closeModal);

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });
}

/**
 * Busca e exibe os usuários de uma instituição no modal.
 */
async function loadAndShowUsers(institutionId, institutionName) {
    const listContainer = document.getElementById('view-users-list-container');
    const title = document.getElementById('view-users-title');

    title.textContent = `Usuários - ${institutionName}`;
    listContainer.innerHTML = '<p>Carregando usuários...</p>';

    try {
        // Busca todos os tipos de usuário da instituição
        const users = await listarUsuariosPorInstituicao(institutionId, 'all'); 
        
        if (!users || users.length === 0) {
            listContainer.innerHTML = '<p>Nenhum usuário encontrado para esta instituição.</p>';
            return;
        }

        // Renderiza a lista de usuários
        listContainer.innerHTML = createUsersListHTML(users);

    } catch (error) {
        console.error('Erro ao listar usuários da instituição:', error);
        listContainer.innerHTML = `<p style="color: red;">${error.message || 'Erro ao carregar usuários.'}</p>`;
    }
}

/**
 * Cria o HTML para a lista de usuários dentro do modal.
 */
function createUsersListHTML(users) {
    return users.map(user => {
        const initials = (user.nome || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
        
        // Formata o cargo
        const cargoText = (user.cargo || 'Cargo')
            .replace('GESTOR_', 'Gestor ')
            .replace('USUARIO_', 'Usuário ')
            .replace('INSTITUICAO', 'Instituição');

        return `
            <div class="user-item-card">
                <div class="user-item-avatar">${initials}</div>
                <div class="user-item-info">
                    <p>${user.nome}</p>
                    <small>${user.email}</small>
                </div>
                <span class="user-item-tag ${user.status === 'ATIVO' ? 'status-ativo' : ''}">${cargoText}</span>
            </div>
        `;
    }).join('');
}