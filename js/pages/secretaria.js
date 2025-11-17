// Importa as funções necessárias do serviço de API
import { 
    listUsersByStatus, 
    listarInstituicoes, 
    listarConflitos,
    listarDenuncias,
    approveOrRejectUser
} from '../services/apiService.js';

document.addEventListener('DOMContentLoaded', function() {
    
    // Funções de setup inicial
    loadHeaderUserData();
    setupMobileMenu();
    setupEvolutionChart(); // Mantém o gráfico
    
    // Novas funções para carregar dados dinâmicos
    loadDashboardStats();
    loadPendingUsers();
    setupApprovalEventListeners(); // Adiciona listeners para os botões de aprovação
});

// ##################################################################
// ##                  SETUP BÁSICO DA PÁGINA                     ##
// ##################################################################

// Função para carregar dados do usuário no cabeçalho
function loadHeaderUserData() {
    const userName = localStorage.getItem('userName');
    if (userName) {
        document.getElementById('headerUserName').textContent = userName;
    } else {
        document.getElementById('headerUserName').textContent = 'Usuário';
    }

    // // Simples inicial para o avatar
    // const avatar = document.getElementById('headerUserAvatar');
    // if (userName && avatar) {
    //     const inicial = userName.charAt(0).toUpperCase();
    //     avatar.innerHTML = `<span>${inicial}</span>`;
    //     avatar.classList.remove('avatar-placeholder');
    // }
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
            const isClickOnMenuToggle = menuToggle.contains(event.target);

            if (!isClickInsideSidebar && !isClickOnMenuToggle) {
                sidebar.classList.remove('open');
            }
        }
    });
}

// ##################################################################
// ##              CARREGAR ESTATÍSTICAS (NOVO)                    ##
// ##################################################################

/**
 * Busca os dados para os cards de estatísticas do topo.
 */
async function loadDashboardStats() {
    try {
        // Busca todas as chamadas em paralelo
        const [users, institutions, conflicts, denuncias] = await Promise.all([
            fetchUsersSafely('ATIVO'), // Usamos a função segura
            listarInstituicoes(),
            listarConflitos(),
            listarDenuncias()
        ]);

        // Filtra apenas os gestores da lista de usuários ativos
        const gestores = users.filter(u => 
            u.cargo === 'GESTOR_SECRETARIA' || u.cargo === 'GESTOR_INSTITUICAO'
        );

        // Atualiza os elementos no HTML
        document.getElementById('stat-total-gestores').textContent = gestores.length;
        document.getElementById('stat-instituicoes').textContent = (institutions || []).length;
        document.getElementById('stat-conflitos').textContent = (conflicts || []).length;
        document.getElementById('stat-denuncias').textContent = (denuncias || []).length;

    } catch (error) {
        console.error("Erro ao carregar estatísticas do dashboard:", error);
        // Define um estado de erro nos cards
        document.getElementById('stat-total-gestores').textContent = 'N/A';
        document.getElementById('stat-instituicoes').textContent = 'N/A';
        document.getElementById('stat-conflitos').textContent = 'N/A';
        document.getElementById('stat-denuncias').textContent = 'N/A';
    }
}

// ##################################################################
// ##              GRÁFICO DE EVOLUÇÃO (MANTIDO)                   ##
// ##################################################################

// Lógica para renderizar o gráfico com Chart.js
function setupEvolutionChart() {
    const ctx = document.getElementById('evolutionChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Denúncias',
                    data: [12, 19, 3, 5, 2, 3],
                    borderColor: '#f0ad4e', // Cor amarela/laranja para denúncias
                    backgroundColor: 'rgba(240, 173, 78, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4 // Deixa a linha mais suave
                }, {
                    label: 'Conflitos',
                    data: [7, 11, 5, 8, 3, 7],
                    borderColor: '#D44716', // Cor primária para conflitos
                    backgroundColor: 'rgba(212, 71, 22, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        align: 'start',
                        labels: {
                            usePointStyle: true,
                            boxWidth: 8,
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e9e5dc' // Cor da grade mais suave
                        }
                    },
                    x: {
                        grid: {
                            display: false // Remove a grade vertical
                        }
                    }
                }
            }
        });
    }
}

// ##################################################################
// ##           APROVAÇÕES PENDENTES (NOVO / ADAPTADO)             ##
// ##################################################################

/**
 * Função auxiliar para buscar usuários, tratando o erro de "lista vazia"
 */
async function fetchUsersSafely(status) {
    try {
        return await listUsersByStatus(status);
    } catch (error) {
        // Se o backend retorna erro por lista vazia, tratamos como lista vazia
        if (error.message && error.message.includes("Não há usuários com este status")) {
            return []; 
        }
        throw error; // Lança outros erros
    }
}

/**
 * Carrega os usuários com status PENDENTE.
 * (Lógica adaptada de usuarios-sistema.js)
 */
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
 * Cria o HTML para o card de aprovação.
 * (Lógica adaptada de usuarios-sistema.js)
 */
function createApprovalCard(user) {
    const card = document.createElement('div');
    card.className = 'approval-item'; // Classe do CSS da secretaria.html
    card.dataset.userId = user.id; 
    
    // Adaptação: O HTML original usa 'avatar', 'item-details', etc.
    const initials = (user.nome || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const role = user.cargo || 'Cargo não informado';
    let institutionName = user.instituicaoNome; 

    if (!institutionName) {
        if (role.includes('SECRETARIA')) {
            institutionName = 'Secretaria (Interno)';
        } else {
            institutionName = 'Não Informada';
        }
    }

    card.innerHTML = `
        <div class="avatar avatar-placeholder" style="background-color: #fef8e5; color: #f0ad4e;">${initials}</div>
        <div class="item-details">
            <p>${user.nome || 'Nome não informado'}</p>
            <small>${role} - ${institutionName}</small>
        </div>
        <span class="item-time">Solicitado</span>
        <div class="item-actions">
            <button class="btn btn-secondary" data-action="reject">Rejeitar</button>
            <button class="btn btn-primary" data-action="approve">Aprovar</button>
        </div>
    `;
    return card;
}

/**
 * Adiciona os listeners aos botões de Aprovar/Rejeitar.
 * (Lógica adaptada de usuarios-sistema.js)
 */
function setupApprovalEventListeners() {
    const listContainer = document.getElementById('approval-list-container');
    if (!listContainer) return;

    listContainer.addEventListener('click', async (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        if (action !== 'approve' && action !== 'reject') return;

        const card = button.closest('.approval-item');
        const userId = card.dataset.userId;
        const isApproved = (action === 'approve');

        if (!userId) return;
        
        // AVISO: A aprovação de GESTOR_INSTITUICAO requer a lógica de
        // vincular a uma instituição, que está em 'usuarios-sistema.js'.
        // Aqui, faremos a aprovação direta, o que pode falhar para gestores.
        if (isApproved && (card.innerHTML.includes('GESTOR_INSTITUICAO') || card.innerHTML.includes('USUARIO_INSTITUICAO'))) {
            alert('Aprovação de usuários de instituição deve ser feita na tela "Usuários do Sistema" para vincular corretamente.');
            return;
        }

        await executeApproval(userId, isApproved, card);
    });
}

/**
 * Executa a ação de aprovar ou rejeitar.
 * (Lógica adaptada de usuarios-sistema.js)
 */
async function executeApproval(userId, isApproved, cardElement) {
    const buttons = cardElement.querySelectorAll('.item-actions button');
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

        // Se aprovou, recarrega os stats
        if (isApproved) {
            loadDashboardStats();
        }

    } catch (error) {
        console.error('Erro ao processar aprovação:', error);
        alert(`Erro: ${error.message || 'Não foi possível processar a solicitação.'}`);
        buttons.forEach(btn => btn.disabled = false);
        actionButton.textContent = isApproved ? 'Aprovar' : 'Rejeitar';
    }
}

/**
 * Atualiza o contador de pendentes.
 * (Lógica adaptada de usuarios-sistema.js)
 */
function updatePendingCount() {
    const pendingBadge = document.getElementById('pending-users-badge');
    const listContainer = document.getElementById('approval-list-container');
    const remainingCardsCount = listContainer.querySelectorAll('.approval-item').length;
    
    if (pendingBadge) {
         pendingBadge.textContent = `${remainingCardsCount} Pendentes`;
    }
     
    if (remainingCardsCount === 0) {
         listContainer.innerHTML = '<p class="no-approvals-message">Nenhuma aprovação pendente no momento.</p>';
    }
}