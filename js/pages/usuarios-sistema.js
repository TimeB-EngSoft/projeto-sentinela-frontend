import { listUsersByStatus, approveOrRejectUser, cadastrarParcial, listarInstituicoes, updateUser } from '../services/apiService.js';

const currentUserCargo = localStorage.getItem('userCargo');
const currentUserInst = localStorage.getItem('userInstituicao'); 

let state = {
    allPending: [],
    allActive: [],
    allInactive: [],
    userToDeactivate: null
};

export async function init() {
    setupTabs();
    await Promise.all([loadPendingUsers(), loadActiveUsers(), loadInactiveUsers()]);
    setupSearchListeners();
    setupInviteUserModalListeners(); 
    setupDeactivateModalListeners();
}

// --- CARREGAMENTO ---
async function loadPendingUsers() {
    try {
        const users = await listUsersByStatus('PENDENTE');
        state.allPending = filterByHierarchy(users);
        const badge = document.getElementById('badge-pending-count');
        if(badge) badge.textContent = state.allPending.length;
        renderPendingTable(state.allPending);
    } catch (e) { console.error(e); }
}

async function loadActiveUsers() {
    try {
        const users = await listUsersByStatus('ATIVO');
        state.allActive = filterByHierarchy(users);
        const badge = document.getElementById('badge-active-count');
        if(badge) badge.textContent = state.allActive.length;
        renderActiveTable(state.allActive);
    } catch (e) { console.error(e); }
}

async function loadInactiveUsers() {
    try {
        const users = await listUsersByStatus('INATIVO');
        state.allInactive = filterByHierarchy(users);
        const badge = document.getElementById('badge-inactive-count');
        if(badge) badge.textContent = state.allInactive.length;
        renderInactiveTable(state.allInactive);
    } catch (e) { console.error(e); }
}

function filterByHierarchy(users) {
    if (!users) return [];
    if (currentUserCargo === 'GESTOR_INSTITUICAO') {
        const myInst = (currentUserInst || '').toLowerCase();
        return users.filter(u => (u.instituicaoNome || '').toLowerCase() === myInst);
    }
    return users; 
}

// --- RENDERIZAÇÃO COM PROTEÇÃO DE HIERARQUIA ---
function renderActiveTable(users) {
    const tbody = document.getElementById('active-table-body');
    const emptyMsg = document.getElementById('active-empty-msg');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    if(users.length === 0) {
        if(emptyMsg) emptyMsg.style.display = 'block';
        return;
    }
    if(emptyMsg) emptyMsg.style.display = 'none';

    const currentUserId = localStorage.getItem('userId');

    users.forEach(u => {
        const tr = document.createElement('tr');
        const role = getRoleDisplay(u.cargo);
        const inst = u.instituicaoNome || (u.cargo.includes('SECRETARIA') ? 'Interno' : '-');
        const isMe = u.id == currentUserId;

        // --- LÓGICA DE PROTEÇÃO ADICIONADA AQUI ---
        let canDeactivate = true;
        
        // 1. Ninguém pode desativar a si mesmo
        if (isMe) canDeactivate = false;

        // 2. Gestor Secretaria NÃO pode desativar Secretaria (Nível Superior)
        if (currentUserCargo === 'GESTOR_SECRETARIA' && u.cargo === 'SECRETARIA') {
            canDeactivate = false;
        }

        let actionBtn;
        if (isMe) {
            actionBtn = `<span style="font-size:0.8rem; color:#999;">(Você)</span>`;
        } else if (!canDeactivate) {
            // Mostra ícone de bloqueio ou nada se não tiver permissão
            actionBtn = `<span style="font-size:0.8rem; color:#ccc; cursor:not-allowed;" title="Ação não permitida pela hierarquia"><i class="fas fa-ban"></i></span>`;
        } else {
            actionBtn = `<button class="btn btn-sm btn-outline-danger" onclick="window.openDeactivateModal(${u.id}, '${u.nome}')" title="Desativar">
                           <i class="fas fa-user-slash"></i>
                         </button>`;
        }

        tr.innerHTML = `
            <td><strong>${u.nome}</strong></td>
            <td>${u.email}</td>
            <td><span class="tag" style="background:${role.bg}; color:${role.color}">${role.text}</span></td>
            <td>${inst}</td>
            <td><span class="status-badge status-ativo">Ativo</span></td>
            <td style="text-align: center;">${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPendingTable(users) {
    const tbody = document.getElementById('pending-table-body');
    const emptyMsg = document.getElementById('pending-empty-msg');
    if(!tbody) return;
    tbody.innerHTML = '';
    if(users.length === 0) {
        if(emptyMsg) emptyMsg.style.display = 'block';
        return;
    }
    if(emptyMsg) emptyMsg.style.display = 'none';

    users.forEach(u => {
        const role = getRoleDisplay(u.cargo);
        const inst = u.instituicaoNome || '-';
        const tr = document.createElement('tr');
        tr.dataset.userId = u.id;
        
        tr.innerHTML = `
            <td><strong>${u.nome}</strong></td>
            <td>${u.email}</td>
            <td><span class="tag" style="background:${role.bg}; color:${role.color}">${role.text}</span></td>
            <td>${inst}</td>
            <td>${new Date(u.dataCadastro || Date.now()).toLocaleDateString()}</td>
            <td class="table-actions">
                <button class="btn btn-sm btn-secondary action-reject" title="Rejeitar"><i class="fas fa-times"></i></button>
                <button class="btn btn-sm btn-primary action-approve" title="Aprovar"><i class="fas fa-check"></i></button>
            </td>
        `;
        
        // Listener direto no botão para evitar problemas de escopo global
        tr.querySelector('.action-approve').addEventListener('click', () => handleApproval(u.id, true));
        tr.querySelector('.action-reject').addEventListener('click', () => handleApproval(u.id, false));
        
        tbody.appendChild(tr);
    });
}

function renderInactiveTable(users) {
    const tbody = document.getElementById('inactive-table-body');
    const emptyMsg = document.getElementById('inactive-empty-msg');
    if(!tbody) return;
    tbody.innerHTML = '';
    if(users.length === 0) {
        if(emptyMsg) emptyMsg.style.display = 'block';
        return;
    }
    if(emptyMsg) emptyMsg.style.display = 'none';

    users.forEach(u => {
        const role = getRoleDisplay(u.cargo);
        // Proteção também na reativação (opcional, mas consistente)
        let canReactivate = true;
        if (currentUserCargo === 'GESTOR_SECRETARIA' && u.cargo === 'SECRETARIA') canReactivate = false;

        const actionBtn = canReactivate 
            ? `<button class="btn btn-sm btn-outline-success" onclick="window.reactivateUser(${u.id}, '${u.nome}')"><i class="fas fa-user-check"></i></button>`
            : `<span style="font-size:0.8rem; color:#ccc;"><i class="fas fa-ban"></i></span>`;

        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><strong>${u.nome}</strong></td>
                <td>${u.email}</td>
                <td><span class="tag" style="background:${role.bg}; color:${role.color}">${role.text}</span></td>
                <td>${u.instituicaoNome || '-'}</td>
                <td><span class="status-badge status-inativo">Inativo</span></td>
                <td style="text-align: center;">${actionBtn}</td>
            </tr>
        `);
    });
}

// --- MODAIS E AÇÕES ---

async function handleApproval(userId, isApproved) {
    const action = isApproved ? 'Aprovar' : 'Rejeitar';
    if(!confirm(`Deseja realmente ${action.toLowerCase()} este usuário?`)) return;
    try {
        await approveOrRejectUser(userId, isApproved);
        showToast(`Usuário ${isApproved ? 'aprovado' : 'rejeitado'} com sucesso!`);
        // Recarrega as listas
        loadPendingUsers();
        if(isApproved) loadActiveUsers();
        else loadInactiveUsers();
    } catch(err) { showToast(err.message, 'error'); }
}

function setupInviteUserModalListeners() {
    const modal = document.getElementById('invite-user-modal');
    const btnOpen = document.getElementById('inviteUserButton');
    const form = document.getElementById('invite-form');
    const btnClose = document.getElementById('modal-close-button');
    const btnCancel = document.getElementById('modal-cancel-button');
    const cargoSelect = document.getElementById('invite-cargo');
    const instGroup = document.getElementById('invite-instituicao-group');
    const instSelect = document.getElementById('invite-instituicao-select');

    if(!modal) return;

    if (btnOpen) {
        const newBtn = btnOpen.cloneNode(true);
        btnOpen.parentNode.replaceChild(newBtn, btnOpen);
        newBtn.addEventListener('click', async () => {
            modal.classList.add('show');
            if(instSelect.options.length <= 1) {
                try {
                    const insts = await listarInstituicoes();
                    instSelect.innerHTML = '<option value="">Selecione...</option>';
                    insts.forEach(i => {
                        const opt = document.createElement('option');
                        opt.value = i.nome; 
                        opt.textContent = i.nome;
                        instSelect.appendChild(opt);
                    });
                } catch(e) {}
            }
        });
    }

    const closeModal = () => modal.classList.remove('show');
    if(btnClose) btnClose.addEventListener('click', closeModal);
    if(btnCancel) btnCancel.addEventListener('click', closeModal);

    if(cargoSelect) {
        cargoSelect.addEventListener('change', () => {
            const val = cargoSelect.value;
            if(val === 'GESTOR_INSTITUICAO' || val === 'USUARIO_INSTITUICAO') {
                instGroup.style.display = 'block';
                instSelect.required = true;
            } else {
                instGroup.style.display = 'none';
                instSelect.required = false;
            }
        });
    }

    if(form) {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('modal-submit-button');
            btn.disabled = true; btn.textContent = 'Enviando...';

            const data = {
                nome: document.getElementById('invite-name').value,
                email: document.getElementById('invite-email').value,
                cargo: document.getElementById('invite-cargo').value,
                justificativa: document.getElementById('invite-justificativa').value || 'Convite Adm',
                instituicao: instSelect.value
            };

            try {
                await cadastrarParcial(data);
                showToast('Convite enviado! Usuário está na lista Pendente.');
                closeModal();
                newForm.reset();
                loadPendingUsers();
            } catch(err) { showToast(err.message, 'error'); }
            finally { btn.disabled = false; btn.textContent = 'Enviar Convite'; }
        });
    }
}

window.openDeactivateModal = function(id, name) {
    state.userToDeactivate = id;
    document.getElementById('deactivate-user-name').textContent = name;
    document.getElementById('modal-deactivate-user').classList.add('show');
};

window.reactivateUser = async function(id, name) {
    if(confirm(`Reativar ${name}?`)) {
        try {
            await updateUser(id, { status: 'ATIVO' });
            showToast('Reativado com sucesso.');
            loadActiveUsers();
            loadInactiveUsers();
        } catch(e) { showToast(e.message, 'error'); }
    }
};

function setupDeactivateModalListeners() {
    const modal = document.getElementById('modal-deactivate-user');
    const btnConfirm = document.getElementById('modal-deactivate-confirm');
    const closeModal = () => modal.classList.remove('show');
    
    document.getElementById('modal-deactivate-close').addEventListener('click', closeModal);
    document.getElementById('modal-deactivate-cancel').addEventListener('click', closeModal);
    
    const newBtn = btnConfirm.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newBtn, btnConfirm);
    
    newBtn.addEventListener('click', async () => {
        if(!state.userToDeactivate) return;
        try {
            await updateUser(state.userToDeactivate, { status: 'INATIVO' });
            showToast('Usuário desativado.');
            closeModal();
            loadActiveUsers();
            loadInactiveUsers();
        } catch(e) { showToast(e.message, 'error'); }
    });
}

function showToast(msg, type='success') {
    const c = document.getElementById('toast-container');
    if(!c) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<div class="toast-content"><span class="toast-message">${msg}</span></div>`;
    c.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(()=>t.remove(),300); }, 3000);
}

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', e => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        e.currentTarget.classList.add('active');
        document.getElementById(`view-${e.currentTarget.dataset.tab}`).style.display = 'block';
        state.currentTab = e.currentTarget.dataset.tab;
    }));
}

function setupSearchListeners() {
    const input = document.getElementById('searchInput');
    if(!input) return;
    const newInp = input.cloneNode(true);
    input.parentNode.replaceChild(newInp, input);
    
    newInp.addEventListener('keyup', (e) => {
        const term = e.target.value.toLowerCase();
        const filterFn = u => u.nome.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
        if(state.currentTab === 'pending') renderPendingTable(state.allPending.filter(filterFn));
        else if(state.currentTab === 'active') renderActiveTable(state.allActive.filter(filterFn));
        else renderInactiveTable(state.allInactive.filter(filterFn));
    });
}

function getRoleDisplay(cargo) {
    switch(cargo) {
        case 'GESTOR_SECRETARIA': return { text: 'Gestor Sec.', bg: '#fceeee', color: '#d9534f' };
        case 'USUARIO_SECRETARIA': return { text: 'Secretaria', bg: '#fef8e5', color: '#f0ad4e' };
        case 'GESTOR_INSTITUICAO': return { text: 'Gestor Inst.', bg: '#e6f7ec', color: '#0d8a4f' };
        default: return { text: cargo ? cargo.replace(/_/g,' ') : '?', bg: '#eee', color: '#333' };
    }
}