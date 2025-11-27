import { 
    listUsersByStatus, 
    approveOrRejectUser, 
    cadastrarParcial, 
    listarInstituicoes, 
    updateUser, 
    getUserData 
} from '../services/apiService.js';

const currentUserCargo = localStorage.getItem('userCargo');
const userId = localStorage.getItem('userId');

let state = {
    allPending: [],
    allActive: [],
    allInactive: [],
    allInstitutions: [],
    userToDeactivate: null,
    myInstId: null,
    currentTab: 'pending'
};

export async function init() {
    setupTabs();
    await loadInstitutionsData();
    await loadMyInstitutionId();
    
    await Promise.all([
        loadPendingUsers(),
        loadActiveUsers(),
        loadInactiveUsers()
    ]);
    
    setupSearchListeners();
    setupInviteUserModalListeners(); 
    setupDeactivateModalListeners();
}

async function loadMyInstitutionId() {
    if (currentUserCargo === 'GESTOR_INSTITUICAO') {
        try {
            const me = await getUserData(userId);
            if (me.instituicao) state.myInstId = me.instituicao.id;
        } catch (e) {
            console.warn("Não foi possível carregar ID da instituição");
        }
    }
}

async function loadInstitutionsData() {
    try {
        const insts = await listarInstituicoes();
        state.allInstitutions = insts || [];
    } catch (e) { state.allInstitutions = []; }
}

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', e => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        
        const btn = e.currentTarget;
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        
        document.getElementById(`view-${tab}`).style.display = 'block';
        state.currentTab = tab;
    }));
}

async function loadPendingUsers() {
    try {
        const users = await listUsersByStatus({ status: 'PENDENTE', instituicaoId: state.myInstId });
        state.allPending = users;
        document.getElementById('badge-pending-count').textContent = state.allPending.length;
        renderPendingTable(state.allPending);
    } catch (e) { 
        document.getElementById('pending-table-body').innerHTML = '<tr><td colspan="6" style="text-align:center; color:red">Erro ao carregar.</td></tr>';
    }
}

async function loadActiveUsers() {
    try {
        const users = await listUsersByStatus({ status: 'ATIVO', instituicaoId: state.myInstId });
        state.allActive = users;
        document.getElementById('badge-active-count').textContent = state.allActive.length;
        renderActiveTable(state.allActive);
    } catch (e) { console.error(e); }
}

async function loadInactiveUsers() {
    try {
        const users = await listUsersByStatus({ status: 'INATIVO', instituicaoId: state.myInstId });
        state.allInactive = users;
        document.getElementById('badge-inactive-count').textContent = state.allInactive.length;
        renderInactiveTable(state.allInactive);
    } catch (e) { console.error(e); }
}

// =============================================================================
// RENDERIZAÇÃO DAS TABELAS (CORRIGIDO)
// =============================================================================

function renderActiveTable(users) {
    const tbody = document.getElementById('active-table-body');
    const emptyMsg = document.getElementById('active-empty-msg');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    if(!users || users.length === 0) {
        if(emptyMsg) emptyMsg.style.display = 'block';
        return;
    }
    if(emptyMsg) emptyMsg.style.display = 'none';

    const currentUserIdLocal = localStorage.getItem('userId');

    users.forEach(u => {
        const tr = document.createElement('tr');
        const role = getRoleDisplay(u.cargo);
        const inst = u.instituicaoNome || (u.cargo.includes('SECRETARIA') ? 'Interno' : '-');
        const isMe = u.id == currentUserIdLocal;

        let canDeactivate = true;
        if (isMe) canDeactivate = false;
        if (currentUserCargo === 'GESTOR_SECRETARIA' && u.cargo === 'SECRETARIA') canDeactivate = false;

        let actionBtn;
        if (isMe) {
            actionBtn = `<span style="font-size:0.8rem; color:#999;">(Você)</span>`;
        } else if (!canDeactivate) {
            actionBtn = `<span style="font-size:0.8rem; color:#ccc; cursor:not-allowed;" title="Ação não permitida"><i class="fas fa-ban"></i></span>`;
        } else {
            actionBtn = `<button class="btn btn-sm btn-outline-danger" onclick="window.openDeactivateModal(${u.id}, '${u.nome}')" title="Desativar"><i class="fas fa-user-slash"></i></button>`;
        }

        // Link Detalhes (Texto)
        const detailsLink = `<a href="javascript:void(0)" onclick="window.viewUserDetails(${u.id})" class="action-link" style="margin-right: 10px;">Detalhes</a>`;

        tr.innerHTML = `
            <td><strong>${u.nome}</strong></td>
            <td>${u.email}</td>
            <td><span class="tag" style="background:${role.bg}; color:${role.color}">${role.text}</span></td>
            <td>${inst}</td>
            <td><span class="status-badge status-ativo">Ativo</span></td>
            <td>
                <div class="table-actions" style="justify-content: center;">
                    ${detailsLink}
                    ${actionBtn}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPendingTable(users) {
    const tbody = document.getElementById('pending-table-body');
    const emptyMsg = document.getElementById('pending-empty-msg');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    if(!users || users.length === 0) {
        if(emptyMsg) emptyMsg.style.display = 'block';
        return;
    }
    if(emptyMsg) emptyMsg.style.display = 'none';

    users.forEach(u => {
        const role = getRoleDisplay(u.cargo);
        const inst = u.instituicaoNome || '-';
        const tr = document.createElement('tr');
        
        // Link Detalhes (Texto)
        const detailsLink = `<a href="javascript:void(0)" class="action-link action-details" style="margin-right: 10px;">Detalhes</a>`;

        tr.innerHTML = `
            <td><strong>${u.nome}</strong></td>
            <td>${u.email}</td>
            <td><span class="tag" style="background:${role.bg}; color:${role.color}">${role.text}</span></td>
            <td>${inst}</td>
            <td>${new Date(u.dataCadastro || Date.now()).toLocaleDateString()}</td>
            <td>
                <div class="table-actions" style="justify-content: center;">
                    ${detailsLink}
                    <button class="btn btn-sm btn-secondary action-reject" title="Rejeitar"><i class="fas fa-times"></i></button>
                    <button class="btn btn-sm btn-primary action-approve" title="Aprovar"><i class="fas fa-check"></i></button>
                </div>
            </td>
        `;
        
        tr.querySelector('.action-details').addEventListener('click', () => window.viewUserDetails(u.id));
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
    
    if(!users || users.length === 0) {
        if(emptyMsg) emptyMsg.style.display = 'block';
        return;
    }
    if(emptyMsg) emptyMsg.style.display = 'none';

    users.forEach(u => {
        const role = getRoleDisplay(u.cargo);
        let canReactivate = true;
        if (currentUserCargo === 'GESTOR_SECRETARIA' && u.cargo === 'SECRETARIA') canReactivate = false;

        let instInactive = false;
        if (u.instituicaoNome && u.instituicaoNome !== '-') {
            const instMatch = state.allInstitutions.find(i => i.nome === u.instituicaoNome);
            if (instMatch && instMatch.status === 'INATIVO') {
                instInactive = true;
                canReactivate = false;
            }
        }

        let actionBtn;
        if (instInactive) {
            actionBtn = `<span style="font-size:0.8rem; color:#d9534f; cursor:not-allowed;" title="Instituição Inativa"><i class="fas fa-ban"></i> Inst. Inativa</span>`;
        } else if (canReactivate) {
            actionBtn = `<button class="btn btn-sm btn-outline-success" onclick="window.reactivateUser(${u.id}, '${u.nome}')" title="Reativar"><i class="fas fa-user-check"></i></button>`;
        } else {
            actionBtn = `<span style="font-size:0.8rem; color:#ccc;"><i class="fas fa-ban"></i></span>`;
        }

        // Link Detalhes (Texto)
        const detailsLink = `<a href="javascript:void(0)" onclick="window.viewUserDetails(${u.id})" class="action-link" style="margin-right: 10px;">Detalhes</a>`;

        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><strong>${u.nome}</strong></td>
                <td>${u.email}</td>
                <td><span class="tag" style="background:${role.bg}; color:${role.color}">${role.text}</span></td>
                <td>${u.instituicaoNome || '-'}</td>
                <td><span class="status-badge status-inativo">Inativo</span></td>
                <td>
                    <div class="table-actions" style="justify-content: center;">
                        ${detailsLink}
                        ${actionBtn}
                    </div>
                </td>
            </tr>
        `);
    });
}

// FUNÇÃO GLOBAL PARA VER DETALHES
window.viewUserDetails = async function(id) {
    const modal = document.getElementById('modal-user-full-details');
    const body = document.getElementById('user-full-details-body');
    modal.classList.add('show');
    body.innerHTML = '<p style="text-align:center"><i class="fas fa-spinner fa-spin"></i> Carregando...</p>';
    
    try {
        const user = await getUserData(id);
        const inst = user.instituicaoNome || (user.instituicao ? user.instituicao.nome : 'N/A');
        const dataNasc = user.dataNascimento ? new Date(user.dataNascimento).toLocaleDateString() : '-';
        const dataCad = user.dataCadastro ? new Date(user.dataCadastro).toLocaleDateString() : '-';

        body.innerHTML = `
            <div class="form-grid-2">
                <div class="form-group"><label>Nome</label><input type="text" value="${user.nome}" disabled></div>
                <div class="form-group"><label>Cargo</label><input type="text" value="${user.cargo}" disabled></div>
                <div class="form-group"><label>E-mail</label><input type="text" value="${user.email}" disabled></div>
                <div class="form-group"><label>Telefone</label><input type="text" value="${user.telefone || '-'}" disabled></div>
                <div class="form-group"><label>CPF</label><input type="text" value="${user.cpf || '-'}" disabled></div>
                <div class="form-group"><label>Data Nasc.</label><input type="text" value="${dataNasc}" disabled></div>
                <div class="form-group"><label>Instituição</label><input type="text" value="${inst}" disabled></div>
                <div class="form-group"><label>Status</label><input type="text" value="${user.status}" disabled></div>
            </div>
            <div class="form-group" style="margin-top:15px"><label>Data Cadastro</label><input type="text" value="${dataCad}" disabled></div>
            <div class="form-group"><label>Justificativa</label><textarea rows="2" disabled>${user.justificativa || '-'}</textarea></div>
        `;
    } catch (e) {
        body.innerHTML = '<p class="is-error">Erro ao carregar dados do usuário.</p>';
    }
};

// ... (Resto do código: showConfirmModal, handleApproval, reactivateUser, setupInviteUserModalListeners, etc. mantido igual)

function showConfirmModal(title, message, onConfirm) {
    const existing = document.getElementById('dynamic-confirm-modal');
    if (existing) existing.remove();

    const modalHtml = `
    <div id="dynamic-confirm-modal" class="modal show" style="z-index: 9999;">
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-button" onclick="document.getElementById('dynamic-confirm-modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('dynamic-confirm-modal').remove()">Cancelar</button>
                <button class="btn btn-primary" id="dyn-confirm-btn">Confirmar</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const confirmBtn = document.getElementById('dyn-confirm-btn');
    confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Processando...';
        await onConfirm();
        const modal = document.getElementById('dynamic-confirm-modal');
        if(modal) modal.remove();
    });
}

async function handleApproval(userId, isApproved) {
    const action = isApproved ? 'Aprovar' : 'Rejeitar';
    const color = isApproved ? '#28a745' : '#dc3545';
    
    showConfirmModal(
        `<i class="fas fa-check-circle" style="color:${color}"></i> ${action} Usuário`,
        `Deseja realmente <strong>${action.toLowerCase()}</strong> este usuário?`,
        async () => {
            try {
                await approveOrRejectUser(userId, isApproved);
                showToast(`Usuário ${isApproved ? 'aprovado' : 'rejeitado'} com sucesso!`);
                await Promise.all([loadPendingUsers(), loadActiveUsers(), loadInactiveUsers()]);
            } catch(err) { showToast(err.message, 'error'); }
        }
    );
}

window.reactivateUser = async function(id, name) {
    showConfirmModal(
        '<i class="fas fa-user-check"></i> Reativar Usuário',
        `Deseja reativar o acesso de <strong>${name}</strong>?`,
        async () => {
            try {
                const userFull = await getUserData(id);
                if (userFull.instituicao && userFull.instituicao.status === 'INATIVO') {
                    showToast(`Não é possível ativar. A instituição <strong>${userFull.instituicao.nome}</strong> está INATIVA.`, 'error');
                    return; 
                }
                await updateUser(id, { status: 'ATIVO' });
                showToast('Usuário reativado com sucesso.');
                await Promise.all([loadActiveUsers(), loadInactiveUsers()]);
            } catch(e) { 
                showToast(e.message || 'Erro ao reativar usuário.', 'error'); 
            }
        }
    );
};

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
            
            // LÓGICA DE TRAVAMENTO DE INSTITUIÇÃO
            const userInstName = localStorage.getItem('userInstituicao');
            
            if (currentUserCargo === 'GESTOR_INSTITUICAO' || currentUserCargo === 'USUARIO_INSTITUICAO') {
                instGroup.style.display = 'block';
                instSelect.innerHTML = `<option value="${userInstName}" selected>${userInstName}</option>`;
                instSelect.disabled = true; 
                instSelect.setAttribute('data-locked-value', userInstName);
            } else {
                instSelect.disabled = false;
                instSelect.removeAttribute('data-locked-value');
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

            const instValue = instSelect.disabled ? instSelect.getAttribute('data-locked-value') : instSelect.value;

            const data = {
                nome: document.getElementById('invite-name').value,
                email: document.getElementById('invite-email').value,
                cargo: document.getElementById('invite-cargo').value,
                justificativa: document.getElementById('invite-justificativa').value || 'Convite Adm',
                instituicao: instValue
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

window.openDeactivateModal = function(id, name) {
    state.userToDeactivate = id;
    document.getElementById('deactivate-user-name').textContent = name;
    document.getElementById('modal-deactivate-user').classList.add('show');
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