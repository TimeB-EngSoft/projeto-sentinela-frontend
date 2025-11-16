// Importa as funções de apiService.js
import { 
    listUsersByStatus, 
    approveOrRejectUser,
    cadastrarParcial,
    cadastrarInstituicao,
    listarInstituicoes,
    listarUsuariosPorInstituicao,
    updateUser
} from '../services/apiService.js';

// Variável para armazenar os usuários ativos para filtragem
let allActiveUsers = [];

// Variável para guardar os dados da aprovação pendente
let pendingApprovalData = null; 

// Cache para a lista de instituições
let cachedApprovalInstitutions = null;

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
    loadPendingUsers();
    loadActiveUsers();
    
    // Configura listeners
    setupApprovalEventListeners();
    setupSearchListeners();
    setupModalListeners(); // Modal "Convidar"
    setupInstitutionModalListeners(); // Modal "Criar Instituição"
    setupLinkInstitutionModalListeners(); 


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
        card.dataset.userCargo = user.cargo;
        card.dataset.userName = user.nome;
        
        // --- MUDANÇA 1/4 ---
        // Salvamos o NOME da instituição (do DTO) no dataset do card
        // para que possamos lê-lo ao clicar em "Aprovar".
        card.dataset.instituicaoNome = user.instituicaoNome || '';
        // --- FIM DA MUDANÇA ---

        const initials = (user.nome || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
        
        const role = user.cargo || 'Cargo não informado';
        let institutionName = user.instituicaoNome; 
        
        if (!institutionName) {
            if (role === 'GESTOR_SECRETARIA' || role === 'USUARIO_SECRETARIA') {
                institutionName = 'Secretaria (Interno)';
            } else {
                institutionName = 'Não Informada';
            }
        }

        card.innerHTML = `
            <div class="avatar-initials" style="background-color: #fef8e5; color: #f0ad4e;">${initials}</div>
            <div class="user-card-info">
                <p>${user.nome || 'Nome não informado'}</p>
                <small>${user.email || 'Email não informado'}</small>
                <small>Instituição Solicitada: <strong>${institutionName}</strong></small>
                <small>Cargo Solicitado: <strong>${role}</strong></small>
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

            const userCargo = card.dataset.userCargo;
            const userName = card.dataset.userName;
            
            // --- MUDANÇA 2/4 ---
            // Lemos o nome da instituição que salvamos no dataset
            const instituicaoNome = card.dataset.instituicaoNome;
            // --- FIM DA MUDANÇA ---
            
            if (isApproved) {
                if (userCargo === 'GESTOR_INSTITUICAO' || userCargo === 'USUARIO_INSTITUICAO') {
                    // --- MUDANÇA 3/4 ---
                    // Passamos o nome da instituição para a função que abre o modal
                    openLinkInstitutionModal(userId, userName, userCargo, card, instituicaoNome);
                    // --- FIM DA MUDANÇA ---
                } else {
                    await executeApproval(userId, true, card);
                }
            } else {
                await executeApproval(userId, false, card);
            }
        });
    }

    async function executeApproval(userId, isApproved, cardElement) {
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

            if (isApproved) {
                loadActiveUsers();
            }

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
            allActiveUsers = users || []; 
            renderActiveUsers(allActiveUsers);
            activeBadge.textContent = `${allActiveUsers.length} Usuários`;
        } catch (error) {
            console.error('Erro ao carregar usuários ativos:', error);
            allActiveUsers = [];
            listContainer.innerHTML = '<p style="color: red;">Erro ao carregar usuários. Tente novamente mais tarde.</p>';
        }
    }
    function renderActiveUsers(users) {
        const listContainer = document.getElementById('active-user-list-container');
        listContainer.innerHTML = ''; 
        if (!users || users.length === 0) {
            listContainer.innerHTML = '<p>Nenhum usuário ativo encontrado.</p>';
            return;
        }
        users.forEach(user => {
            const card = createActiveUserCard(user);
            listContainer.appendChild(card);
        });
    }
    function createActiveUserCard(user) {
        const card = document.createElement('div');
        card.className = 'active-user-card card';
        const initials = getInitials(user.nome);
        const role = getRoleTag(user.cargo);
        // O DTO de usuário ATIVO tem o objeto 'instituicao' aninhado
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
    // ##                 LÓGICA DO MODAL (CONVIDAR)                   ##
    // ##################################################################
    
    // (Esta função precisa ser atualizada para usar o dropdown de instituições, como fizemos no cadastro.js)
    function setupModalListeners() {
        const modal = document.getElementById('invite-user-modal');
        const openButton = document.getElementById('inviteUserButton');
        const closeButton = document.getElementById('modal-close-button');
        const cancelButton = document.getElementById('modal-cancel-button');
        const inviteForm = document.getElementById('invite-form');
        if (!modal || !openButton || !closeButton || !cancelButton || !inviteForm) return;
        openButton.addEventListener('click', () => { modal.style.display = 'block'; });
        const closeModal = () => {
            modal.style.display = 'none';
            inviteForm.reset();
        };
        closeButton.addEventListener('click', closeModal);
        cancelButton.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => { if (event.target == modal) { closeModal(); } });
        inviteForm.addEventListener('submit', handleInviteSubmit);
    }
    async function handleInviteSubmit(event) {
        event.preventDefault(); 
        const submitButton = document.getElementById('modal-submit-button');
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';
        try {
            const partialData = {
                nome: document.getElementById('invite-name').value,
                email: document.getElementById('invite-email').value,
                instituicao: document.getElementById('invite-instituicao').value, // (!! CUIDADO: Este ainda é um input de texto)
                cargo: document.getElementById('invite-cargo').value,
                justificativa: document.getElementById('invite-justificativa').value,
            };
            const message = await cadastrarParcial(partialData);
            alert(message);
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
    // ##             LÓGICA DO MODAL (CRIAR INSTITUIÇÃO)            ##
    // ##################################################################
    
    function setupInstitutionModalListeners() {
        const modal = document.getElementById('create-institution-modal');
        const form = document.getElementById('create-institution-form');
        const closeButton = document.getElementById('modal-inst-close-button');
        const cancelButton = document.getElementById('modal-inst-cancel-button');
        if (!modal || !form || !closeButton || !cancelButton) return;
        const closeModal = () => {
            modal.style.display = 'none';
            form.reset();
            pendingApprovalData = null; 
        };
        closeButton.addEventListener('click', closeModal);
        cancelButton.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => { if (event.target == modal) { closeModal(); } });
        form.addEventListener('submit', handleInstitutionSubmit);
    }
    async function handleInstitutionSubmit(event) {
        event.preventDefault();
        const submitButton = document.getElementById('modal-inst-submit-button');
        submitButton.disabled = true;
        submitButton.textContent = 'Criando...';
        const instituicaoData = {
            nome: document.getElementById('inst-name').value,
            sigla: document.getElementById('inst-sigla').value,
            tipo: document.getElementById('inst-tipo').value, // (!! CUIDADO: o DTO não tem 'tipo')
        };
        try {
            const novaInstituicao = await cadastrarInstituicao(instituicaoData);
            alert(`Instituição "${novaInstituicao.nome}" criada com sucesso!`);
            document.getElementById('modal-inst-close-button').click();
        } catch (error) {
            console.error('Erro ao criar instituição:', error);
            alert(`Erro: ${error.message || 'Não foi possível criar a instituição.'}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Criar e Aprovar';
        }
    }


    // ##################################################################
    // ##             LÓGICA DO MODAL (VINCULAR INSTITUIÇÃO)           ##
    // ##################################################################

    function openLinkInstitutionModal(userId, userName, userCargo, cardElement, instituicaoNome) {
        // Guarda os dados da aprovação, incluindo o nome da instituição solicitada
        pendingApprovalData = { userId, isApproved: true, cardElement, userCargo, instituicaoNome };

        const modal = document.getElementById('link-institution-modal');
        const title = document.getElementById('link-institution-title');
        const desc = document.getElementById('link-institution-desc');
        
        if (title) {
            title.textContent = `Vincular ${userName} à Instituição`;
        }
        if (desc) {
            if (userCargo === 'GESTOR_INSTITUICAO') {
                desc.textContent = 'Este usuário é um Gestor. Selecione a instituição que ele irá gerenciar.';
            } else {
                desc.textContent = 'Selecione a instituição da qual este usuário fará parte.';
            }
        }
        
        if (modal) {
            modal.style.display = 'block';
            populateLinkInstitutionsDropdown(); 
        }
    }

    function setupLinkInstitutionModalListeners() {
        const modal = document.getElementById('link-institution-modal');
        const form = document.getElementById('link-institution-form');
        const closeButton = document.getElementById('modal-link-close-button');
        const cancelButton = document.getElementById('modal-link-cancel-button');
        
        if (!modal || !form || !closeButton || !cancelButton) return;

        const closeModal = () => {
            modal.style.display = 'none';
            form.reset();
            pendingApprovalData = null; 
        };

        closeButton.addEventListener('click', closeModal);
        cancelButton.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => { if (event.target == modal) { closeModal(); } });
        
        form.addEventListener('submit', handleLinkSubmit);
    }

    async function populateLinkInstitutionsDropdown() {
        const select = document.getElementById('link-inst-select');
        if (!select) return;

        // Limpa opções antigas, exceto se o cache já foi renderizado
        if (!cachedApprovalInstitutions) {
             select.innerHTML = '<option value="">Carregando...</option>';
             select.disabled = true;
        }

        try {
            // Só busca na API se o cache estiver vazio
            if (!cachedApprovalInstitutions) {
                const institutions = await listarInstituicoes();
                cachedApprovalInstitutions = institutions || []; 
            }
            renderInstitutionOptions(cachedApprovalInstitutions);
        } catch (error) {
            console.error('Erro ao carregar instituições:', error);
            select.innerHTML = '<option value="">Erro ao carregar</option>';
        } finally {
            select.disabled = false;
        }
    }

    function renderInstitutionOptions(institutions) {
        const select = document.getElementById('link-inst-select');
        select.innerHTML = ''; // Limpa o "Carregando..."
            
        if (institutions.length === 0) {
            select.innerHTML = '<option value="">Nenhuma instituição cadastrada</option>';
            return;
        }

        select.innerHTML = '<option value="">Selecione uma instituição...</option>';
        institutions.forEach(inst => {
            const option = document.createElement('option');
            option.value = inst.id;
            option.dataset.name = inst.nome; 
            option.textContent = `${inst.nome} (${inst.sigla || 'Sem Sigla'})`;
            select.appendChild(option);
        });

        // --- MUDANÇA 4/4 ---
        // Agora que as opções estão na tela, tentamos pré-selecionar
        // com base no nome que guardamos no 'pendingApprovalData'.
        const requestedInstitutionName = pendingApprovalData?.instituicaoNome;
        
        if (requestedInstitutionName) {
            // Encontra a opção cujo NOME (no dataset) corresponde ao nome solicitado
            const optionToSelect = Array.from(select.options).find(
                opt => opt.dataset.name === requestedInstitutionName
            );

            if (optionToSelect) {
                // Se achou, define o valor do <select> para o ID daquela opção
                select.value = optionToSelect.value;
            } else {
                // Se não achou (ex: "Secretaria (Interno)" ou nome não existe mais)
                // apenas deixa em "Selecione uma instituição..."
                select.value = "";
            }
        }
        // --- FIM DA MUDANÇA ---
    }

    async function handleLinkSubmit(event) {
        event.preventDefault();
        
        if (!pendingApprovalData) return;

        const select = document.getElementById('link-inst-select');
        const selectedOption = select.options[select.selectedIndex];
        
        if (!selectedOption || !selectedOption.value) {
            alert('Por favor, selecione uma instituição.');
            return;
        }

        const institutionId = selectedOption.value;
        const institutionName = selectedOption.dataset.name; 
        const { userId, userCargo, cardElement } = pendingApprovalData;

        const submitButton = document.getElementById('modal-link-submit-button');
        submitButton.disabled = true;
        submitButton.textContent = 'Verificando...';

        try {
            if (userCargo === 'GESTOR_INSTITUICAO') {
                const gestores = await listarUsuariosPorInstituicao(institutionId, 'GESTOR_INSTITUICAO');
                const gestoresAtivos = gestores.filter(g => g.status === 'ATIVO');

                if (gestoresAtivos.length > 0) {
                    alert(`Erro: A instituição "${institutionName}" já possui um gestor ativo (${gestoresAtivos[0].nome}). Não é possível aprovar um novo gestor.`);
                    throw new Error('Instituição já possui gestor.');
                }
            }

            submitButton.textContent = 'Vinculando...';
            
            // O backend espera 'instituicaoNome' no DTO de atualização
            await updateUser(userId, { instituicaoNome: institutionName });

            submitButton.textContent = 'Aprovando...';
            await executeApproval(userId, true, cardElement);
            
            document.getElementById('modal-link-close-button').click();

        } catch (error) {
            console.error('Erro ao vincular/aprovar usuário:', error);
            if (error.message !== 'Instituição já possui gestor.') {
                 alert(`Erro: ${error.message || 'Não foi possível vincular o usuário.'}`);
            }
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Vincular e Aprovar';
        }
    }


    // ##################################################################
    // ##                     LÓGICA DA BUSCA                        ##
    // ##################################################################

    function setupSearchListeners() {
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');

        if (!searchInput || !searchButton) return;
        searchButton.addEventListener('click', filterActiveUsers);
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
            renderActiveUsers(allActiveUsers);
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