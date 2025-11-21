import { listarDenuncias, atualizarDenuncia, cadastrarConflito, getUserData } from '../../services/apiService.js';

let allDenuncias = [];
let currentDenuncia = null;

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
        const data = await listarDenuncias();
        let rawList = Array.isArray(data) ? data : [];

        const userCargo = localStorage.getItem('userCargo');
        const userEmail = localStorage.getItem('userEmail');
        const userId = localStorage.getItem('userId');

        if (userCargo === 'GESTOR_INSTITUICAO') {
            // Busca dados completos para pegar ID da instituição
            let myInstId = null;
            try {
                const me = await getUserData(userId);
                if (me.instituicao) myInstId = me.instituicao.id;
            } catch(e){}

            if (myInstId) {
                // Filtra apenas denúncias dessa instituição
                allDenuncias = rawList.filter(d => d.instituicao && d.instituicao.id === myInstId);
            } else {
                allDenuncias = []; // Sem instituição, não vê nada
            }
            
            document.querySelector('.stats-grid').style.display = 'grid';
            updateStats(allDenuncias);

        } else if (userCargo === 'USUARIO_INSTITUICAO' || userCargo === 'USUARIO_SECRETARIA') {
            // Usuários comuns veem apenas as suas
            allDenuncias = rawList.filter(d => d.emailDenunciante === userEmail);
            document.querySelector('.stats-grid').style.display = 'none';
        } else {
            // Secretaria e Gestor Secretaria veem tudo
            allDenuncias = rawList;
            document.querySelector('.stats-grid').style.display = 'grid';
            updateStats(allDenuncias);
        }

        renderTable(allDenuncias);
    } catch(e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red">Erro ao carregar denúncias.</td></tr>';
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

    list.forEach(d => {
        const dataFmt = new Date(d.dataOcorrido).toLocaleDateString();
        const statusClass = d.status === 'PENDENTE' ? 'tag-status-pendente' : 
                            (d.status === 'APROVADA' ? 'tag-status-aprovada' : 'tag-status-rejeitada');
        const tipoLegivel = d.tipoDenuncia ? d.tipoDenuncia.replace(/_/g, ' ') : 'Outro';

        const row = `
            <tr>
                <td>${dataFmt}</td>
                <td>${d.tituloDenuncia}</td>
                <td>${d.nomeDenunciante || '<i style="color:#999">Anônimo</i>'}</td>
                <td><span class="tag tag-neutral" style="font-size:0.75rem">${tipoLegivel}</span></td>
                <td><span class="tag ${statusClass}">${d.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="window.openDenunciaDetails(${d.id})">
                        <i class="fas fa-eye"></i> Detalhes
                    </button>
                </td>
            </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

window.openDenunciaDetails = function(id) {
    currentDenuncia = allDenuncias.find(d => d.id === id);
    if(!currentDenuncia) return;

    const modal = document.getElementById('modal-denuncia-details');
    const body = document.getElementById('detail-modal-body');
    const footer = document.getElementById('detail-modal-footer');
    
    // Exibe localização se existir
    let locHtml = '';
    if(currentDenuncia.localizacao) {
        const l = currentDenuncia.localizacao;
        locHtml = `<div class="form-group" style="margin-top:15px; background:#f9f9f9; padding:10px; border-radius:8px;">
            <label>Localização</label>
            <p style="font-size:0.9rem; color:#555;">
                ${l.municipio} - ${l.estado}<br>
                CEP: ${l.cep}<br>
                ${l.complemento || ''}
            </p>
        </div>`;
    }

    body.innerHTML = `
        <div class="form-grid-2">
            <div class="form-group"><label>Título</label><input type="text" value="${currentDenuncia.tituloDenuncia}" disabled></div>
            <div class="form-group"><label>Tipo</label><input type="text" value="${currentDenuncia.tipoDenuncia}" disabled></div>
        </div>
        <div class="form-group"><label>Descrição</label><textarea rows="3" disabled>${currentDenuncia.descricaoDenuncia}</textarea></div>
        <div class="form-group"><label>Partes Envolvidas</label><textarea rows="2" disabled>${currentDenuncia.descricaoPartesEnvolvidas || ''}</textarea></div>
        ${locHtml}
    `;

    const userCargo = localStorage.getItem('userCargo');
    
    // Permissão para gerenciar: Secretaria e Gestores
    const canManage = ['SECRETARIA', 'GESTOR_SECRETARIA', 'GESTOR_INSTITUICAO'].includes(userCargo);
    
    let buttonsHtml = '<button type="button" class="btn btn-secondary" data-close-modal>Fechar</button>';

    if (canManage) {
        if (currentDenuncia.status === 'PENDENTE') {
            buttonsHtml += `
                <button class="btn btn-danger" onclick="window.updateStatusDenuncia(${id}, 'ARQUIVADA')">Arquivar</button>
                <button class="btn btn-success" onclick="window.updateStatusDenuncia(${id}, 'APROVADA')">Aprovar</button>
            `;
        } else if (currentDenuncia.status === 'APROVADA') {
            // Agora Gestor Instituição também pode gerar conflito
            buttonsHtml += `
                <button class="btn btn-primary" onclick="window.openConvertModal()">
                    <i class="fas fa-exchange-alt"></i> Gerar Conflito
                </button>
            `;
        }
    }

    footer.innerHTML = buttonsHtml;
    modal.classList.add('show');
    setupCloseButtons(modal);
};

window.updateStatusDenuncia = async function(id, newStatus) {
    if(!confirm(`Deseja alterar o status para ${newStatus}?`)) return;
    try {
        // Aqui você pode criar um endpoint específico no backend ou usar o update
        // Como simplificação, usando update:
        await atualizarDenuncia(id, { statusDenuncia: newStatus });
        alert("Status atualizado com sucesso!");
        document.getElementById('modal-denuncia-details').classList.remove('show');
        loadDenuncias();
    } catch(e) {
        alert("Erro ao atualizar: " + e.message);
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
    
    document.querySelectorAll('[data-close-modal]').forEach(b => 
        b.addEventListener('click', e => e.target.closest('.modal').classList.remove('show'))
    );
    if(document.getElementById('btn-close-convert')) 
        document.getElementById('btn-close-convert').addEventListener('click', () => convertModal.classList.remove('show'));
    if(document.getElementById('btn-cancel-convert'))
        document.getElementById('btn-cancel-convert').addEventListener('click', () => convertModal.classList.remove('show'));

    convertForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = convertForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        
        // Ao converter, enviamos a denúncia de origem.
        // O backend deve herdar a localização se não mandarmos uma nova.
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
            denunciaOrigem: { id: currentDenuncia.id },
            
            // Se o usuário logado for Gestor de Instituição, precisamos vincular a instituição ao conflito também?
            // O backend ServicoConflito.cadastarConflitoDiretamente herda a instituição do DTO.
            // Se a denúncia já tem instituição, o conflito não herda automaticamente no backend atual (ServicoConflito).
            // Seria bom enviar aqui.
        };
        
        // Se for gestor instituição, anexa a instituição
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
            alert("Conflito gerado com sucesso!");
            convertModal.classList.remove('show');
            loadDenuncias();
        } catch(err) {
            alert("Erro ao gerar conflito: " + err.message);
        } finally {
            btn.disabled = false;
        }
    });
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