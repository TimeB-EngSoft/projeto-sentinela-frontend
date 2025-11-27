import { listUsersByStatus, getUserData, updateUser, cadastrarParcial, listarInstituicoes } from '../services/apiService.js';

let allManagers = [];
let cachedInstitutions = null;
let managerToDeactivate = null;

export async function init() {
    allManagers = [];
    await loadAllManagers();
    setupAddManagerModal();
    setupDetailsModal();
    setupSearchFilter();
    setupDeactivateModal();
}

// --- TOAST ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    toast.innerHTML = `<i class="fas fa-${icon}"></i><div class="toast-content"><span class="toast-title">${type === 'success' ? 'Sucesso' : 'Erro'}</span><span class="toast-message">${message}</span></div>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3500);
}

// --- CARREGAMENTO ---
async function loadAllManagers() {
    const tableBody = document.getElementById('managers-table-body');
    if(!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Carregando...</td></tr>';

    try {
        // [OTIMIZAÇÃO] Pede apenas gestores ao backend
        // filtroEspecial='GESTORES' foi criado no Repository no passo 1.1
        const [active, pending, inactive] = await Promise.all([
            listUsersByStatus({ status: 'ATIVO', filtroEspecial: 'GESTORES' }),
            listUsersByStatus({ status: 'PENDENTE', filtroEspecial: 'GESTORES' }),
            listUsersByStatus({ status: 'INATIVO', filtroEspecial: 'GESTORES' })
        ]);

        // Não precisa mais de .filter() pesado no front
        allManagers = [...active, ...pending, ...inactive];
        
        renderManagersTable(allManagers);
        updateStatsCards(active, pending, inactive);
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="8" style="color: red;">Erro: ${error.message}</td></tr>`;
    }
}

async function fetchUsersSafely(status) {
    try { return await listUsersByStatus(status); } catch (e) { return []; }
}

function renderManagersTable(managers) {
    const tbody = document.getElementById('managers-table-body');
    if(!tbody) return;
    tbody.innerHTML = '';

    if (managers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Nenhum gestor encontrado.</td></tr>';
        return;
    }

    managers.forEach(user => {
        const row = document.createElement('tr');
        const statusClass = user.status === 'ATIVO' ? 'status-ativo' : (user.status === 'PENDENTE' ? 'status-pendente' : 'status-inativo');
        const instName = user.instituicaoNome || (user.cargo === 'GESTOR_SECRETARIA' ? 'Secretaria' : '-');

        // Botão de ação depende do status
        let actionBtn;
        if (user.status === 'ATIVO') {
            actionBtn = `<button class="btn btn-sm btn-outline-danger" onclick="openDeactivateManager(${user.id}, '${user.nome}')" title="Desativar"><i class="fas fa-user-slash"></i></button>`;
        } else if (user.status === 'INATIVO') {
            actionBtn = `<button class="btn btn-sm btn-outline-success" onclick="reactivateManager(${user.id}, '${user.nome}')" title="Reativar"><i class="fas fa-user-check"></i></button>`;
        } else {
            actionBtn = '<small>Pendente</small>';
        }

        row.innerHTML = `
            <td>${user.nome}</td>
            <td>${user.email}</td>
            <td>${formatCargo(user.cargo)}</td>
            <td>${instName}</td>
            <td><span class="status-badge ${statusClass}">${user.status}</span></td>
            <td><div class="table-actions">
                <a href="#" data-action="details" data-user-id="${user.id}">Detalhes</a>
                ${actionBtn}
            </div></td>
        `;
        tbody.appendChild(row);
    });
}

// --- AÇÕES ---
window.openDeactivateManager = function(id, name) {
    const modal = document.getElementById('modal-deactivate-manager');
    managerToDeactivate = id;
    document.getElementById('deactivate-manager-name').textContent = name;
    modal.classList.add('show');
};

window.reactivateManager = async function(id, name) {
    if(confirm(`Reativar o gestor ${name}?`)) { // Reativação pode ser confirmação simples
        try {
            await updateUser(id, { status: 'ATIVO' });
            showToast('Gestor reativado com sucesso!');
            loadAllManagers();
        } catch (e) { showToast(e.message, 'error'); }
    }
};

function setupDeactivateModal() {
    const modal = document.getElementById('modal-deactivate-manager');
    if(!modal) return;
    const btnConfirm = document.getElementById('modal-deactivate-confirm');
    const close = () => { modal.classList.remove('show'); managerToDeactivate = null; };

    document.getElementById('modal-deactivate-close').addEventListener('click', close);
    document.getElementById('modal-deactivate-cancel').addEventListener('click', close);

    // Clonar para limpar listeners
    const newBtn = btnConfirm.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newBtn, btnConfirm);

    newBtn.addEventListener('click', async () => {
        if(!managerToDeactivate) return;
        newBtn.disabled = true; newBtn.textContent = 'Desativando...';
        try {
            await updateUser(managerToDeactivate, { status: 'INATIVO' });
            showToast('Gestor desativado com sucesso!');
            close();
            loadAllManagers();
        } catch(e) { showToast(e.message, 'error'); }
        finally { newBtn.disabled = false; newBtn.textContent = 'Sim, Desativar'; }
    });
}

// --- OUTRAS FUNÇÕES ---
function updateStatsCards(active, pending, inactive) {
    const setTxt = (id, txt) => { const el = document.getElementById(id); if(el) el.textContent = txt; };
    // Filtra apenas gestores para as stats
    const filterG = u => u.cargo.includes('GESTOR');
    
    const activeG = active.filter(filterG);
    const pendingG = pending.filter(filterG);
    const inactiveG = inactive.filter(filterG);
    
    setTxt('stat-total-gestores', activeG.length + pendingG.length + inactiveG.length);
    setTxt('stat-gestores-ativos', activeG.length);
    setTxt('stat-gestores-pendentes', pendingG.length);
    setTxt('stat-gestores-inativos', inactiveG.length);
}

function setupSearchFilter() {
    const input = document.getElementById('manager-search-input');
    if(input) {
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        newInput.addEventListener('keyup', () => {
            const term = newInput.value.toLowerCase();
            renderManagersTable(allManagers.filter(u => u.nome.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)));
        });
    }
}

function setupAddManagerModal() {
    const modal = document.getElementById('modal-add-manager');
    const btnOpen = document.getElementById('addManagerButton');
    const form = document.getElementById('form-add-manager');
    const cargoSelect = document.getElementById('add-cargo');
    
    if(btnOpen) {
        const newBtn = btnOpen.cloneNode(true);
        btnOpen.parentNode.replaceChild(newBtn, btnOpen);
        newBtn.addEventListener('click', () => {
            modal.classList.add('show');
            populateInstitutionsDropdown();
        });
    }

    const closeModal = () => modal.classList.remove('show');
    modal.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', closeModal));

    if(cargoSelect) {
        cargoSelect.addEventListener('change', () => {
            const group = document.getElementById('add-instituicao-group');
            if(group) group.style.display = cargoSelect.value === 'GESTOR_INSTITUICAO' ? 'block' : 'none';
        });
    }

    if(form) {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        // Botão Cancelar do form
        newForm.querySelector('.btn-secondary').addEventListener('click', closeModal);

        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = newForm.querySelector('button[type="submit"]');
            btn.disabled = true; btn.textContent = 'Enviando...';
            
            // Dados (adapte para usar cadastrarParcial se for o fluxo correto)
            const data = {
                nome: document.getElementById('add-nome').value,
                email: document.getElementById('add-email').value,
                cargo: document.getElementById('add-cargo').value,
                instituicao: null,
                justificativa: 'Cadastro pelo painel administrativo'
            };

            if (data.cargo === 'GESTOR_INSTITUICAO') {
                const sel = document.getElementById('add-instituicao-select');
                data.instituicao = sel.options[sel.selectedIndex].text;
            } else {
                data.instituicao = 'Secretaria';
            }

            try {
                await cadastrarParcial(data);
                showToast('Convite enviado com sucesso!');
                closeModal();
                loadAllManagers();
            } catch(err) { showToast(err.message, 'error'); }
            finally { btn.disabled = false; btn.textContent = 'Enviar Convite'; }
        });
    }
}

async function populateInstitutionsDropdown() {
    const select = document.getElementById('add-instituicao-select');
    if(cachedInstitutions) { renderOpts(select, cachedInstitutions); return; }
    try {
        cachedInstitutions = await listarInstituicoes();
        renderOpts(select, cachedInstitutions);
    } catch(e) {}
}

function renderOpts(select, list) {
    select.innerHTML = '<option value="">Selecione...</option>';
    list.forEach(i => {
        const opt = document.createElement('option');
        opt.value = i.id; opt.textContent = i.nome;
        select.appendChild(opt);
    });
}

function setupDetailsModal() {
    const tbody = document.getElementById('managers-table-body');
    if(tbody) {
        tbody.addEventListener('click', async e => {
            if(e.target.closest('[data-action="details"]')) {
                e.preventDefault();
                const id = e.target.closest('a').dataset.userId;
                handleViewDetails(id);
            }
        });
    }
    const modal = document.getElementById('modal-manager-details');
    if(modal) modal.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => modal.classList.remove('show')));
}

async function handleViewDetails(id) {
    const modal = document.getElementById('modal-manager-details');
    const body = document.getElementById('detail-modal-body');
    modal.classList.add('show');
    body.innerHTML = 'Carregando...';
    try {
        const user = await getUserData(id);
        body.innerHTML = `
            <p><strong>Nome:</strong> ${user.nome}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Telefone:</strong> ${user.telefone || '-'}</p>
            <p><strong>Cargo:</strong> ${formatCargo(user.cargo)}</p>
        `;
    } catch(e) { body.innerHTML = 'Erro ao carregar.'; }
}

function formatCargo(cargo) {
    return cargo ? cargo.replace(/_/g, ' ') : '';
}