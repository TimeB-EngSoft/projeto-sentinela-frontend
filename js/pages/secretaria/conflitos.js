import { listarConflitos, cadastrarConflito, atualizarConflito, getUserData } from '../../services/apiService.js';

let allConflitos = [];
let currentConflictId = null;

export async function init() {
    checkPermissions();
    await loadConflitos();
    setupFilters();
    setupModalAddAndEdit();
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    const title = type === 'success' ? 'Sucesso' : 'Atenção';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <div class="toast-content">
            <span class="toast-title">${title}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Animação de entrada
    requestAnimationFrame(() => toast.classList.add('show'));
    
    // Remove após 3.5 segundos
    setTimeout(() => { 
        toast.classList.remove('show'); 
        setTimeout(() => toast.remove(), 300); 
    }, 3500);
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
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px; color: #666;">Nenhum conflito registrado.</td></tr>`;
        return;
    }

    list.forEach(c => {
        let prioridadeClass = 'tag-neutral';
        if (c.prioridade === 'CRITICA') prioridadeClass = 'tag-prioridade-alta';
        else if (c.prioridade === 'ALTA') prioridadeClass = 'tag-prioridade-media';
        else if (c.prioridade === 'MEDIA') prioridadeClass = 'tag-prioridade-baixa';
        else if (c.prioridade === 'BAIXA') prioridadeClass = 'tag-neutral';

        let statusClass = 'status-pendente';
        let statusLabel = c.status;
        
        if (c.status === 'RESOLVIDO') {
            statusClass = 'status-ativo';
        } else if (c.status === 'CANCELADO' || c.status === 'INATIVO') {
            statusClass = 'status-inativo';
        } else if (c.status === 'ATIVO') {
            statusClass = 'status-pendente';
        }

        const reclamante = c.parteReclamante || '-';
        const reclamada = c.parteReclamada || '-';
        const tipo = c.tipoConflito ? c.tipoConflito.replace(/_/g, ' ') : 'Não informado';

        const row = `
            <tr>
                <td><strong>${c.tituloConflito}</strong></td>
                <td><span class="tag tag-neutral" style="font-size: 0.75rem;">${tipo}</span></td>
                <td class="envolvidos-cell">
                    <div><small>REC:</small> ${reclamante}</div>
                    <div><small>VS:</small> ${reclamada}</div>
                </td>
                <td><span class="tag ${prioridadeClass}">${c.prioridade}</span></td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-secondary btn-acao-clean" onclick="window.openEditConflito(${c.id})" title="Ver Detalhes">
                            <i class="fas fa-edit"></i> Detalhes
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// --- Função para buscar coordenadas (BrasilAPI V2) ---
async function fetchCoordinates(cep) {
    try {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return null;
        
        const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
        if (!res.ok) return null;
        
        const data = await res.json();
        if (data.location && data.location.coordinates) {
            const lat = data.location.coordinates.latitude;
            const long = data.location.coordinates.longitude;

            // Verifica se as coordenadas são válidas (não undefined)
            if (lat !== undefined && long !== undefined) {
                return { latitude: lat, longitude: long };
            }
        }
        return null;
    } catch (e) {
        console.warn('Erro ao buscar coordenadas:', e);
        return null;
    }
}

// --- LÓGICA DE EDIÇÃO ---

window.openEditConflito = function(id) {
    const conflito = allConflitos.find(c => c.id === id);
    if(!conflito) return;

    currentConflictId = id;
    const modal = document.getElementById('modal-add-conflito');
    const title = modal.querySelector('.modal-header h3');
    
    title.innerHTML = '<i class="fas fa-edit"></i> Editar Conflito';
    
    document.getElementById('new-conf-titulo').value = conflito.tituloConflito;
    document.getElementById('new-conf-tipo').value = conflito.tipoConflito;
    document.getElementById('new-conf-data').value = conflito.dataInicio ? conflito.dataInicio.split('T')[0] : '';
    document.getElementById('new-conf-prioridade').value = conflito.prioridade;
    document.getElementById('new-conf-reclamante').value = conflito.parteReclamante || '';
    document.getElementById('new-conf-reclamada').value = conflito.parteReclamada || '';
    document.getElementById('new-conf-grupos').value = conflito.gruposVulneraveis || '';
    document.getElementById('new-conf-desc').value = conflito.descricaoConflito || '';

    if(conflito.localizacao) {
        document.getElementById('new-conf-cep').value = conflito.localizacao.cep || '';
        document.getElementById('new-conf-estado').value = conflito.localizacao.estado || '';
        document.getElementById('new-conf-municipio').value = conflito.localizacao.municipio || '';
        
        const latInput = document.getElementById('new-conf-lat');
        const longInput = document.getElementById('new-conf-long');
        if(latInput) latInput.value = conflito.localizacao.latitude || '';
        if(longInput) longInput.value = conflito.localizacao.longitude || '';

        const match = (conflito.localizacao.complemento || '').match(/Bairro: (.*?), Rua: (.*)/);
        if(match) {
            document.getElementById('new-conf-bairro').value = match[1] || '';
            document.getElementById('new-conf-rua').value = match[2] || '';
        }
    }

    let statusContainer = document.getElementById('edit-status-container');
    if(!statusContainer) {
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

    if(btnOpen) {
        const newBtn = btnOpen.cloneNode(true);
        btnOpen.parentNode.replaceChild(newBtn, btnOpen);
        newBtn.addEventListener('click', () => {
            currentConflictId = null;
            form.reset();
            
            const latInput = document.getElementById('new-conf-lat');
            const longInput = document.getElementById('new-conf-long');
            if(latInput) { latInput.value = ''; latInput.placeholder = "Automático ou manual"; }
            if(longInput) { longInput.value = ''; longInput.placeholder = "Automático ou manual"; }

            modal.querySelector('.modal-header h3').innerHTML = '<i class="fas fa-exclamation-triangle"></i> Registrar Conflito';
            
            const statusContainer = document.getElementById('edit-status-container');
            if(statusContainer) statusContainer.style.display = 'none';
            
            modal.classList.add('show');
        });
    }

    const closeModal = () => modal.classList.remove('show');
    modal.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', closeModal));

    // --- Busca Automática no BLUR ---
    const cepInput = document.getElementById('new-conf-cep');
    const latInput = document.getElementById('new-conf-lat');
    const longInput = document.getElementById('new-conf-long');

    if (cepInput && latInput && longInput) {
        const newCepInput = cepInput.cloneNode(true);
        cepInput.parentNode.replaceChild(newCepInput, cepInput);

        newCepInput.addEventListener('blur', async () => {
            const cep = newCepInput.value.replace(/\D/g, '');
            if (cep.length === 8) {
                latInput.placeholder = "Buscando...";
                longInput.placeholder = "Buscando...";
                
                const coords = await fetchCoordinates(cep);
                
                if (coords) {
                    latInput.value = coords.latitude;
                    longInput.value = coords.longitude;
                    latInput.placeholder = ""; 
                    longInput.placeholder = "";
                } else {
                    latInput.value = "";
                    longInput.value = "";
                    latInput.placeholder = "Não encontrado";
                    longInput.placeholder = "Não encontrado";
                }
            }
        });
    }

    // --- SUBMIT DO FORMULÁRIO ---
    if(form) {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = newForm.querySelector('button[type="submit"]');
            const originalBtnText = btn.textContent; // Salva texto original
            
            const titulo = document.getElementById('new-conf-titulo').value;
            const dataInicio = document.getElementById('new-conf-data').value;
            
            // 1. Limpa o CEP
            let cepRaw = document.getElementById('new-conf-cep').value;
            const cepClean = cepRaw ? cepRaw.replace(/\D/g, '') : ''; 
            
            if(!titulo || !dataInicio) {
                alert("Preencha os campos obrigatórios (*)");
                return;
            }

            btn.disabled = true;
            
            // 2. Captura os valores atuais
            let latVal = document.getElementById('new-conf-lat').value;
            let longVal = document.getElementById('new-conf-long').value;

            // Limpeza de segurança
            if (latVal === "undefined") latVal = "";
            if (longVal === "undefined") longVal = "";

            // 3. Tenta buscar novamente se tiver CEP mas não tiver coordenadas
            if ((!latVal || !longVal) && cepClean.length === 8) {
                btn.innerHTML = '<i class="fas fa-satellite-dish fa-spin"></i> Geolocalizando...';
                try {
                    const coords = await fetchCoordinates(cepClean);
                    if (coords && coords.latitude) {
                        latVal = coords.latitude;
                        longVal = coords.longitude;
                        document.getElementById('new-conf-lat').value = latVal;
                        document.getElementById('new-conf-long').value = longVal;
                    }
                } catch (err) {
                    console.warn("API de CEP falhou no submit.");
                }
            }

            // 4. Prepara valores finais
            const finalLat = (latVal && latVal !== "undefined") ? parseFloat(latVal) : null;
            const finalLong = (longVal && longVal !== "undefined") ? parseFloat(longVal) : null;

            // === VALIDAÇÃO COM POP-UP DE SEGURANÇA ===
            if (finalLat === null || finalLong === null) {
                const confirmarSemCoords = confirm(
                    "⚠️ Atenção: Coordenadas não identificadas!\n\n" +
                    "O sistema não conseguiu obter a Latitude/Longitude automaticamente para este local.\n" +
                    "Sem esses dados, o conflito NÃO aparecerá no mapa interativo.\n\n" +
                    "Deseja salvar mesmo assim?"
                );

                if (!confirmarSemCoords) {
                    btn.disabled = false;
                    btn.innerHTML = originalBtnText; // Restaura texto original
                    return; 
                }
            }
            // ==========================================

            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

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
                
                cep: cepClean, 
                estado: document.getElementById('new-conf-estado').value,
                municipio: document.getElementById('new-conf-municipio').value,
                bairro: document.getElementById('new-conf-bairro').value,
                rua: document.getElementById('new-conf-rua').value,
                
                // Envia valores limpos
                latitude: finalLat,
                longitude: finalLong
            };

            if(currentConflictId) {
                data.status = document.getElementById('new-conf-status').value;
            } else {
                data.status = 'ATIVO';
            }

            try {
                if(currentConflictId) {
                    await atualizarConflito(currentConflictId, data);
                    showToast("Conflito atualizado com sucesso!");
                } else {
                    await cadastrarConflito(data);
                    showToast("Conflito registrado com sucesso!");
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