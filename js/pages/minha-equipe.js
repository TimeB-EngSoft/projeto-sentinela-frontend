import { 
    listUsersByStatus, 
    getUserData, 
    updateUser,
    cadastrarParcial,
    approveOrRejectUser 
} from '../services/apiService.js';

// Armazena todos os membros da equipe para filtragem
let allTeamMembers = [];
let gridContainer = null;

// ##################################################################
// ##                  INICIALIZAÇÃO DA PÁGINA                     ##
// ##################################################################

document.addEventListener('DOMContentLoaded', () => {
    gridContainer = document.getElementById('team-grid-container');

    loadHeaderUserData();
    setupSidebarToggle();
    loadTeamMembers();
    
    // Configura os modais
    setupAddMemberModal();
    setupUserDetailsModal();
    
    // Configura a barra de busca
    setupTeamSearch();
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

    // const avatar = document.getElementById('headerUserAvatar');
    // if (avatar) {
    //     if (userName) {
    //         avatar.classList.remove('avatar-placeholder');
    //         avatar.innerHTML = `<span>${userName.charAt(0).toUpperCase()}</span>`;
    //     } else {
    //         avatar.classList.add('avatar-placeholder');
    //         avatar.innerHTML = '<i class="fas fa-user"></i>';
    //     }
    // }
}

function setupSidebarToggle() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');

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

// ##################################################################
// ##               FUNCIONALIDADE DE BUSCA (NOVO)                 ##
// ##################################################################

function setupTeamSearch() {
    const searchInput = document.querySelector('.team-overview .search-bar input');
    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            filterAndRenderTeam(searchTerm);
        });
    }
}

function filterAndRenderTeam(searchTerm) {
    let filteredMembers;

    if (!searchTerm) {
        filteredMembers = allTeamMembers;
    } else {
        filteredMembers = allTeamMembers.filter(user => {
            const nome = user.nome.toLowerCase();
            const email = (user.email || '').toLowerCase();
            const cargo = user.cargo.toLowerCase().replace('_', ' ');

            return nome.includes(searchTerm) ||
                   email.includes(searchTerm) ||
                   cargo.includes(searchTerm);
        });
    }
    
    renderTeamCards(filteredMembers);
}

// ##################################################################
// ##                  CARREGAR MEMBROS DA EQUIPE                  ##
// ##################################################################

async function loadTeamMembers() {
    if (!gridContainer) {
        console.error('Container #team-grid-container não encontrado.');
        return;
    }

    gridContainer.innerHTML = '<p>Carregando membros da equipe...</p>';
    
    let activeUsers = [];
    let inactiveUsers = [];

    try {
        activeUsers = await fetchUsersSafely('ATIVO');
        inactiveUsers = await fetchUsersSafely('INATIVO');
    } catch (error) {
        // Erro fatal se a função fetchUsersSafely falhar
        console.error('Erro ao buscar usuários:', error);
        gridContainer.innerHTML = `<p style="color: red;">${error.message || 'Erro ao carregar membros.'}</p>`;
        return;
    }

    const allUsers = [...activeUsers, ...inactiveUsers];

    // 2. Filtra apenas os usuários da secretaria e armazena
    allTeamMembers = allUsers.filter(user => {
        return user.cargo === 'GESTOR_SECRETARIA' || 
               user.cargo === 'USUARIO_SECRETARIA';
    });

    // 3. Renderiza os cards pela primeira vez
    renderTeamCards(allTeamMembers);

    // 5. Atualiza os cards de estatísticas
    const totalAtivos = allTeamMembers.filter(u => u.status === 'ATIVO').length;
    updateStatsCards(allTeamMembers.length, totalAtivos);
}

/**
 * Função auxiliar para buscar usuários por status, tratando o erro "Não há usuários" como lista vazia.
 */
async function fetchUsersSafely(status) {
    try {
        return await listUsersByStatus(status);
    } catch (error) {
        if (error.message && error.message.includes("Não há usuários com este status")) {
            return []; // Retorna lista vazia em vez de lançar erro
        }
        throw error; // Lança outros erros
    }
}


/**
 * Renderiza os cards de equipe no container (Função Separada)
 */
function renderTeamCards(membersToRender) {
    if (!gridContainer) return;

    gridContainer.innerHTML = ''; // Limpa o container

    if (!membersToRender || membersToRender.length === 0) {
        gridContainer.innerHTML = '<p>Nenhum membro da equipe encontrado.</p>';
        return;
    }

    membersToRender.forEach(member => {
        const cardHTML = createTeamCard(member);
        gridContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
    
    // Adiciona os listeners aos novos cards
    addEventListenersToCards();
}

/**
 * Cria o HTML para um único card de membro da equipe.
 */
function createTeamCard(user) {
    const initials = (user.nome || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const style = getRoleStyle(user.cargo);
    
    const cargoText = user.cargo.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    
    // Adiciona um indicador visual para usuários inativos
    const inactiveClass = user.status === 'INATIVO' ? 'team-card--inactive' : '';

    return `
    <div class="team-card ${inactiveClass}">
        ${user.status === 'INATIVO' ? '<span class="team-card__badge">Inativo</span>' : ''}
        <div class="team-card__avatar" style="background-color: ${style.bgColor}; color: ${style.color};">${initials}</div>
        <div class="team-card__info">
            <h4>${user.nome}</h4>
            <p>${cargoText}</p>
        </div>
        <div class="team-card__contact">
            <span><i class="fas fa-envelope"></i> ${user.email || 'Email não informado'}</span>
            <span><i class="fas fa-phone"></i> ${user.telefone || 'Telefone não informado'}</span>
        </div>
        <div class="team-card__stats">
            <div class="stat">
                <strong>—</strong>
                <small>Resolvidos</small>
            </div>
            <div class="stat">
                <strong>—</strong>
                <small>Pendentes</small>
            </div>
        </div>
        <div class="team-card__footer">
            <button class="btn btn-secondary" data-user-id="${user.id}"><i class="fas fa-eye"></i> Ver Detalhes</button>
        </div>
    </div>
    `;
}

/**
 * Helper para definir a cor do avatar com base no cargo.
 */
function getRoleStyle(cargo) {
    if (cargo === 'GESTOR_SECRETARIA') {
        return { bgColor: '#fceeee', color: '#d9534f' }; // Estilo Gestor (Vermelho)
    }
    return { bgColor: '#fef8e5', color: '#f0ad4e' }; // Estilo Usuário (Amarelo)
}

/**
 * Atualiza os cards de estatísticas no topo da página.
 */
function updateStatsCards(totalMembers, activeMembers) {
    const totalCard = document.querySelector('.stats-grid .stat-card:nth-child(1) span');
    const activeCard = document.querySelector('.stats-grid .stat-card:nth-child(2) span');

    if (totalCard) {
        totalCard.textContent = totalMembers;
    }
    if (activeCard) {
        activeCard.textContent = activeMembers;
    }
}

// ##################################################################
// ##              LÓGICA DO MODAL "ADICIONAR MEMBRO"              ##
// ##################################################################

function setupAddMemberModal() {
    const modal = document.getElementById('modal-add-member');
    const openButton = document.getElementById('addMemberButton');
    const form = document.getElementById('form-add-member');
    
    openButton.addEventListener('click', () => modal.classList.add('show'));
    
    // Fechar modal
    modal.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => modal.classList.remove('show'));
    });
    
    // Envio do formulário
    form.addEventListener('submit', handleAddMemberSubmit);
}

/**
 * Lida com o envio do formulário de novo membro.
 * ETAPA 1: Cadastra o usuário (status PENDENTE).
 * ETAPA 2: Busca o ID desse usuário na lista de PENDENTES.
 * ETAPA 3: Aprova o usuário (o que envia o e-mail).
 */
async function handleAddMemberSubmit(event) {
    event.preventDefault();
    const submitButton = document.getElementById('add-member-submit-button');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    const nome = document.getElementById('add-nome').value;
    const email = document.getElementById('add-email').value;
    const cargo = document.getElementById('add-cargo').value;

    try {
        // ETAPA 1: Cadastrar o usuário (ele ficará PENDENTE)
        await cadastrarParcial({
            nome,
            email,
            cargo,
            instituicao: 'Secretaria', // Instituição da própria equipe
            justificativa: 'Membro da equipe adicionado pelo gestor.'
        });

        // ETAPA 2: Buscar o ID do usuário recém-criado
        const pendingUsers = await fetchUsersSafely('PENDENTE');
        const newUser = pendingUsers.find(u => u.email === email);

        if (!newUser) {
            throw new Error('Não foi possível encontrar o usuário recém-criado para aprovação.');
        }

        // ETAPA 3: Aprovar o usuário (isso dispara o e-mail de cadastro)
        await approveOrRejectUser(newUser.id, true);

        alert('Membro adicionado com sucesso! Um e-mail de cadastro foi enviado para ' + email);
        document.getElementById('form-add-member').reset();
        document.getElementById('modal-add-member').classList.remove('show');
        
        // Recarrega a lista e aplica o filtro atual (se houver)
        await loadTeamMembers(); 
        const searchTerm = document.querySelector('.team-overview .search-bar input').value.toLowerCase().trim();
        filterAndRenderTeam(searchTerm);


    } catch (error) {
        console.error('Erro ao adicionar membro:', error);
        alert(error.message || 'Erro ao adicionar membro. Verifique se o e-mail já está em uso.');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Convite';
    }
}

// ##################################################################
// ##            LÓGICA DO MODAL "DETALHES DO USUÁRIO"             ##
// ##################################################################

/**
 * Adiciona listeners aos botões "Ver Detalhes" dos cards.
 */
function addEventListenersToCards() {
    const detailButtons = document.querySelectorAll('.team-card .btn[data-user-id]');
    detailButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = e.currentTarget.dataset.userId;
            handleViewDetails(userId);
        });
    });
}

/**
 * Configura o fechamento básico do modal de detalhes.
 */
function setupUserDetailsModal() {
    const modal = document.getElementById('modal-user-details');
    modal.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => modal.classList.remove('show'));
    });
}

/**
 * Busca dados do usuário e exibe o modal de detalhes.
 */
async function handleViewDetails(userId) {
    const modal = document.getElementById('modal-user-details');
    const modalBody = document.getElementById('detail-modal-body');
    const modalTitle = document.getElementById('detail-modal-title');
    const actionButton = document.getElementById('detail-action-button');

    modal.classList.add('show');
    modalTitle.textContent = 'Detalhes do Usuário';
    modalBody.innerHTML = '<p>Carregando...</p>';
    actionButton.style.display = 'none'; // Esconde o botão até ter os dados

    try {
        const user = await getUserData(userId);
        
        const cargoText = user.cargo.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        const statusText = user.status === 'ATIVO' ? 'Ativo' : 'Inativo';
        const statusClass = user.status === 'ATIVO' ? 'status-ativo' : 'status-inativo';

        modalTitle.textContent = user.nome;
        modalBody.innerHTML = `
            <ul class="user-details-list">
                <li><strong>Nome:</strong> <span>${user.nome}</span></li>
                <li><strong>Email:</strong> <span>${user.email}</span></li>
                <li><strong>Cargo:</strong> <span>${cargoText}</span></li>
                <li><strong>Telefone:</strong> <span>${user.telefone || 'Não informado'}</span></li>
                <li><strong>CPF:</strong> <span>${user.cpf || 'Não informado'}</span></li>
                <li><strong>Status:</strong> <span><div class="status-badge ${statusClass}">${statusText}</div></span></li>
            </ul>
        `;

        // Configura o botão de Ação (Ativar/Bloquear)
        actionButton.dataset.userId = user.id;
        if (user.status === 'ATIVO') {
            actionButton.textContent = 'Bloquear Usuário';
            actionButton.className = 'btn btn-danger'; // Vermelho para bloquear
            actionButton.dataset.action = 'INATIVO';
        } else {
            actionButton.textContent = 'Ativar Usuário';
            actionButton.className = 'btn btn-success'; // Verde para ativar
            actionButton.dataset.action = 'ATIVO';
        }
        
        actionButton.style.display = 'block';
        
        // Remove listener antigo e adiciona novo para evitar duplicatas
        actionButton.replaceWith(actionButton.cloneNode(true));
        document.getElementById('detail-action-button').addEventListener('click', handleUpdateUserStatus);

    } catch (error) {
        console.error('Erro ao buscar detalhes do usuário:', error);
        modalBody.innerHTML = `<p style="color: red;">${error.message || 'Erro ao carregar dados.'}</p>`;
    }
}

/**
 * Lida com o clique do botão "Bloquear" ou "Ativar" no modal de detalhes.
 */
async function handleUpdateUserStatus(event) {
    const button = event.currentTarget;
    const userId = button.dataset.userId;
    const newStatus = button.dataset.action;
    
    const actionText = newStatus === 'ATIVO' ? 'ativar' : 'bloquear';
    
    if (!confirm(`Tem certeza de que deseja ${actionText} este usuário?`)) {
        return;
    }

    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

    try {
        // Usamos o 'updateUser' pois o 'approve' é apenas para PENDENTE
        await updateUser(userId, { status: newStatus }); 
        
        alert(`Usuário ${actionText} com sucesso!`);
        document.getElementById('modal-user-details').classList.remove('show');
        
        // Recarrega a lista e aplica o filtro atual (se houver)
        await loadTeamMembers(); 
        const searchTerm = document.querySelector('.team-overview .search-bar input').value.toLowerCase().trim();
        filterAndRenderTeam(searchTerm);
        
    } catch (error) {
        console.error(`Erro ao ${actionText} usuário:`, error);
        alert(error.message || `Não foi possível ${actionText} o usuário.`);
    } finally {
        button.disabled = false;
        // O texto do botão será redefinido na próxima vez que o modal abrir
    }
}