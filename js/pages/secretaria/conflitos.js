import { listarConflitos, cadastrarConflito, atualizarConflito, getUserData } from '../../services/apiService.js';

let allConflitos = [];
let currentConflictId = null;

export async function init() {
    checkPermissions();
    await loadConflitos();
    setupFilters();
    setupModalAddAndEdit();
}

function checkPermissions() {
    const userCargo = localStorage.getItem('userCargo');
    if (['SECRETARIA', 'GESTOR_SECRETARIA', 'GESTOR_INSTITUICAO'].includes(userCargo)) {
        const btn = document.getElementById('addConflitoButton');
        if(btn) btn.style.display = 'inline-flex';
    }
}

async function loadConflitos() {
    const tbody = document.getElementById('conflitosTableBody');
    if(!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Carregando...</td></tr>';
    try {
        const data = await listarConflitos();
        allConflitos = Array.isArray(data) ? data : [];
        
        const userCargo = localStorage.getItem('userCargo');
        if (userCargo === 'GESTOR_INSTITUICAO') {
             const userId = localStorage.getItem('userId');
             try {
                 const me = await getUserData(userId);
                 if(me.instituicao) {
                     allConflitos = allConflitos.filter(c => c.instituicao && c.instituicao.id === me.instituicao.id);
                 }
             } catch(e){}
        }

        updateStats(allConflitos);
        renderTable(allConflitos);
    } catch(e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red">Erro ao carregar conflitos.</td></tr>';
    }
}

function updateStats(list) {
    const set = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = v; };
    set('stat-conf-ativos', list.filter(c => c.status === 'ATIVO').length);
    set('stat-conf-resolvidos', list.filter(c => c.status === 'RESOLVIDO').length);
}

function renderTable(list) {
    const tbody = document.getElementById('conflitosTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';

    if(list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px;">Nenhum conflito registrado.</td></tr>`;
        return;
    }

    list.forEach(c => {
        const prioridadeClass = c.prioridade === 'CRITICA' ? 'tag-prioridade-alta' : 
                                (c.prioridade === 'ALTA' ? 'tag-prioridade-media' : 'tag-prioridade-baixa');
        
        const statusIcon = c.status === 'RESOLVIDO' ? '<i class="fas fa-check"></i>' : 
                           (c.status === 'CANCELADO' ? '<i class="fas fa-ban"></i>' : '<i class="fas fa-fire"></i>');

        const reclamante = c.parteReclamante || '-';
        const reclamada = c.parteReclamada || '-';
        const tipo = c.tipoConflito ? c.tipoConflito.replace(/_/g, ' ') : 'Não informado';

        const row = `
            <tr>
                <td><strong>${c.tituloConflito}</strong></td>
                <td>${tipo}</td>
                <td class="envolvidos-cell">
                    <div><small>Rec:</small> ${reclamante}</div>
                    <div><small>Vs:</small> ${reclamada}</div>
                </td>
                <td><span class="tag ${prioridadeClass}">${c.prioridade}</span></td>
                <td><span class="status-tag">${statusIcon} ${c.status}</span></td>
                <td class="table-actions">
                    <button class="btn btn-sm btn-primary" onclick="window.openEditConflito(${c.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// --- LÓGICA DE EDIÇÃO ---

window.openEditConflito = function(id) {
    const conflito = allConflitos.find(c => c.id === id);
    if(!conflito) return;

    currentConflictId = id;
    const modal = document.getElementById('modal-add-conflito');
    const form = document.getElementById('form-add-conflito');
    const title = modal.querySelector('.modal-header h3');
    
    title.innerHTML = '<i class="fas fa-edit"></i> Editar Conflito';
    
    // Preenche campos
    document.getElementById('new-conf-titulo').value = conflito.tituloConflito;
    document.getElementById('new-conf-tipo').value = conflito.tipoConflito;
    document.getElementById('new-conf-data').value = conflito.dataInicio ? conflito.dataInicio.split('T')[0] : '';
    document.getElementById('new-conf-prioridade').value = conflito.prioridade;
    document.getElementById('new-conf-reclamante').value = conflito.parteReclamante || '';
    document.getElementById('new-conf-reclamada').value = conflito.parteReclamada || '';
    document.getElementById('new-conf-grupos').value = conflito.gruposVulneraveis || '';
    document.getElementById('new-conf-desc').value = conflito.descricaoConflito || '';

    // Preenche Localização
    if(conflito.localizacao) {
        document.getElementById('new-conf-cep').value = conflito.localizacao.cep || '';
        document.getElementById('new-conf-estado').value = conflito.localizacao.estado || '';
        document.getElementById('new-conf-municipio').value = conflito.localizacao.municipio || '';
        const match = (conflito.localizacao.complemento || '').match(/Bairro: (.*?), Rua: (.*)/);
        if(match) {
            document.getElementById('new-conf-bairro').value = match[1] || '';
            document.getElementById('new-conf-rua').value = match[2] || '';
        }
    }

    // INJEÇÃO DO CAMPO DE STATUS PARA EDIÇÃO
    let statusContainer = document.getElementById('edit-status-container');
    if(!statusContainer) {
        // Se não existe, cria dinamicamente após a prioridade
        const prioGroup = document.getElementById('new-conf-prioridade').closest('.form-group');
        const div = document.createElement('div');
        div.className = 'form-group';
        div.id = 'edit-status-container';
        div.innerHTML = `
            <label>Status *</label>
            <select id="new-conf-status" required>
                <option value="ATIVO">Ativo</option>
                <option value="RESOLVIDO">Resolvido</option>
                <option value="CANCELADO">Cancelado</option>
            </select>
        `;
        prioGroup.parentNode.appendChild(div);
    } else {
        statusContainer.style.display = 'block';
    }
    document.getElementById('new-conf-status').value = conflito.status;

    modal.classList.add('show');
};

function setupModalAddAndEdit() {
    const modal = document.getElementById('modal-add-conflito');
    const btnOpen = document.getElementById('addConflitoButton');
    const form = document.getElementById('form-add-conflito');

    // Botão "Novo"
    if(btnOpen) {
        const newBtn = btnOpen.cloneNode(true);
        btnOpen.parentNode.replaceChild(newBtn, btnOpen);
        newBtn.addEventListener('click', () => {
            currentConflictId = null;
            form.reset();
            modal.querySelector('.modal-header h3').innerHTML = '<i class="fas fa-exclamation-triangle"></i> Registrar Conflito';
            
            // Esconde o select de status na criação (assume ATIVO)
            const statusContainer = document.getElementById('edit-status-container');
            if(statusContainer) statusContainer.style.display = 'none';
            
            modal.classList.add('show');
        });
    }

    // Fechar modal
    const closeModal = () => modal.classList.remove('show');
    modal.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', closeModal));

    // Submit
    if(form) {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = newForm.querySelector('button[type="submit"]');
            
            const titulo = document.getElementById('new-conf-titulo').value;
            const dataInicio = document.getElementById('new-conf-data').value;
            
            if(!titulo || !dataInicio) {
                alert("Preencha os campos obrigatórios (*)");
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Salvando...';

            const userId = localStorage.getItem('userId');
            let myInstObj = null;
            try {
                const user = await getUserData(userId);
                if(user.instituicao) myInstObj = { id: user.instituicao.id };
            } catch(e){}

            const data = {
                tituloConflito: titulo,
                tipoConflito: document.getElementById('new-conf-tipo').value,
                dataInicio: dataInicio + 'T00:00:00',
                prioridade: document.getElementById('new-conf-prioridade').value,
                parteReclamante: document.getElementById('new-conf-reclamante').value,
                parteReclamada: document.getElementById('new-conf-reclamada').value,
                gruposVulneraveis: document.getElementById('new-conf-grupos').value,
                descricaoConflito: document.getElementById('new-conf-desc').value,
                fonteDenuncia: 'USUARIO_INTERNO',
                instituicao: myInstObj,
                
                // Campos de endereço
                cep: document.getElementById('new-conf-cep').value,
                estado: document.getElementById('new-conf-estado').value,
                municipio: document.getElementById('new-conf-municipio').value,
                bairro: document.getElementById('new-conf-bairro').value,
                rua: document.getElementById('new-conf-rua').value
            };

            // Se for edição, pega o status do select. Se novo, fixa ATIVO.
            if(currentConflictId) {
                data.status = document.getElementById('new-conf-status').value;
            } else {
                data.status = 'ATIVO';
            }

            try {
                if(currentConflictId) {
                    await atualizarConflito(currentConflictId, data);
                    alert("✅ Conflito atualizado com sucesso!");
                } else {
                    await cadastrarConflito(data);
                    alert("✅ Conflito registrado com sucesso!");
                }
                
                closeModal();
                newForm.reset();
                loadConflitos();
            } catch(err) {
                console.error(err);
                alert("Erro ao salvar: " + (err.message || "Erro desconhecido"));
            } finally {
                btn.disabled = false;
                btn.textContent = 'Salvar';
            }
        });
    }
}

function setupFilters() {
    const input = document.getElementById('search-conflito');
    const select = document.getElementById('filter-prioridade');
    
    const filter = () => {
        const term = input.value.toLowerCase();
        const prio = select.value;
        
        const filtered = allConflitos.filter(c => {
            const matchText = c.tituloConflito.toLowerCase().includes(term) || 
                              (c.parteReclamante && c.parteReclamante.toLowerCase().includes(term));
            const matchPrio = prio ? c.prioridade === prio : true;
            return matchText && matchPrio;
        });
        renderTable(filtered);
    };

    if(input) input.addEventListener('keyup', filter);
    if(select) select.addEventListener('change', filter);
}