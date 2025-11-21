import { listarInstituicoes, cadastrarInstituicao, listarUsuariosPorInstituicao, atualizarInstituicao, getUserData } from '../services/apiService.js';

let allInstitutions = [];
let container = null;
let currentInstitutionId = null; 

export async function init() {
    container = document.getElementById('institutionsContainer');
    await loadInstitutions();
    setupModalListeners();
    setupDetailsModalListeners();
    setupInstitutionSearch();
    setupDeactivateModal();
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    toast.innerHTML = `<i class="fas fa-${icon}"></i><div class="toast-content"><span class="toast-title">${type === 'success' ? 'Sucesso' : 'Aviso'}</span><span class="toast-message">${message}</span></div>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3500);
}

// =========================================================================
// CARREGAMENTO E LISTAGEM
// =========================================================================

async function loadInstitutions() {
    const feedback = document.getElementById('institutionsFeedback');
    if (!container) return;
    
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Carregando...</p>';
    if(feedback) feedback.style.display = 'none';

    try {
        allInstitutions = await listarInstituicoes();
        renderInstitutions(allInstitutions);
    } catch (error) {
        container.innerHTML = '<p class="is-error" style="grid-column: 1/-1; text-align: center;">Erro ao carregar instituições.</p>';
    }
}

function renderInstitutions(list) {
    const feedback = document.getElementById('institutionsFeedback');
    if (!container) return;
    container.innerHTML = '';
    
    if (!list || list.length === 0) {
        if(feedback) feedback.style.display = 'block';
        return;
    }
    if(feedback) feedback.style.display = 'none';

    list.forEach(inst => {
        const statusClass = inst.status === 'ATIVO' ? 'status-ativo' : (inst.status === 'INATIVO' ? 'status-inativo' : 'status-pendente');
        
        const div = document.createElement('div');
        div.className = 'institution-card'; 
        div.innerHTML = `
            <div class="inst-card-header">
                <div class="inst-card-title">
                    <h3>${inst.nome}</h3>
                    <p>${inst.sigla || ''}</p>
                </div>
                <div class="inst-card-icon"><i class="fas fa-building"></i></div>
            </div>
            <div class="inst-card-body">
                <div class="inst-info-row"><i class="fas fa-envelope"></i> ${inst.email || '-'}</div>
                <div class="inst-info-row"><i class="fas fa-map-marker-alt"></i> ${inst.areaAtuacao || 'Área não inf.'}</div>
                <div class="inst-info-row" style="margin-top:10px;">
                    <span class="status-badge ${statusClass}">${inst.status}</span>
                </div>
            </div>
            <div class="inst-card-footer">
                <button class="btn btn-secondary btn-sm w-100" data-action="details" data-id="${inst.id}">
                    <i class="fas fa-eye"></i> Ver Detalhes
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

function setupInstitutionSearch() {
    const input = document.getElementById('institution-search-input');
    if(input) {
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        
        newInput.addEventListener('keyup', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allInstitutions.filter(i => {
                const matchNome = i.nome && i.nome.toLowerCase().includes(term);
                const matchSigla = i.sigla && i.sigla.toLowerCase().includes(term);
                const matchArea = i.areaAtuacao && i.areaAtuacao.toLowerCase().includes(term);
                return matchNome || matchSigla || matchArea;
            });
            renderInstitutions(filtered);
        });
    }
}

// =========================================================================
// MODAL DE DETALHES E AÇÕES (ATIVAR/DESATIVAR)
// =========================================================================

function setupDetailsModalListeners() {
    const modal = document.getElementById('modal-institution-details');
    const userOverlay = document.getElementById('modal-user-details-overlay');

    if (container) {
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action="details"]');
            if (btn) {
                const id = btn.dataset.id;
                openInstitutionDetails(id);
            }
        });
    }

    // Botão de Alternar Status (Ativar/Desativar)
    const btnToggleStatus = document.getElementById('btn-toggle-status-inst');
    if(btnToggleStatus) {
        const newBtn = btnToggleStatus.cloneNode(true);
        btnToggleStatus.parentNode.replaceChild(newBtn, btnToggleStatus);

        newBtn.addEventListener('click', async () => {
            const nextStatus = newBtn.dataset.nextStatus;
            
            if (nextStatus === 'INATIVO') {
                // Abrir modal de confirmação para desativar
                openDeactivateModal(currentInstitutionId);
            } else {
                // Reativar direto (ou com confirm simples)
                if(confirm("Deseja reativar esta instituição?")) {
                    try {
                        await atualizarInstituicao(currentInstitutionId, { status: 'ATIVO' });
                        showToast("Instituição reativada com sucesso.");
                        document.getElementById('modal-institution-details').classList.remove('show');
                        loadInstitutions();
                    } catch(e) { showToast(e.message, 'error'); }
                }
            }
        });
    }

    const closeMain = () => modal.classList.remove('show');
    const closeUser = () => userOverlay.classList.remove('show');

    document.getElementById('modal-detail-close').addEventListener('click', closeMain);
    document.getElementById('modal-detail-close-btn').addEventListener('click', closeMain);
    document.getElementById('modal-user-close').addEventListener('click', closeUser);
    document.getElementById('modal-user-close-btn').addEventListener('click', closeUser);
}

function openDeactivateModal(id) {
    const inst = allInstitutions.find(i => i.id == id);
    if(!inst) return;
    
    document.getElementById('deactivate-inst-name').textContent = inst.nome;
    document.getElementById('modal-deactivate-inst').classList.add('show');
}

function setupDeactivateModal() {
    const modal = document.getElementById('modal-deactivate-inst');
    const btnConfirm = document.getElementById('modal-deact-inst-confirm');
    const close = () => modal.classList.remove('show');

    document.getElementById('modal-deact-inst-close').addEventListener('click', close);
    document.getElementById('modal-deact-inst-cancel').addEventListener('click', close);

    const newBtn = btnConfirm.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newBtn, btnConfirm);

    newBtn.addEventListener('click', async () => {
        if(!currentInstitutionId) return;
        newBtn.disabled = true; newBtn.textContent = 'Processando...';
        try {
            await atualizarInstituicao(currentInstitutionId, { status: 'INATIVO' });
            showToast("Instituição desativada com sucesso.");
            close();
            document.getElementById('modal-institution-details').classList.remove('show');
            loadInstitutions();
        } catch(e) { showToast(e.message, 'error'); }
        finally { newBtn.disabled = false; newBtn.textContent = 'Sim, Desativar'; }
    });
}

async function openInstitutionDetails(id) {
    const modal = document.getElementById('modal-institution-details');
    currentInstitutionId = id;

    const inst = allInstitutions.find(i => i.id == id);
    if(!inst) return;

    // Preenche dados básicos
    document.getElementById('detail-inst-title').textContent = inst.nome;
    document.getElementById('detail-inst-sigla').textContent = inst.sigla || '';
    document.getElementById('detail-inst-cnpj').textContent = inst.cnpj || '-';
    document.getElementById('detail-inst-email').textContent = inst.email || '-';
    document.getElementById('detail-inst-phone').textContent = inst.telefone || '-';
    document.getElementById('detail-inst-area').textContent = inst.areaAtuacao || '-';
    document.getElementById('detail-inst-desc').textContent = inst.descricao || 'Sem descrição.';
    
    const statusBadge = document.getElementById('detail-inst-status');
    statusBadge.className = `status-badge ${inst.status === 'ATIVO' ? 'status-ativo' : 'status-inativo'}`;
    statusBadge.textContent = inst.status;

    // Configura o botão de ação baseado no status atual
    const btnToggle = document.getElementById('btn-toggle-status-inst');
    if (inst.status === 'INATIVO') {
        btnToggle.className = 'btn btn-success';
        btnToggle.innerHTML = '<i class="fas fa-check-circle"></i> Reativar Instituição';
        btnToggle.dataset.nextStatus = 'ATIVO';
    } else {
        btnToggle.className = 'btn btn-danger';
        btnToggle.innerHTML = '<i class="fas fa-ban"></i> Desativar Instituição';
        btnToggle.dataset.nextStatus = 'INATIVO';
    }

    // Carrega usuários
    const tbody = document.getElementById('detail-inst-users-body');
    const noUsersMsg = document.getElementById('detail-inst-no-users');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Carregando usuários...</td></tr>';
    noUsersMsg.style.display = 'none';

    modal.classList.add('show');

    try {
        const users = await listarUsuariosPorInstituicao(id, 'all');
        tbody.innerHTML = '';

        if (users && users.length > 0) {
            users.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${u.nome}</td>
                    <td>${u.cargo ? u.cargo.replace(/_/g, ' ') : ''}</td>
                    <td><span class="status-badge ${u.status === 'ATIVO' ? 'status-ativo' : 'status-pendente'}" style="font-size:0.7rem; padding:2px 6px;">${u.status}</span></td>
                    <td><button class="btn-icon-small"><i class="fas fa-user-circle"></i></button></td>
                `;
                tr.querySelector('button').addEventListener('click', () => openUserDetails(u.id));
                tbody.appendChild(tr);
            });
        } else {
            noUsersMsg.style.display = 'block';
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="4" style="color:red; text-align:center">Erro ao carregar usuários.</td></tr>';
    }
}

async function openUserDetails(userId) {
    const overlay = document.getElementById('modal-user-details-overlay');
    const body = document.getElementById('user-overlay-body');
    
    // Adiciona a classe show. Graças ao z-index: 3000 no CSS, ele aparecerá na frente.
    overlay.classList.add('show'); 
    body.innerHTML = '<p style="text-align:center">Carregando...</p>';

    try {
        const user = await getUserData(userId);
        body.innerHTML = `
            <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 20px;">
                <div class="avatar-placeholder" style="width: 60px; height: 60px; font-size: 1.5rem; border-radius: 50%;">
                    <i class="fas fa-user"></i>
                </div>
                <div>
                    <h4 style="margin:0;">${user.nome}</h4>
                    <span class="tag tag-neutral">${user.cargo}</span>
                </div>
            </div>
            <div class="form-grid-2">
                <div class="info-group"><small>Email</small><p>${user.email}</p></div>
                <div class="info-group"><small>Telefone</small><p>${user.telefone || '-'}</p></div>
                <div class="info-group"><small>CPF</small><p>${user.cpf || '-'}</p></div>
                <div class="info-group"><small>Status</small><p>${user.status}</p></div>
            </div>
        `;
    } catch (e) { body.innerHTML = 'Erro.'; }
}

// =========================================================================
// CADASTRO (COM AUTO-ATIVAÇÃO)
// =========================================================================

function setupModalListeners() {
    const modal = document.getElementById('add-institution-modal');
    const btnOpen = document.getElementById('addInstitutionButton');
    const form = document.getElementById('add-institution-form');

    if (btnOpen) {
        const newBtn = btnOpen.cloneNode(true);
        btnOpen.parentNode.replaceChild(newBtn, btnOpen);
        newBtn.addEventListener('click', () => modal.classList.add('show'));
    }

    const closeModal = () => { modal.classList.remove('show'); form.reset(); };
    document.getElementById('modal-inst-close-button').addEventListener('click', closeModal);
    document.getElementById('modal-inst-cancel-button').addEventListener('click', closeModal);

    if (form) {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.querySelector('#modal-inst-cancel-button').addEventListener('click', closeModal);

        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSave = newForm.querySelector('button[type="submit"]');
            btnSave.disabled = true; btnSave.textContent = 'Salvando...';

            try {
                const data = {
                    nome: document.getElementById('inst-nome').value,
                    sigla: document.getElementById('inst-sigla').value,
                    cnpj: document.getElementById('inst-cnpj').value,
                    email: document.getElementById('inst-email').value,
                    telefone: document.getElementById('inst-telefone').value,
                    areaAtuacao: document.getElementById('inst-area').value,
                    descricao: document.getElementById('inst-descricao').value
                };
                
                const novaInstituicao = await cadastrarInstituicao(data);
                
                if (novaInstituicao && novaInstituicao.id) {
                    await atualizarInstituicao(novaInstituicao.id, { status: 'ATIVO' });
                }

                alert('Instituição cadastrada e ativada com sucesso!');
                closeModal();
                loadInstitutions();

            } catch(err) { 
                console.error(err);
                alert('Erro: ' + (err.message || 'Falha na comunicação')); 
            } finally { 
                btnSave.disabled = false; btnSave.textContent = 'Salvar Instituição'; 
            }
        });
    }
}