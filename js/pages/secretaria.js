import { listUsersByStatus, listarInstituicoes, listarConflitos, listarDenuncias, approveOrRejectUser } from '../services/apiService.js';

// --- Função auxiliar para exibir toast ---
function showToast(message, type = 'success', title = null) {
    const container = document.getElementById('toast-container');
    if (!container) return; // Se não houver container, não faz nada
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    const titleText = title || (type === 'success' ? 'Sucesso' : 'Atenção');
    
    toast.innerHTML = `
        <i class="fas ${icon}" style="font-size: 1.2rem;"></i>
        <div class="toast-content">
            <span class="toast-title">${titleText}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Função Principal de Inicialização ---
export async function init() {
    console.log('Inicializando Dashboard...');
    
    setupEvolutionChart();
    loadDashboardStats();
    loadPendingUsers();
    setupApprovalEventListeners();
    setupStatsClickListeners();
}

// --- Funções Auxiliares do Dashboard ---

function setupEvolutionChart() {
    const ctx = document.getElementById('evolutionChart');
    // Verifica se o Chart.js está carregado e se o canvas existe
    if (ctx && typeof Chart !== 'undefined') {
        const chartStatus = Chart.getChart(ctx);
        if (chartStatus) chartStatus.destroy();

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Denúncias',
                    data: [12, 19, 3, 5, 2, 3],
                    borderColor: '#f0ad4e',
                    backgroundColor: 'rgba(240, 173, 78, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Conflitos',
                    data: [7, 11, 5, 8, 3, 7],
                    borderColor: '#D44716',
                    backgroundColor: 'rgba(212, 71, 22, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: { x: { grid: { display: false } } }
            }
        });
    } else if (ctx && typeof Chart === 'undefined') {
        console.warn('Chart.js não foi carregado. O gráfico não será exibido.');
    }
}

function setupStatsClickListeners() {
    const statRoutes = {
        'stat-total-gestores': '#/gestores',
        'stat-instituicoes': '#/instituicoes',
        'stat-conflitos': '#/conflitos',
        'stat-denuncias': '#/denuncias'
    };

    Object.entries(statRoutes).forEach(([id, route]) => {
        const spanElement = document.getElementById(id);
        if (spanElement) {
            const cardElement = spanElement.closest('.stat-card');
            if (cardElement) {
                cardElement.style.cursor = 'pointer';
                cardElement.addEventListener('click', () => {
                    window.location.hash = route;
                });
            }
        }
    });
    
    const pendingBadge = document.getElementById('pending-users-badge');
    if (pendingBadge) {
        const approvalHeader = pendingBadge.closest('.card-header');
        if (approvalHeader) {
            approvalHeader.style.cursor = 'pointer';
            approvalHeader.addEventListener('click', (event) => {
                if (event.target.tagName !== 'BUTTON') {
                    window.location.hash = '#/usuarios';
                }
            });
        }
    }
}

async function loadDashboardStats() {
    try {
        const [pendentes, ativos, institutions, conflicts, denuncias] = await Promise.all([
            fetchUsersSafely('PENDENTE'),
            fetchUsersSafely('ATIVO'),
            listarInstituicoes(),
            listarConflitos(),
            listarDenuncias()
        ]);

        const gestores = ativos.filter(u => u.cargo.includes('GESTOR'));

        if(document.getElementById('stat-total-gestores'))
            document.getElementById('stat-total-gestores').textContent = gestores.length;
        
        if(document.getElementById('stat-instituicoes')) {
            const instAtivas = (institutions || []).filter(i => i.status === 'ATIVO');
            document.getElementById('stat-instituicoes').textContent = instAtivas.length;
        }

        if(document.getElementById('stat-conflitos')) {
            const confAtivos = (conflicts || []).filter(c => c.status === 'ATIVO');
            document.getElementById('stat-conflitos').textContent = confAtivos.length;
        }

        if(document.getElementById('stat-denuncias')) {
            const denValidadas = (denuncias || []).filter(d => d.status === 'APROVADA');
            document.getElementById('stat-denuncias').textContent = denValidadas.length;
        }

        const pendingBadgeEl = document.getElementById('pending-users-badge');
        if(pendingBadgeEl) pendingBadgeEl.textContent = `${pendentes.length} Pendentes`;

    } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
    }
}

async function fetchUsersSafely(status) {
    try {
        return await listUsersByStatus(status);
    } catch (error) {
        if (error.message && error.message.includes("Não há usuários")) return [];
        throw error;
    }
}

async function loadPendingUsers() {
    const listContainer = document.getElementById('approval-list-container');
    const pendingBadge = document.getElementById('pending-users-badge');
    
    if (!listContainer) return;
    listContainer.innerHTML = '<p>Carregando...</p>';

    try {
        const users = await fetchUsersSafely('PENDENTE');

        if (!users || users.length === 0) {
            listContainer.innerHTML = '<p class="no-approvals-message">Nenhuma aprovação pendente.</p>';
            if(pendingBadge) pendingBadge.textContent = '0 Pendentes';
            return;
        }

        listContainer.innerHTML = '';
        users.forEach(user => {
            listContainer.appendChild(createApprovalCard(user));
        });
        if(pendingBadge) pendingBadge.textContent = `${users.length} Pendentes`;

    } catch (error) {
        listContainer.innerHTML = '<p class="is-error">Erro ao carregar lista.</p>';
    }
}

function createApprovalCard(user) {
    const card = document.createElement('div');
    card.className = 'approval-item';
    card.dataset.userId = user.id;
    
    const initials = (user.nome || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const role = user.cargo || 'Cargo não informado';
    const inst = user.instituicaoNome || (role.includes('SECRETARIA') ? 'Secretaria' : 'Não Informada');

    card.innerHTML = `
        <div class="avatar avatar-placeholder" style="background-color: #fef8e5; color: #f0ad4e;">${initials}</div>
        <div class="item-details">
            <p>${user.nome}</p>
            <small>${role} - ${inst}</small>
        </div>
        <div class="item-actions">
            <button class="btn btn-secondary btn-sm" data-action="reject">Rejeitar</button>
            <button class="btn btn-primary btn-sm" data-action="approve">Aprovar</button>
        </div>
    `;
    return card;
}

function setupApprovalEventListeners() {
    const listContainer = document.getElementById('approval-list-container');
    if (!listContainer) return;

    const newContainer = listContainer.cloneNode(true);
    listContainer.parentNode.replaceChild(newContainer, listContainer);

    newContainer.addEventListener('click', async (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        const action = button.dataset.action;
        const card = button.closest('.approval-item');
        if (!card || !action) return;
        const userId = card.dataset.userId;

        if (action === 'approve') await executeApproval(userId, true, card);
        if (action === 'reject') await executeApproval(userId, false, card);
    });
}

async function executeApproval(userId, isApproved, cardElement) {
    try {
        const msg = await approveOrRejectUser(userId, isApproved);
        showToast(msg, 'success'); // Corrigido para usar Toast
        cardElement.remove();
        loadDashboardStats(); 
    } catch (error) {
        showToast('Erro: ' + error.message, 'error'); // Corrigido para usar Toast
    }
}