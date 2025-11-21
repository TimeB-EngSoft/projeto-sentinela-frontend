import { listarConflitos, cadastrarConflito, atualizarConflito, getUserData } from '../../services/apiService.js';

let allConflitos = [];

export async function init() {
    checkPermissions();
    await loadConflitos();
    setupFilters();
    setupModalAdd();
}

function checkPermissions() {
    const userCargo = localStorage.getItem('userCargo');
    // ADICIONADO: GESTOR_INSTITUICAO na lista de permitidos
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
        
        // Filtra se for Gestor de Instituição (opcional, mas recomendado)
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
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Nenhum conflito registrado.</td></tr>';
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
                    ${c.status === 'ATIVO' ? 
                        `<button class="btn btn-sm btn-success" onclick="window.resolveConflict(${c.id})" title="Resolver"><i class="fas fa-check"></i></button>` : 
                        '<span style="color:#ccc">-</span>'
                    }
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

window.resolveConflict = async function(id) {
    if(!confirm("Marcar este conflito como RESOLVIDO?")) return;
    try {
        await atualizarConflito(id, { status: 'RESOLVIDO' });
        alert("Conflito resolvido com sucesso!");
        loadConflitos();
    } catch(e) {
        alert("Erro ao resolver conflito: " + e.message);
    }
};

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

function setupModalAdd() {
    const modal = document.getElementById('modal-add-conflito');
    const btnOpen = document.getElementById('addConflitoButton');
    const form = document.getElementById('form-add-conflito');

    if(btnOpen) {
        const newBtn = btnOpen.cloneNode(true);
        btnOpen.parentNode.replaceChild(newBtn, btnOpen);
        newBtn.addEventListener('click', () => modal.classList.add('show'));
    }

    const closeModal = () => modal.classList.remove('show');
    modal.querySelectorAll('[data-close-modal]').forEach(b => 
        b.addEventListener('click', closeModal)
    );

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

            // Obter ID da Instituição do usuário logado
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
                status: 'ATIVO',
                instituicao: myInstObj // Vínculo
            };

            try {
                await cadastrarConflito(data);
                alert("✅ Conflito registrado com sucesso!");
                closeModal();
                newForm.reset();
                loadConflitos();
            } catch(err) {
                console.error(err);
                alert("Erro ao registrar conflito: " + (err.message || "Erro desconhecido"));
            } finally {
                btn.disabled = false;
                btn.textContent = 'Salvar';
            }
        });
    }
}