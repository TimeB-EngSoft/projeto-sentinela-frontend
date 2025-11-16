// Importa as funções de apiService.js
import { 
    listUsersByStatus, 
    approveOrRejectUser,
    cadastrarParcial 
} from '../services/apiService.js';

// Variável para armazenar os usuários ativos para filtragem
let allActiveUsers = [];

document.addEventListener('DOMContentLoaded', function() {
    
    // --- Funções Reutilizadas (Setup) ---

    function loadHeaderUserData() {
        const userName = localStorage.getItem('userName');
        if (userName) {
            document.getElementById('headerUserName').textContent = userName;
        } else {
            document.getElementById('headerUserName').textContent = 'Usuário';
        }
    }

    function setupMobileMenu() {
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
                const isClickOnMenuToggle = menuToggle && menuToggle.contains(event.target);

                if (!isClickInsideSidebar && !isClickOnMenuToggle) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }

    // Chama as funções de setup
    loadHeaderUserData();
    setupMobileMenu();

    // --- Lógica da Página de Usuários ---

    // Carrega dados pendentes e ativos
    loadPendingUsers();
    loadActiveUsers();
    
    // Configura listeners
    setupApprovalEventListeners();
    setupModalListeners();
    setupSearchListeners();


    // ##################################################################
    // ##                  CARREGAR USUÁRIOS PENDENTES                 ##
    // ##################################################################

    async function loadPendingUsers() {
        const listContainer = document.getElementById('approval-list-container');
        const pendingBadge = document.getElementById('pending-users-badge');
        
        if (!listContainer || !pendingBadge) return;
        
        listContainer.innerHTML = '<p>Carregando aprovações...</p>';

        try {
            const users = await listUsersByStatus('PENDENTE');

            if (!users || users.length === 0) {
                listContainer.innerHTML = '<p class="no-approvals-message">Nenhuma aprovação pendente no momento.</p>';
                pendingBadge.textContent = '0 Pendentes';
                return;
            }

            listContainer.innerHTML = '';
            users.forEach(user => {
                const card = createApprovalCard(user);
                listContainer.appendChild(card);
            });
            pendingBadge.textContent = `${users.length} Pendentes`;

        } catch (error) {
            console.error('Erro ao carregar usuários pendentes:', error);
            listContainer.innerHTML = '<p style="color: red;">Erro ao carregar usuários. Tente novamente mais tarde.</p>';
        }
    }

    function createApprovalCard(user) {
        const card = document.createElement('div');
        card.className = 'approval-card card';
        card.dataset.userId = user.id; 

        const initials = (user.nome || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
        const institutionOrRole = user.instituicao ? user.instituicao.nome : (user.cargo || 'Não informado');
        const role = user.cargo || 'Cargo não informado';
        
        card.innerHTML = `
            <div class="avatar-initials" style="background-color: #fef8e5; color: #f0ad4e;">${initials}</div>
            <div class="user-card-info">
                <p>${user.nome || 'Nome não informado'}</p>
                <small>${user.email || 'Email não informado'}</small>
                <small>${institutionOrRole}</small>
                ${institutionOrRole !== role ? `<small>${role}</small>` : ''} 
            </div>
            <span class="user-card-time">Solicitado</span>
            <div class="user-card-actions">
                <button class="btn btn-secondary" data-action="reject">Rejeitar</button>
                <button class="btn btn-primary" data-action="approve">Aprovar</button>
            </div>
        `;
        return card;
    }

    function setupApprovalEventListeners() {
        const listContainer = document.getElementById('approval-list-container');
        if (!listContainer) return;

        listContainer.addEventListener('click', async (event) => {
            const button = event.target.closest('button');
            if (!button) return;

            const action = button.dataset.action;
            if (action !== 'approve' && action !== 'reject') return;

            const card = button.closest('.approval-card');
            const userId = card.dataset.userId;
            const isApproved = (action === 'approve');

            if (!userId) return;

            await handleApproval(userId, isApproved, card);
        });
    }

    async function handleApproval(userId, isApproved, cardElement) {
        const buttons = cardElement.querySelectorAll('.user-card-actions button');
        buttons.forEach(btn => btn.disabled = true);
        
        const actionButton = cardElement.querySelector(`[data-action="${isApproved ? 'approve' : 'reject'}"]`);
        actionButton.textContent = 'Processando...';

        try {
            const message = await approveOrRejectUser(userId, isApproved);
            alert(message);
            
            cardElement.style.opacity = '0';
            cardElement.style.transition = 'opacity 0.3s ease-out';
            setTimeout(() => {
                cardElement.remove();
                updatePendingCount();
            }, 300);

        } catch (error) {
            console.error('Erro ao processar aprovação:', error);
            alert(`Erro: ${error.message || 'Não foi possível processar a solicitação.'}`);
            buttons.forEach(btn => btn.disabled = false);
            actionButton.textContent = isApproved ? 'Aprovar' : 'Rejeitar';
        }
    }

    function updatePendingCount() {
        const pendingBadge = document.getElementById('pending-users-badge');
        const listContainer = document.getElementById('approval-list-container');
        const remainingCardsCount = listContainer.querySelectorAll('.approval-card').length;
        
        if (pendingBadge) {
             pendingBadge.textContent = `${remainingCardsCount} Pendentes`;
        }
         
        if (remainingCardsCount === 0) {
             listContainer.innerHTML = '<p class="no-approvals-message">Nenhuma aprovação pendente no momento.</p>';
        }
    }

    // ##################################################################
    // ##                   CARREGAR USUÁRIOS ATIVOS                   ##
    // ##################################################################

    async function loadActiveUsers() {
        const listContainer = document.getElementById('active-user-list-container');
        const activeBadge = document.getElementById('active-users-badge');

        if (!listContainer || !activeBadge) return;
        
        listContainer.innerHTML = '<p>Carregando usuários ativos...</p>';

        try {
            const users = await listUsersByStatus('ATIVO');
            allActiveUsers = users || []; // Salva na variável global

            renderActiveUsers(allActiveUsers); // Renderiza a lista inicial
            activeBadge.textContent = `${allActiveUsers.length} Usuários`;

        } catch (error) {
            console.error('Erro ao carregar usuários ativos:', error);
            allActiveUsers = [];
            listContainer.innerHTML = '<p style="color: red;">Erro ao carregar usuários. Tente novamente mais tarde.</p>';
        }
    }

    /**
     * Renderiza a lista de usuários ativos no container.
     * @param {Array} users - A lista de usuários a ser renderizada.
     */
    function renderActiveUsers(users) {
        const listContainer = document.getElementById('active-user-list-container');
        listContainer.innerHTML = ''; // Limpa a lista

        if (!users || users.length === 0) {
            listContainer.innerHTML = '<p>Nenhum usuário ativo encontrado.</p>';
            return;
        }

        users.forEach(user => {
            const card = createActiveUserCard(user);
            listContainer.appendChild(card);
        });
    }

    /**
     * Cria o card HTML para um usuário ativo.
     */
    function createActiveUserCard(user) {
        const card = document.createElement('div');
        card.className = 'active-user-card card';

        const initials = getInitials(user.nome);
        const role = getRoleTag(user.cargo);
        const instituicao = user.instituicao ? user.instituicao.nome : 'Sem instituição';

        card.innerHTML = `
            <div class="avatar-initials" style="background-color: ${role.bgColor}; color: ${role.color};">${initials}</div>
            <div class="user-card-info">
                <p>${user.nome}</p>
                <small>${user.email}</small>
                <small>${instituicao}</small>
            </div>
            <div class="user-card-tags">
                <span class="tag ${role.tagClass}">${role.text}</span>
            </div>
            <button class="icon-button"><i class="fas fa-ellipsis-v"></i></button>
        `;
        return card;
    }

    /**
     * Helpers para criar cards
     */
    function getInitials(name) {
        return (name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }

    function getRoleTag(cargo) {
        switch(cargo) {
            case 'GESTOR_SECRETARIA':
                return { tagClass: 'tag-gestor-secretaria', text: 'Gestor Secretaria', bgColor: '#fceeee', color: '#d9534f' };
            case 'USUARIO_SECRETARIA':
                return { tagClass: 'tag-secretaria', text: 'Secretaria', bgColor: '#fef8e5', color: '#f0ad4e' };
            case 'GESTOR_INSTITUICAO':
                return { tagClass: 'tag-gestor-instituicao', text: 'Gestor Instituição', bgColor: '#e6f7ec', color: '#0d8a4f' };
            case 'USUARIO_INSTITUICAO':
                return { tagClass: 'tag-instituicao', text: 'Instituição', bgColor: '#e6f7ec', color: '#0d8a4f' };
            default:
                return { tagClass: 'tag-default', text: cargo, bgColor: '#e9ecef', color: '#495057' };
        }
    }


    // ##################################################################
    // ##                       LÓGICA DO MODAL                      ##
    // ##################################################################

    function setupModalListeners() {
        const modal = document.getElementById('invite-user-modal');
        const openButton = document.getElementById('inviteUserButton');
        const closeButton = document.getElementById('modal-close-button');
        const cancelButton = document.getElementById('modal-cancel-button');
        const inviteForm = document.getElementById('invite-form');

        if (!modal || !openButton || !closeButton || !cancelButton || !inviteForm) return;

        // Abrir o modal
        openButton.addEventListener('click', () => {
            modal.style.display = 'block';
        });

        // Fechar o modal (botão X e Cancelar)
        const closeModal = () => {
            modal.style.display = 'none';
            inviteForm.reset(); // Limpa o formulário
        };
        
        closeButton.addEventListener('click', closeModal);
        cancelButton.addEventListener('click', closeModal);

        // Fechar o modal (clique fora)
        window.addEventListener('click', (event) => {
            if (event.target == modal) {
                closeModal();
            }
        });

        // Submeter o formulário
        inviteForm.addEventListener('submit', handleInviteSubmit);
    }

    async function handleInviteSubmit(event) {
        event.preventDefault(); // Impede o recarregamento da página
        
        const submitButton = document.getElementById('modal-submit-button');
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';

        try {
            const partialData = {
                nome: document.getElementById('invite-name').value,
                email: document.getElementById('invite-email').value,
                instituicao: document.getElementById('invite-instituicao').value,
                cargo: document.getElementById('invite-cargo').value,
                justificativa: document.getElementById('invite-justificativa').value,
            };

            const message = await cadastrarParcial(partialData);
            
            alert(message); // Ex: "Solicitação enviada para análise."
            
            // Fecha o modal e limpa o formulário
            document.getElementById('modal-close-button').click(); 

        } catch (error) {
            console.error('Erro ao enviar convite:', error);
            alert(`Erro: ${error.message || 'Não foi possível enviar o convite.'}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar Convite';
        }
    }


    // ##################################################################
    // ##                     LÓGICA DA BUSCA                        ##
    // ##################################################################

    function setupSearchListeners() {
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');

        if (!searchInput || !searchButton) return;

        // Busca ao clicar no botão
        searchButton.addEventListener('click', filterActiveUsers);

        // Busca ao pressionar "Enter"
        searchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                filterActiveUsers();
            }
        });
    }

    function filterActiveUsers() {
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput.value.toLowerCase().trim();

        if (!searchTerm) {
            renderActiveUsers(allActiveUsers); // Se a busca estiver vazia, mostra todos
            return;
        }

        const filteredUsers = allActiveUsers.filter(user => {
            const nome = user.nome.toLowerCase();
            const email = user.email.toLowerCase();
            const instituicao = (user.instituicao ? user.instituicao.nome : '').toLowerCase();

            return nome.includes(searchTerm) || 
                   email.includes(searchTerm) || 
                   instituicao.includes(searchTerm);
        });

        renderActiveUsers(filteredUsers);
    }

});