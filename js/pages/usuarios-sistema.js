// Importa as funções de apiService.js
import { 
    listUsersByStatus, 
    approveOrRejectUser,
    cadastrarParcial,
    cadastrarInstituicao,
    listarInstituicoes,
    listarUsuariosPorInstituicao,
    updateUser,
    // (A função getUserData pode ser necessária se você adicionar um modal de "detalhes" aqui)
    // getUserData 
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
    setupInviteUserModalListeners(); // Modal "Convidar" ATUALIZADO
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
            const users = await fetchUsersSafely('PENDENTE');

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

   function createApprovalCard(user) {
        const card = document.createElement('div');
        card.className = 'approval-card card';
        card.dataset.userId = user.id; 
        card.dataset.userCargo = user.cargo;
        card.dataset.userName = user.nome;
        card.dataset.instituicaoNome = user.instituicaoNome || '';

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
            const instituicaoNome = card.dataset.instituicaoNome;
            
            if (isApproved) {
                if (userCargo === 'GESTOR_INSTITUICAO' || userCargo === 'USUARIO_INSTITUICAO') {
                    openLinkInstitutionModal(userId, userName, userCargo, card, instituicaoNome);
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
                loadActiveUsers(); // Recarrega lista de ativos
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
            const users = await fetchUsersSafely('ATIVO');
            allActiveUsers = users || []; 
            renderActiveUsers(allActiveUsers); // Renderiza a lista completa
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
    // ##             LÓGICA DO MODAL (CONVIDAR) ATUALIZADA            ##
    // ##################################################################
    
    function setupInviteUserModalListeners() {
        const modal = document.getElementById('invite-user-modal');
        const openButton = document.getElementById('inviteUserButton');
        const closeButton = document.getElementById('modal-close-button');
        const cancelButton = document.getElementById('modal-cancel-button');
        const inviteForm = document.getElementById('invite-form');
        
        const cargoSelect = document.getElementById('invite-cargo');
        const instituicaoGroup = document.getElementById('invite-instituicao-group');
        const instituicaoSelect = document.getElementById('invite-instituicao-select');

        if (!modal || !openButton || !inviteForm || !cargoSelect || !instituicaoGroup) return;

        openButton.addEventListener('click', () => {
            modal.style.display = 'block';
            // Popula as instituições *toda vez* que abre, usando o cache se disponível
            // Isso garante que o dropdown de "Vincular" e o de "Convidar" estejam em sincronia
            populateInstitutionsDropdown(instituicaoSelect, "Selecione uma instituição");
            toggleInviteInstituicaoField(); // Garante o estado correto ao abrir
        });

        const closeModal = () => {
            modal.style.display = 'none';
            inviteForm.reset();
            instituicaoGroup.style.display = 'none'; // Reseta o campo
        };

        closeButton.addEventListener('click', closeModal);
        cancelButton.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => { if (event.target == modal) { closeModal(); } });

        // Listener para mostrar/ocultar campo de instituição
        cargoSelect.addEventListener('change', toggleInviteInstituicaoField);

        function toggleInviteInstituicaoField() {
            const selectedCargo = cargoSelect.value;
            if (selectedCargo === 'GESTOR_INSTITUICAO' || selectedCargo === 'USUARIO_INSTITUICAO') {
                instituicaoGroup.style.display = 'block';
                instituicaoSelect.setAttribute('required', 'required');
            } else {
                instituicaoGroup.style.display = 'none';
                instituicaoSelect.removeAttribute('required');
                instituicaoSelect.value = ''; // Limpa a seleção
            }
        }
        
        inviteForm.addEventListener('submit', handleInviteSubmit);
    }

    /**
     * Lida com o envio do formulário de convite (lógica de cadastro + aprovação).
     */
    async function handleInviteSubmit(event) {
        event.preventDefault(); 
        const submitButton = document.getElementById('modal-submit-button');
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';

        const nome = document.getElementById('invite-name').value;
        const email = document.getElementById('invite-email').value;
        const cargo = document.getElementById('invite-cargo').value;
        const justificativa = document.getElementById('invite-justificativa').value || 'Convidado pelo administrador.';
        
        const instituicaoSelect = document.getElementById('invite-instituicao-select');
        const instituicaoNome = instituicaoSelect.options[instituicaoSelect.selectedIndex]?.text; // Pega o NOME da instituição
        
        try {
            const partialData = {
                nome,
                email,
                cargo,
                justificativa,
                instituicaoNome: null // Default
            };

            // Adiciona instituição apenas se o cargo exigir
            if (cargo === 'GESTOR_INSTITUICAO' || cargo === 'USUARIO_INSTITUICAO') {
                if (!instituicaoNome || instituicaoSelect.value === "") {
                    throw new Error('Por favor, selecione uma instituição para este cargo.');
                }
                partialData.instituicaoNome = instituicaoNome;
            } else {
                // Para Secretaria, o backend deve tratar 'instituicaoNome' nulo
                // ou podemos enviar um valor padrão se a API exigir.
                // Assumindo que a API pode lidar com nulo ou "" para Secretaria.
                partialData.instituicaoNome = 'Secretaria'; // Garante que não é nulo
            }

            // ETAPA 1: Cadastrar o usuário (ele ficará PENDENTE)
            await cadastrarParcial(partialData);

            // ETAPA 2: Buscar o ID do usuário recém-criado
            const pendingUsers = await fetchUsersSafely('PENDENTE');
            const newUser = pendingUsers.find(u => u.email === email);

            if (!newUser) {
                throw new Error('Não foi possível encontrar o usuário recém-criado para aprovação.');
            }

            // ETAPA 3: Aprovar o usuário (isso dispara o e-mail de cadastro)
            await approveOrRejectUser(newUser.id, true);

            alert('Usuário convidado com sucesso! Um e-mail de cadastro foi enviado para ' + email);
            document.getElementById('modal-close-button').click();
            
            // Recarrega ambas as listas
            loadPendingUsers();
            loadActiveUsers();

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
        
        // Cuidado: O DTO de Instituição do 'gerenciar-instituicoes.js'
        // parece ser diferente deste (lá tem nome, sigla, cnpj, email, etc.)
        // Aqui está usando nome, sigla, tipo.
        const instituicaoData = {
            nome: document.getElementById('inst-name').value,
            sigla: document.getElementById('inst-sigla').value,
            // O backend espera 'areaAtuacao', não 'tipo'
            areaAtuacao: document.getElementById('inst-tipo').value, 
            
            // Você pode precisar adicionar campos nulos/vazios se o DTO for o mesmo
            // da tela de 'gerenciar-instituicoes'
            // cnpj: "", email: "", telefone: "", descricao: ""
        };

        try {
            const novaInstituicao = await cadastrarInstituicao(instituicaoData);
            alert(`Instituição "${novaInstituicao.nome}" criada com sucesso!`);
            
            // Invalida o cache para que o dropdown seja recarregado com a nova instituição
            cachedApprovalInstitutions = null;

            document.getElementById('modal-inst-close-button').click();

            // Após criar, reabre o modal de vincular com o usuário original
            if (pendingApprovalData) {
                const { userId, userName, userCargo, cardElement, instituicaoNome } = pendingApprovalData;
                openLinkInstitutionModal(userId, userName, userCargo, cardElement, instituicaoNome);
                
                // Tenta pré-selecionar a instituição recém-criada
                // (O 'populateLinkInstitutionsDropdown' dentro do 'openLink' vai lidar com isso)
                // Vamos dar um "empurrão" para pré-selecionar o nome recém-criado
                pendingApprovalData.instituicaoNome = novaInstituicao.nome; 
            }

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
        
        if (title) title.textContent = `Vincular ${userName} à Instituição`;
        if (desc) {
            desc.textContent = (userCargo === 'GESTOR_INSTITUICAO')
                ? 'Este usuário é um Gestor. Selecione a instituição que ele irá gerenciar.'
                : 'Selecione a instituição da qual este usuário fará parte.';
        }
        
        if (modal) {
            modal.style.display = 'block';
            const select = document.getElementById('link-inst-select');
            populateInstitutionsDropdown(select, "Selecione uma instituição...");
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

    /**
     * Função REUTILIZÁVEL para popular dropdowns de instituição
     */
    async function populateInstitutionsDropdown(selectElement, placeholderText) {
        if (!selectElement) return;

        // Limpa opções antigas, exceto se o cache já foi renderizado
        if (!cachedApprovalInstitutions) {
             selectElement.innerHTML = `<option value="">Carregando...</option>`;
             selectElement.disabled = true;
        }

        try {
            // Só busca na API se o cache estiver vazio
            if (!cachedApprovalInstitutions) {
                const institutions = await listarInstituicoes();
                cachedApprovalInstitutions = institutions || []; 
            }
            renderInstitutionOptions(selectElement, cachedApprovalInstitutions, placeholderText);
        } catch (error) {
            console.error('Erro ao carregar instituições:', error);
            selectElement.innerHTML = `<option value="">Erro ao carregar</option>`;
        } finally {
            selectElement.disabled = false;
        }
    }

    function renderInstitutionOptions(select, institutions, placeholderText) {
        select.innerHTML = ''; // Limpa o "Carregando..."
            
        if (institutions.length === 0) {
            select.innerHTML = '<option value="">Nenhuma instituição cadastrada</option>';
            return;
        }

        select.innerHTML = `<option value="">${placeholderText}</option>`;
        institutions.forEach(inst => {
            const option = document.createElement('option');
            option.value = inst.id;
            option.dataset.name = inst.nome; 
            option.textContent = `${inst.nome} (${inst.sigla || 'Sem Sigla'})`;
            select.appendChild(option);
        });

        // Tenta pré-selecionar se os dados pendentes existirem (para o modal "Vincular")
        const requestedInstitutionName = pendingApprovalData?.instituicaoNome;
        if (requestedInstitutionName && select.id === 'link-inst-select') {
            const optionToSelect = Array.from(select.options).find(
                opt => opt.dataset.name === requestedInstitutionName
            );

            if (optionToSelect) {
                select.value = optionToSelect.value;
            } else {
                select.value = "";
            }
        }
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
                // Filtra gestores ATIVOS ou PENDENTES (para evitar duplicidade)
                const gestoresAtivosOuPendentes = gestores.filter(g => g.status === 'ATIVO' || g.status === 'PENDENTE');

                if (gestoresAtivosOuPendentes.length > 0) {
                    alert(`Erro: A instituição "${institutionName}" já possui um gestor ativo ou pendente (${gestoresAtivosOuPendentes[0].nome}). Não é possível aprovar um novo gestor.`);
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
    // ##                 LÓGICA DA BUSCA (USUÁRIOS ATIVOS)            ##
    // ##################################################################

    function setupSearchListeners() {
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');

        if (!searchInput || !searchButton) return;
        
        const filterActiveUsers = () => {
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
        };
        
        searchButton.addEventListener('click', filterActiveUsers);
        searchInput.addEventListener('keyup', filterActiveUsers); // Busca em tempo real
    }
});