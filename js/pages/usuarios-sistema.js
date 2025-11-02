// Importa as funções de apiService.js
// O caminho deve ser relativo ao local de usuarios-sistema.js
import { listUsersByStatus, approveOrRejectUser } from '../services/apiService.js';
// (Você pode querer importar o logoutUser também se tiver um botão de logout)

document.addEventListener('DOMContentLoaded', function() {
    
    // --- Funções Reutilizadas (de secretaria.js) ---

    // Função para carregar dados do usuário no cabeçalho
    function loadHeaderUserData() {
        const userName = localStorage.getItem('userName');
        //const userCargo = localStorage.getItem('userCargo'); // userCargo não está no HTML, mas o nome sim

        if (userName) {
            document.getElementById('headerUserName').textContent = userName;
        } else {
            document.getElementById('headerUserName').textContent = 'Usuário';
        }

        // Simples inicial para o avatar
        // const avatar = document.getElementById('headerUserAvatar');
        // if (userName && avatar) {
        //     const inicial = userName.charAt(0).toUpperCase();
        //     avatar.innerHTML = `<span>${inicial}</span>`;
        //     avatar.classList.remove('avatar-placeholder');
        //}
    }

    // Lógica para o menu hambúrguer em telas móveis
    function setupMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.querySelector('.sidebar');

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }

        // Lógica para fechar a sidebar ao clicar fora dela
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

    
    // --- Nova Lógica para Gerenciamento de Usuários ---

    const approvalListContainer = document.querySelector('.approval-card-list');
    
    if (approvalListContainer) {
        loadPendingUsers();
        setupApprovalEventListeners();
    }

    /**
     * Carrega os usuários pendentes da API e os exibe na tela.
     */
    async function loadPendingUsers() {
        const listContainer = document.querySelector('.approval-card-list');
        const pendingBadge = document.querySelector('.user-approvals-list .section-header .badge');
        
        listContainer.innerHTML = '<p>Carregando aprovações...</p>'; // Estado de carregamento

        try {
            // "PENDENTE" é o status que seu backend provavelmente espera
            const users = await listUsersByStatus('PENDENTE');

            if (!users || users.length === 0) {
                listContainer.innerHTML = '<p>Nenhuma aprovação pendente no momento.</p>';
                if(pendingBadge) pendingBadge.textContent = '0 Pendentes';
                return;
            }

            listContainer.innerHTML = ''; // Limpa o "Carregando..."
            
            users.forEach(user => {
                const card = createApprovalCard(user);
                listContainer.appendChild(card);
            });

            // Atualiza o contador
            if(pendingBadge) pendingBadge.textContent = `${users.length} Pendentes`;

        } catch (error) {
            console.error('Erro ao carregar usuários pendentes:', error);
            listContainer.innerHTML = '<p style="color: red;">Erro ao carregar usuários. Tente novamente mais tarde.</p>';
        }
    }

    /**
     * Cria o elemento HTML para um card de aprovação.
     * @param {object} user - O objeto do usuário vindo da API.
     */
    function createApprovalCard(user) {
        const card = document.createElement('div');
        card.className = 'approval-card card';
        card.dataset.userId = user.id; // Armazena o ID no elemento para fácil acesso

        const initials = (user.nome || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
        
        // Tenta pegar o nome da instituição; se não houver, usa o cargo
        const institutionOrRole = user.instituicao ? user.instituicao.nome : (user.cargo || 'Não informado');
        const role = user.cargo || 'Cargo não informado';
        
        // Define o HTML interno do card
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

    /**
     * Configura um único listener de eventos no container pai para gerenciar os cliques
     * nos botões de "Aprovar" e "Rejeitar" (event delegation).
     */
    function setupApprovalEventListeners() {
        const listContainer = document.querySelector('.approval-card-list');
        if (!listContainer) return;

        listContainer.addEventListener('click', async (event) => {
            const button = event.target.closest('button');
            if (!button) return; // Não foi um clique em um botão

            const action = button.dataset.action;
            if (action !== 'approve' && action !== 'reject') return; // Não é um botão de ação

            const card = button.closest('.approval-card');
            const userId = card.dataset.userId;
            const isApproved = (action === 'approve');

            if (!userId) return;

            // Lida com a aprovação/rejeição
            await handleApproval(userId, isApproved, card);
        });
    }

    /**
     * Lida com a chamada de API para aprovar ou rejeitar e atualiza a UI.
     * @param {string} userId - O ID do usuário.
     * @param {boolean} isApproved - true para aprovar, false para rejeitar.
     * @param {HTMLElement} cardElement - O elemento do card a ser removido.
     */
    async function handleApproval(userId, isApproved, cardElement) {
        // Desabilita botões para evitar cliques duplos
        const buttons = cardElement.querySelectorAll('.user-card-actions button');
        buttons.forEach(btn => btn.disabled = true);
        
        const actionButton = cardElement.querySelector(`[data-action="${isApproved ? 'approve' : 'reject'}"]`);
        actionButton.textContent = 'Processando...';

        try {
            const message = await approveOrRejectUser(userId, isApproved);
            
            // Sucesso!
            alert(message); // Exibe a mensagem do backend (ex: "Usuário aprovado...")
            
            // Remove o card da UI com uma pequena animação
            cardElement.style.opacity = '0';
            cardElement.style.transition = 'opacity 0.3s ease-out';
            setTimeout(() => {
                cardElement.remove();
                updatePendingCount(); // Atualiza o contador
            }, 300);

        } catch (error) {
            console.error('Erro ao processar aprovação:', error);
            alert(`Erro: ${error.message || 'Não foi possível processar a solicitação.'}`);
            
            // Reabilita os botões em caso de falha
            buttons.forEach(btn => btn.disabled = false);
            actionButton.textContent = isApproved ? 'Aprovar' : 'Rejeitar';
        }
    }

    /**
     * Atualiza o contador de pendências no cabeçalho da seção.
     */
    function updatePendingCount() {
        const pendingBadge = document.querySelector('.user-approvals-list .section-header .badge');
        const listContainer = document.querySelector('.approval-card-list');
        const remainingCardsCount = listContainer.querySelectorAll('.approval-card').length;
        
        if (pendingBadge) {
             pendingBadge.textContent = `${remainingCardsCount} Pendentes`;
        }
         
        // Se for o último card, exibe a mensagem de "nenhum pendente"
        if (remainingCardsCount === 0) {
             listContainer.innerHTML = '<p>Nenhuma aprovação pendente no momento.</p>';
        }
    }

});