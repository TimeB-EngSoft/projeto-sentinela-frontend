import { listUsersByStatus, updateUser } from '../services/apiService.js';

let allTeamMembers = [];
let gridContainer = null;
let memberActionTarget = null; 

const currentUserId = localStorage.getItem('userId');
const currentUserCargo = localStorage.getItem('userCargo');
const currentUserInst = localStorage.getItem('userInstituicao');

export async function init() {
    gridContainer = document.getElementById('team-grid-container');
    if(gridContainer) gridContainer.innerHTML = '';

    await loadTeamMembers();
    setupTeamSearch();
    setupConfirmationModal();
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    toast.innerHTML = `<i class="fas fa-${icon}"></i><div class="toast-content"><span class="toast-title">${type === 'success' ? 'Sucesso' : 'Atenção'}</span><span class="toast-message">${message}</span></div>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3500);
}

async function loadTeamMembers() {
    if (!gridContainer) return;
    gridContainer.innerHTML = '<p class="col-span-full text-center">Carregando equipe...</p>';

    try {
        const [activeUsers, inactiveUsers] = await Promise.all([
            fetchUsersSafely('ATIVO'),
            fetchUsersSafely('INATIVO')
        ]);
        let rawList = [...activeUsers, ...inactiveUsers];

        if (['SECRETARIA', 'GESTOR_SECRETARIA', 'USUARIO_SECRETARIA'].includes(currentUserCargo)) {
            allTeamMembers = rawList.filter(u => ['SECRETARIA', 'GESTOR_SECRETARIA', 'USUARIO_SECRETARIA'].includes(u.cargo));
        } else if (['GESTOR_INSTITUICAO', 'USUARIO_INSTITUICAO'].includes(currentUserCargo)) {
            allTeamMembers = rawList.filter(u => u.instituicaoNome === currentUserInst);
        } else {
            allTeamMembers = rawList;
        }

        updateStats(allTeamMembers);
        renderTeamCards(allTeamMembers);

    } catch(e) {
        gridContainer.innerHTML = '<p class="is-error" style="grid-column: 1/-1; text-align: center;">Erro ao carregar equipe.</p>';
    }
}

async function fetchUsersSafely(status) {
    try { return await listUsersByStatus(status); } catch (e) { return []; }
}

function updateStats(users) {
    const total = users.length;
    const active = users.filter(u => u.status === 'ATIVO').length;
    const inactive = total - active;
    if(document.getElementById('stat-total')) document.getElementById('stat-total').textContent = total;
    if(document.getElementById('stat-active')) document.getElementById('stat-active').textContent = active;
    if(document.getElementById('stat-inactive')) document.getElementById('stat-inactive').textContent = inactive;
}

function renderTeamCards(list) {
    if(!gridContainer) return;
    gridContainer.innerHTML = ''; 

    if (list.length === 0) {
        gridContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Nenhum membro encontrado.</p>';
        return;
    }

    list.forEach(u => {
        const isMe = (u.id == currentUserId); 
        const isActive = u.status === 'ATIVO';
        const initials = (u.nome || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
        
        let canEdit = !isMe && (currentUserCargo.includes('GESTOR') || currentUserCargo === 'SECRETARIA');

        // --- LÓGICA DE PROTEÇÃO DE HIERARQUIA ---
        // Gestor Secretaria não pode editar/desativar Secretaria
        if (currentUserCargo === 'GESTOR_SECRETARIA' && u.cargo === 'SECRETARIA') {
            canEdit = false;
        }
        // ----------------------------------------

        let actionButton = '';

        if (canEdit) {
            if (isActive) {
                actionButton = `<button class="btn btn-outline-danger btn-sm w-100" onclick="triggerMemberAction(${u.id}, '${u.nome}', 'INATIVO')">
                                    <i class="fas fa-user-slash"></i> Desativar
                                </button>`;
            } else {
                actionButton = `<button class="btn btn-outline-success btn-sm w-100" onclick="triggerMemberAction(${u.id}, '${u.nome}', 'ATIVO')">
                                    <i class="fas fa-user-check"></i> Reativar
                                </button>`;
            }
        } else if (isMe) {
             actionButton = `<button class="btn btn-secondary btn-sm w-100" disabled>Você</button>`;
        } else {
             // Se não pode editar, apenas mostra o status
             const badgeColor = isActive ? 'status-ativo' : 'status-inativo';
             const icon = !canEdit && !isMe ? '<i class="fas fa-lock" style="margin-left:5px; font-size:0.7rem;"></i>' : '';
             actionButton = `<span class="status-badge ${badgeColor}" style="display:block; width:100%; text-align:center;">${u.status} ${icon}</span>`;
        }

        const card = document.createElement('div');
        card.className = 'team-card';
        card.innerHTML = `
            <div class="team-card__header">
                <div class="team-card__avatar" style="background-color: ${isActive ? '#e6f7ec' : '#fceeee'}; color: ${isActive ? '#0d8a4f' : '#d9534f'};">
                    ${initials}
                </div>
                <span class="team-card__status ${isActive ? 'status-active' : 'status-inactive'}">
                    ${u.status}
                </span>
            </div>
            <div class="team-card__body">
                <h4>${u.nome}</h4>
                <span class="role">${formatCargo(u.cargo)}</span>
                <div class="contact-info">
                    <div><i class="fas fa-envelope"></i> <span style="font-size: 0.85rem;">${u.email}</span></div>
                    <div><i class="fas fa-phone"></i> <span>${u.telefone || '-'}</span></div>
                </div>
            </div>
            <div class="team-card__footer">
                ${actionButton}
            </div>
        `;
        gridContainer.appendChild(card);
    });
}

// --- MODAIS ---
window.triggerMemberAction = function(id, name, action) {
    memberActionTarget = { id, name, action };
    const modal = document.getElementById('modal-confirm-member-action');
    const title = document.getElementById('confirm-modal-title');
    const msg = document.getElementById('confirm-modal-msg');
    const btn = document.getElementById('btn-confirm-action');
    
    if(action === 'INATIVO') {
        title.innerHTML = '<i class="fas fa-user-slash" style="color:#dc3545"></i> Desativar Membro';
        msg.textContent = `Tem certeza que deseja desativar ${name}? Ele perderá acesso ao sistema.`;
        btn.className = 'btn btn-danger';
        btn.textContent = 'Sim, Desativar';
    } else {
        title.innerHTML = '<i class="fas fa-user-check" style="color:#28a745"></i> Reativar Membro';
        msg.textContent = `Deseja reativar o acesso de ${name}?`;
        btn.className = 'btn btn-success';
        btn.textContent = 'Sim, Reativar';
    }
    
    modal.classList.add('show');
};

function setupConfirmationModal() {
    const modal = document.getElementById('modal-confirm-member-action');
    if(!modal) return;

    const close = () => modal.classList.remove('show');
    document.getElementById('btn-cancel-action').addEventListener('click', close);
    document.getElementById('close-confirm-modal').addEventListener('click', close);

    const btnConfirm = document.getElementById('btn-confirm-action');
    // Clone para limpar listeners
    const newBtn = btnConfirm.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newBtn, btnConfirm);

    newBtn.addEventListener('click', async () => {
        if(!memberActionTarget) return;
        
        try {
            await updateUser(memberActionTarget.id, { status: memberActionTarget.action });
            showToast(`Usuário ${memberActionTarget.action === 'ATIVO' ? 'reativado' : 'desativado'} com sucesso!`);
            close();
            loadTeamMembers();
        } catch(e) {
            showToast(e.message, 'error');
        }
    });
}

function formatCargo(cargo) {
    return cargo ? cargo.replace(/_/g, ' ') : 'Cargo não definido';
}

function setupTeamSearch() {
    const input = document.querySelector('.team-overview .search-bar input');
    if(input) {
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        newInput.addEventListener('keyup', (e) => {
            const term = e.target.value.toLowerCase();
            renderTeamCards(allTeamMembers.filter(u => u.nome.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)));
        });
    }
}