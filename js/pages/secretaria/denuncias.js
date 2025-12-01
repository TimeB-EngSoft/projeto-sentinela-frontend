import { listarDenuncias, atualizarDenuncia, cadastrarConflito, getUserData, listarConflitos } from '../../services/apiService.js';

let allDenuncias = [];
let currentDenuncia = null;
let denunciasComConflitoIds = new Set();

// --- Função auxiliar para exibir toast ---
function showToast(message, type = 'success', title = null) {
    const container = document.getElementById('toast-container');
    if (!container) return;
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

export async function init() {
    await loadDenuncias();
    setupFilters();
    setupModals();
}

async function loadDenuncias() {
    const tbody = document.getElementById('denunciasTableBody');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Carregando...</td></tr>';
    
    try {
        const [denunciasData, conflitosData] = await Promise.all([
            listarDenuncias(),
            listarConflitos().catch(() => [])
        ]);
        
        const rawList = Array.isArray(denunciasData) ? denunciasData : [];
        const listaConflitos = Array.isArray(conflitosData) ? conflitosData : [];
        
        // Mapeia conflitos existentes para bloquear botão
        denunciasComConflitoIds.clear();
        listaConflitos.forEach(c => {
            if (c.denunciaOrigem && c.denunciaOrigem.id) {
                denunciasComConflitoIds.add(c.denunciaOrigem.id);
            }
        });
        
        // Filtragem por perfil
        const userCargo = localStorage.getItem('userCargo');
        const userEmail = localStorage.getItem('userEmail');
        const userId = localStorage.getItem('userId');
        
        if (userCargo === 'GESTOR_INSTITUICAO') {
            let myInstId = null;
            try {
                const me = await getUserData(userId);
                if (me.instituicao) myInstId = me.instituicao.id;
            } catch(e){}
            
            if (myInstId) allDenuncias = rawList.filter(d => d.instituicao && d.instituicao.id === myInstId);
            else allDenuncias = [];
            
            if(document.querySelector('.stats-grid')) document.querySelector('.stats-grid').style.display = 'grid';
            updateStats(allDenuncias);
        
        } else if (userCargo === 'USUARIO_INSTITUICAO' || userCargo === 'USUARIO_SECRETARIA') {
            allDenuncias = rawList.filter(d => d.emailDenunciante === userEmail);
            if(document.querySelector('.stats-grid')) document.querySelector('.stats-grid').style.display = 'none';
        } else {
            // Secretaria e Gestor Secretaria
            allDenuncias = rawList;
            if(document.querySelector('.stats-grid')) document.querySelector('.stats-grid').style.display = 'grid';
            updateStats(allDenuncias);
        }
        
        renderTable(allDenuncias);
    } catch(e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red;">Erro ao carregar dados.</td></tr>`;
    }
}

function updateStats(list) {
    const setTxt = (id, txt) => {
        const el = document.getElementById(id);
        if(el) el.textContent = txt;
    };
    setTxt('stat-total-denuncias', list.length);
    setTxt('stat-pendentes', list.filter(d => d.status === 'PENDENTE').length);
    setTxt('stat-aprovadas', list.filter(d => d.status === 'APROVADA').length);
    setTxt('stat-rejeitadas', list.filter(d => d.status === 'ARQUIVADA').length);
}

function renderTable(list) {
    const tbody = document.getElementById('denunciasTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    if(list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Nenhuma denúncia encontrada.</td></tr>';
        return;
    }
    
    // Ordenar: Pendentes primeiro, depois data decrescente
    list.sort((a, b) => {
        if (a.status === 'PENDENTE' && b.status !== 'PENDENTE') return -1;
        if (a.status !== 'PENDENTE' && b.status === 'PENDENTE') return 1;
        return new Date(b.dataOcorrido) - new Date(a.dataOcorrido);
    });
    
    list.forEach(d => {
        const dataFmt = d.dataOcorrido ? new Date(d.dataOcorrido).toLocaleDateString() : '-';
        const statusClass = d.status === 'PENDENTE' ? 'tag-status-pendente' : 
                            (d.status === 'APROVADA' ? 'tag-status-aprovada' : 'tag-status-rejeitada');
        const tipoLegivel = d.tipoDenuncia ? d.tipoDenuncia.replace(/_/g, ' ') : 'Outro';
        
        const row = `
            <tr>
                <td>${dataFmt}</td>
                <td>${d.tituloDenuncia}</td>
                <td>${d.nomeDenunciante || 'Anônimo'}</td>
                <td><span class="tag tag-neutral" style="font-size:0.75rem">${tipoLegivel}</span></td>
                <td><span class="tag ${statusClass}">${d.status}</span></td>
                <td><button class="btn btn-sm btn-secondary" onclick="window.openDenunciaDetails(${d.id})"><i class="fas fa-eye"></i> Detalhes</button></td>
            </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// --- MODAL DE DETALHES ---
window.openDenunciaDetails = function(id) {
    currentDenuncia = allDenuncias.find(d => d.id === id);
    if(!currentDenuncia) return;
    
    const modal = document.getElementById('modal-denuncia-details');
    const body = document.getElementById('detail-modal-body');
    const footer = document.getElementById('detail-modal-footer');
    const disabledAttr = 'disabled'; 
    
    // Lista de tipos disponíveis (para garantir que o select funcione)
    const tiposDisponiveis = [
        { val: 'TERRA_INDIGENA', label: 'Terra Indígena' },
        { val: 'DISPUTA_DE_POSSE', label: 'Disputa de Posse' },
        { val: 'TERRITORIO_QUILOMBOLA', label: 'Território Quilombola' },
        { val: 'RECURSO_HIDRICO', label: 'Recursos Hídricos' },
        { val: 'DESMATAMENTO', label: 'Desmatamento' },
        { val: 'OUTRO', label: 'Outro' }
    ];
    
    // Gera as opções do select marcando a correta
    const optionsHtml = tiposDisponiveis.map(t => 
        `<option value="${t.val}" ${currentDenuncia.tipoDenuncia === t.val ? 'selected' : ''}>${t.label}</option>`
    ).join('');
    
    let content = `
        <form id="form-edit-denuncia">
            <div class="form-grid-2">
                <div class="form-group">
                    <label>Título</label>
                    <input type="text" id="edit-titulo" value="${currentDenuncia.tituloDenuncia || ''}" ${disabledAttr}>
                </div>
                <div class="form-group">
                    <label>Tipo</label>
                    <select id="edit-tipo" ${disabledAttr}>
                        ${optionsHtml}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Descrição</label>
                <textarea id="edit-desc" rows="3" ${disabledAttr}>${currentDenuncia.descricaoDenuncia || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Partes Envolvidas</label>
                <textarea id="edit-partes" rows="2" ${disabledAttr}>${currentDenuncia.descricaoPartesEnvolvidas || ''}</textarea>
            </div>
        </form>
    `;
    
    if(currentDenuncia.localizacao) {
        const l = currentDenuncia.localizacao;
        content += `<div class="form-group" style="margin-top:15px; background:#f9f9f9; padding:10px; border-radius:8px;">
            <label>Localização</label>
            <p style="font-size:0.9rem; color:#555;">${l.municipio || '-'} - ${l.estado || '-'}<br>CEP: ${l.cep || '-'}<br>${l.complemento || ''}</p>
        </div>`;
    }
    body.innerHTML = content;
    
    const userCargo = localStorage.getItem('userCargo');
    const canManage = ['SECRETARIA', 'GESTOR_SECRETARIA', 'GESTOR_INSTITUICAO'].includes(userCargo);
    
    let buttonsHtml = '<button type="button" class="btn btn-secondary" data-close-modal>Fechar</button>';
    
    if (canManage) {
        if (currentDenuncia.status === 'PENDENTE') {
            buttonsHtml += `
                <button class="btn btn-primary" id="btn-edit-mode" onclick="window.toggleEditMode()">Editar</button>
                <button class="btn btn-success" id="btn-save-edit" style="display:none;" onclick="window.saveDenunciaEdit(${id})">Salvar</button>
                <button class="btn btn-danger" onclick="window.updateStatusDenuncia(${id}, 'ARQUIVADA')">Arquivar</button>
                <button class="btn btn-success" onclick="window.updateStatusDenuncia(${id}, 'APROVADA')">Aprovar</button>
            `;
        } else if (currentDenuncia.status === 'APROVADA') {
            const jaTemConflito = denunciasComConflitoIds.has(currentDenuncia.id);
            if (jaTemConflito) {
                buttonsHtml += `<button class="btn btn-secondary" disabled style="opacity: 0.7; cursor: not-allowed;" title="Esta denúncia já gerou um conflito"><i class="fas fa-check-circle"></i> Conflito Já Gerado</button>`;
            } else {
                buttonsHtml += `<button class="btn btn-primary" onclick="window.openConvertModal()"><i class="fas fa-exchange-alt"></i> Gerar Conflito</button>`;
            }
        }
    }
    
    footer.innerHTML = buttonsHtml;
    modal.classList.add('show');
    setupCloseButtons(modal);
};

// --- AÇÕES DO USUÁRIO ---
window.toggleEditMode = function() {
    const inputs = document.querySelectorAll('#form-edit-denuncia input, #form-edit-denuncia textarea, #form-edit-denuncia select');
    inputs.forEach(el => el.disabled = false);
    document.getElementById('btn-edit-mode').style.display = 'none';
    document.getElementById('btn-save-edit').style.display = 'inline-block';
};

window.saveDenunciaEdit = async function(id) {
    const data = {
        tituloDenuncia: document.getElementById('edit-titulo').value,
        tipoDenuncia: document.getElementById('edit-tipo').value,
        descricaoDenuncia: document.getElementById('edit-desc').value,
        descricaoPartesEnvolvidas: document.getElementById('edit-partes').value
    };
    try {
        await atualizarDenuncia(id, data);
        // Usa toast para indicar sucesso
        showToast('Denúncia atualizada com sucesso!', 'success');
        document.getElementById('modal-denuncia-details').classList.remove('show');
        loadDenuncias();
    } catch(e) {
        showToast('Erro ao editar: ' + e.message, 'error');
    }
};

window.updateStatusDenuncia = async function(id, newStatus) {
    if(!confirm(`Deseja alterar o status para ${newStatus}?`)) return;
    
    // Feedback visual imediato
    const btnApprove = document.querySelector(`button[onclick*="APROVADA"]`);
    const btnArchive = document.querySelector(`button[onclick*="ARQUIVADA"]`);
    if(btnApprove) btnApprove.disabled = true;
    if(btnArchive) btnArchive.disabled = true;
    
    try {
        // Envia para o backend. O backend deve estar preparado para receber "statusDenuncia" no DTO.
        await atualizarDenuncia(id, { statusDenuncia: newStatus });
        
        showToast(`Status atualizado para ${newStatus} com sucesso!`, 'success');
        document.getElementById('modal-denuncia-details').classList.remove('show');
        
        // Recarrega a lista para refletir a mudança
        await loadDenuncias();
    } catch(e) {
        showToast('Erro ao atualizar status: ' + e.message, 'error');
        // Reabilita em caso de erro
        if(btnApprove) btnApprove.disabled = false;
        if(btnArchive) btnArchive.disabled = false;
    }
};

window.openConvertModal = function() {
    document.getElementById('modal-denuncia-details').classList.remove('show');
    const modal = document.getElementById('modal-convert-conflict');
    document.getElementById('convert-reclamante').value = currentDenuncia.nomeDenunciante || '';
    document.getElementById('convert-grupos').value = currentDenuncia.descricaoPartesEnvolvidas || '';
    document.getElementById('convert-data-inicio').value = new Date().toISOString().split('T')[0];
    modal.classList.add('show');
};

function setupModals() {
    const convertForm = document.getElementById('form-convert-conflict');
    const convertModal = document.getElementById('modal-convert-conflict');
    
    // Fecha modais genéricos
    document.querySelectorAll('[data-close-modal]').forEach(b => 
        b.addEventListener('click', e => e.target.closest('.modal').classList.remove('show'))
    );
    
    // Fecha modal de conversão
    if(convertModal) {
        const closeModal = () => convertModal.classList.remove('show');
        const btnClose = document.getElementById('btn-close-convert');
        const btnCancel = document.getElementById('btn-cancel-convert');
        if(btnClose) btnClose.addEventListener('click', closeModal);
        if(btnCancel) btnCancel.addEventListener('click', closeModal);
    }
    
    if(convertForm) {
        // Remove listener antigo clonando
        const newForm = convertForm.cloneNode(true);
        convertForm.parentNode.replaceChild(newForm, convertForm);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = newForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Criando...';
            
            const conflitoData = {
                tituloConflito: currentDenuncia.tituloDenuncia,
                descricaoConflito: currentDenuncia.descricaoDenuncia,
                tipoConflito: currentDenuncia.tipoDenuncia,
                fonteDenuncia: 'USUARIO_INTERNO',
                status: 'ATIVO',
                prioridade: document.getElementById('convert-prioridade').value,
                dataInicio: document.getElementById('convert-data-inicio').value + 'T00:00:00',
                parteReclamante: document.getElementById('convert-reclamante').value,
                parteReclamada: document.getElementById('convert-reclamada').value,
                gruposVulneraveis: document.getElementById('convert-grupos').value,
                denunciaOrigem: { id: currentDenuncia.id }
            };
            
            // Se for gestor de instituição, vincula automaticamente
            const userCargo = localStorage.getItem('userCargo');
            if(userCargo === 'GESTOR_INSTITUICAO') {
                 try {
                    const userId = localStorage.getItem('userId');
                    const me = await getUserData(userId);
                    if(me.instituicao) conflitoData.instituicao = { id: me.instituicao.id };
                 } catch(e){}
            }
            
            try {
                await cadastrarConflito(conflitoData);
                showToast('Conflito gerado com sucesso!', 'success');
                convertModal.classList.remove('show');
                await loadDenuncias(); // Recarrega para atualizar o botão "Conflito Já Gerado"
            } catch(err) {
                showToast('Erro ao gerar conflito: ' + err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Confirmar e Criar Conflito';
            }
        });
    }
}

function setupFilters() {
    const input = document.getElementById('search-input-denuncia');
    const selectStatus = document.getElementById('status-filter-denuncia');
    const selectTipo = document.getElementById('tipo-filter-denuncia');
    
    const filter = () => {
        const term = input.value.toLowerCase();
        const st = selectStatus.value;
        const tp = selectTipo.value;
        
        const filtered = allDenuncias.filter(d => {
            const matchText = d.tituloDenuncia.toLowerCase().includes(term) || (d.nomeDenunciante && d.nomeDenunciante.toLowerCase().includes(term));
            const matchStatus = st ? d.status === st : true;
            const matchTipo = tp ? d.tipoDenuncia === tp : true;
            return matchText && matchStatus && matchTipo;
        });
        renderTable(filtered);
    };
    
    if(input) input.addEventListener('keyup', filter);
    if(selectStatus) selectStatus.addEventListener('change', filter);
    if(selectTipo) selectTipo.addEventListener('change', filter);
}

function setupCloseButtons(modal) {
    const closes = modal.querySelectorAll('[data-close-modal]');
    closes.forEach(c => c.onclick = () => modal.classList.remove('show'));
}