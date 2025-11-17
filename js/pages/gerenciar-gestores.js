// Importa as funções de apiService.js
import { 
    listUsersByStatus, 
    getUserData, 
    updateUser,
    cadastrarParcial,
    approveOrRejectUser,
    listarInstituicoes
} from '../services/apiService.js';

// Armazena todos os gestores carregados para filtragem
let allManagers = [];
// Cache para a lista de instituições (usado no modal 'Adicionar')
let cachedInstitutions = null;

// ##################################################################
// ##                  INICIALIZAÇÃO DA PÁGINA                     ##
// ##################################################################

document.addEventListener('DOMContentLoaded', function() {
    loadHeaderUserData();
    setupMobileMenu();
    loadAllManagers();
    
    // Configura os listeners dos modais
    setupAddManagerModal();
    setupDetailsModal();
    
    // Configura o filtro de busca
    setupSearchFilter();
});

// --- Funções Reutilizadas (Setup) ---
function loadHeaderUserData() {
    const userName = localStorage.getItem('userName');
    if (userName) {
        document.getElementById('headerUserName').textContent = userName;
    } else {
        document.getElementById('headerUserName').textContent = 'Usuário';
    }
    // Lógica do Avatar (se necessário)
}

function setupMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    document.addEventListener('click', (event) => {
        if (sidebar && sidebar.classList.contains('open')) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnMenuToggle = menuToggle && menuToggle.contains(event.target);

            if (!isClickInsideSidebar && !isClickOnMenuToggle) {
                sidebar.classList.remove('open');
            }
        }
    });
}

// ##################################################################
// ##                 CARREGAR E RENDERIZAR GESTORES               ##
// ##################################################################

/**
 * Busca todos os usuários (ativos, pendentes, inativos) e filtra por gestores.
 */
async function loadAllManagers() {
    const tableBody = document.getElementById('managers-table-body');
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Carregando gestores...</td></tr>';

    try {
        const activeUsers = await fetchUsersSafely('ATIVO');
        const pendingUsers = await fetchUsersSafely('PENDENTE');
        const inactiveUsers = await fetchUsersSafely('INATIVO');

        const allUsers = [...activeUsers, ...pendingUsers, ...inactiveUsers];

        // Filtra apenas usuários cujo cargo é de GESTOR
        allManagers = allUsers.filter(user => 
            user.cargo === 'GESTOR_SECRETARIA' || 
            user.cargo === 'GESTOR_INSTITUICAO'
        );

        renderManagersTable(allManagers);
        updateStatsCards(allManagers);

    } catch (error) {
        console.error('Erro ao carregar gestores:', error);
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: red;">${error.message || 'Erro ao carregar lista.'}</td></tr>`;
    }
}

/**
 * Função auxiliar para buscar usuários por status, tratando o erro "Não há usuários" como lista vazia.
 */
async function fetchUsersSafely(status) {
    try {
        return await listUsersByStatus(status);
    } catch (error) {
        if (error.message && error.message.includes("Não há usuários com este status")) {
            return []; // Retorna lista vazia em vez de lançar erro
        }
        throw error; // Lança outros erros
    }
}

/**
 * Renderiza a lista de gestores na tabela.
 */
function renderManagersTable(managersToRender) {
    const tableBody = document.getElementById('managers-table-body');
    tableBody.innerHTML = ''; // Limpa a tabela

    if (managersToRender.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Nenhum gestor encontrado.</td></tr>';
        return;
    }

    managersToRender.forEach(user => {
        const row = document.createElement('tr');
        
        const tipoTag = getRoleTag(user.cargo);
        const statusTag = getStatusTag(user.status);
        
        // O DTO de 'listUsersByStatus' pode ter 'instituicaoNome' ou 'instituicao' (objeto)
        // O DTO de ATIVO tem 'instituicao' como objeto. Os outros têm 'instituicaoNome' como string.
        let instituicaoNome = '—';
        if (user.instituicao) {
            instituicaoNome = user.instituicao.nome || '—';
        } else if (user.instituicaoNome) {
            instituicaoNome = user.instituicaoNome;
        }
        
        // Dados de Conflitos e Usuários não vêm da API, como observado
        const conflitosCount = '—';
        const usuariosCount = '—';

        row.innerHTML = `
            <td>${user.nome}</td>
            <td>${user.email}</td>
            <td><span class="tag ${tipoTag.tagClass}">${tipoTag.text}</span></td>
            <td>${instituicaoNome}</td>
            <td><span class="status-badge ${statusTag.class}">${statusTag.text}</span></td>
            <td>${conflitosCount}</td>
            <td>${usuariosCount}</td>
            <td><a href="#" class="action-link" data-action="details" data-user-id="${user.id}">Ver Detalhes</a></td>
        `;
        tableBody.appendChild(row);
    });
}

function getRoleTag(cargo) {
    if (cargo === 'GESTOR_SECRETARIA') {
        return { tagClass: 'tag-gestor-secretaria', text: 'Gestor Secretaria' };
    }
    if (cargo === 'GESTOR_INSTITUICAO') {
        return { tagClass: 'tag-instituicao', text: 'Gestor Instituição' };
    }
    return { tagClass: 'tag-default', text: cargo };
}

function getStatusTag(status) {
    switch(status) {
        case 'ATIVO':
            return { class: 'status-ativo', text: 'Ativo' };
        case 'INATIVO':
            return { class: 'status-inativo', text: 'Inativo' };
        case 'PENDENTE':
            return { class: 'status-pendente', text: 'Pendente' };
        default:
            return { class: '', text: status };
    }
}

/**
 * Atualiza os cards de estatísticas no topo da página.
 */
function updateStatsCards(managers) {
    document.getElementById('stat-total-gestores').textContent = managers.length;
    document.getElementById('stat-gestores-ativos').textContent = managers.filter(u => u.status === 'ATIVO').length;
    document.getElementById('stat-gestores-pendentes').textContent = managers.filter(u => u.status === 'PENDENTE').length;
    document.getElementById('stat-gestores-inativos').textContent = managers.filter(u => u.status === 'INATIVO').length;
}

// ##################################################################
// ##                    FILTRO DE BUSCA                           ##
// ##################################################################

function setupSearchFilter() {
    const searchInput = document.getElementById('manager-search-input');
    
    searchInput.addEventListener('keyup', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        const filteredManagers = allManagers.filter(user => {
            const nome = user.nome.toLowerCase();
            const email = (user.email || '').toLowerCase();
            return nome.includes(searchTerm) || email.includes(searchTerm);
        });
        
        renderManagersTable(filteredManagers);
    });
}

// ##################################################################
// ##               LÓGICA DO MODAL (ADICIONAR GESTOR)             ##
// ##################################################################

function setupAddManagerModal() {
    const modal = document.getElementById('modal-add-manager');
    const openButton = document.getElementById('addManagerButton');
    const form = document.getElementById('form-add-manager');
    const cargoSelect = document.getElementById('add-cargo');
    const instituicaoGroup = document.getElementById('add-instituicao-group');
    const instituicaoSelect = document.getElementById('add-instituicao-select');

    openButton.addEventListener('click', () => {
        modal.classList.add('show');
        // Popula as instituições (usará cache se disponível)
        populateInstitutionsDropdown(instituicaoSelect);
    });
    
    // Fechar modal
    modal.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => modal.classList.remove('show'));
    });
    
    // Mostra/esconde o dropdown de instituições
    cargoSelect.addEventListener('change', () => {
        if (cargoSelect.value === 'GESTOR_INSTITUICAO') {
            instituicaoGroup.style.display = 'block';
            instituicaoSelect.setAttribute('required', 'required');
        } else {
            instituicaoGroup.style.display = 'none';
            instituicaoSelect.removeAttribute('required');
        }
    });

    // Envio do formulário
    form.addEventListener('submit', handleAddManagerSubmit);
}

/**
 * Popula o dropdown de instituições (usando cache)
 */
async function populateInstitutionsDropdown(selectElement) {
    if (cachedInstitutions) {
        renderInstitutionOptions(selectElement, cachedInstitutions);
        return;
    }
    
    selectElement.innerHTML = '<option value="">Carregando...</option>';
    try {
        const institutions = await listarInstituicoes();
        cachedInstitutions = institutions || [];
        renderInstitutionOptions(selectElement, cachedInstitutions);
    } catch (error) {
        selectElement.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

function renderInstitutionOptions(select, institutions) {
    select.innerHTML = '<option value="" disabled selected>Selecione uma instituição</option>';
    institutions.forEach(inst => {
        const option = document.createElement('option');
        option.value = inst.nome; // O 'cadastrarParcial' espera o NOME da instituição
        option.textContent = `${inst.nome} (${inst.sigla || 'Sem Sigla'})`;
        select.appendChild(option);
    });
}

/**
 * Lida com o envio do formulário de novo gestor (cadastro + aprovação).
 */
async function handleAddManagerSubmit(event) {
    event.preventDefault();
    const submitButton = document.getElementById('add-manager-submit-button');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    const nome = document.getElementById('add-nome').value;
    const email = document.getElementById('add-email').value;
    const cargo = document.getElementById('add-cargo').value;
    const instituicaoNome = (cargo === 'GESTOR_INSTITUICAO') 
        ? document.getElementById('add-instituicao-select').value 
        : 'Secretaria'; // Default para Gestor da Secretaria

    if (cargo === 'GESTOR_INSTITUICAO' && !instituicaoNome) {
        alert('Por favor, selecione uma instituição.');
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Convite';
        return;
    }
    
    try {
        // ETAPA 1: Cadastrar o usuário (status PENDENTE)
        await cadastrarParcial({
            nome,
            email,
            cargo,
            instituicao: instituicaoNome, // O DTO usa 'instituicao' para o nome
            justificativa: 'Gestor adicionado pelo administrador.'
        });

        // ETAPA 2: Buscar o ID do usuário recém-criado
        const pendingUsers = await fetchUsersSafely('PENDENTE');
        const newUser = pendingUsers.find(u => u.email === email);

        if (!newUser) {
            throw new Error('Não foi possível encontrar o gestor recém-criado para aprovação.');
        }

        // ETAPA 3: Aprovar o usuário (isso dispara o e-mail de cadastro)
        await approveOrRejectUser(newUser.id, true);

        alert('Gestor adicionado com sucesso! Um e-mail de cadastro foi enviado para ' + email);
        document.getElementById('form-add-manager').reset();
        document.getElementById('add-instituicao-group').style.display = 'none';
        document.getElementById('modal-add-manager').classList.remove('show');
        
        loadAllManagers(); // Recarrega a lista

    } catch (error) {
        console.error('Erro ao adicionar gestor:', error);
        alert(error.message || 'Erro ao adicionar gestor. Verifique se o e-mail já está em uso.');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Convite';
    }
}


// ##################################################################
// ##            LÓGICA DO MODAL (DETALHES DO GESTOR)              ##
// ##################################################################

function setupDetailsModal() {
    const tableBody = document.getElementById('managers-table-body');
    const modal = document.getElementById('modal-manager-details');

    // Listener de clique na tabela (delegação de eventos)
    tableBody.addEventListener('click', (event) => {
        const link = event.target.closest('a[data-action="details"]');
        if (link) {
            event.preventDefault();
            const userId = link.dataset.userId;
            handleViewDetails(userId);
        }
    });

    // Listeners para fechar o modal
    modal.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => modal.classList.remove('show'));
    });
}

/**
 * Busca dados do usuário e exibe o modal de detalhes.
 */
async function handleViewDetails(userId) {
    const modal = document.getElementById('modal-manager-details');
    const modalBody = document.getElementById('detail-modal-body');
    const modalTitle = document.getElementById('detail-modal-title');
    const actionButton = document.getElementById('detail-action-button');

    modal.classList.add('show');
    modalTitle.textContent = 'Detalhes do Gestor';
    modalBody.innerHTML = '<p>Carregando...</p>';
    actionButton.style.display = 'none'; // Esconde o botão até ter os dados

    try {
        const user = await getUserData(userId);
        
        const cargoText = getRoleTag(user.cargo).text;
        const statusTag = getStatusTag(user.status);
        const instituicaoNome = user.instituicao ? user.instituicao.nome : (user.instituicaoNome || '—');

        modalTitle.textContent = user.nome;
        modalBody.innerHTML = `
            <ul class="user-details-list">
                <li><strong>Nome:</strong> <span>${user.nome}</span></li>
                <li><strong>Email:</strong> <span>${user.email}</span></li>
                <li><strong>Cargo:</strong> <span>${cargoText}</span></li>
                <li><strong>Instituição:</strong> <span>${instituicaoNome}</span></li>
                <li><strong>Telefone:</strong> <span>${user.telefone || 'Não informado'}</span></li>
                <li><strong>CPF:</strong> <span>${user.cpf || 'Não informado'}</span></li>
                <li><strong>Status:</strong> <span><div class="status-badge ${statusTag.class}">${statusTag.text}</div></span></li>
            </ul>
        `;

        // Configura o botão de Ação (Ativar/Bloquear)
        // Não mostramos o botão para usuários PENDENTES (devem ser aprovados na tela 'Usuários do Sistema')
        if (user.status === 'ATIVO' || user.status === 'INATIVO') {
            actionButton.dataset.userId = user.id;
            if (user.status === 'ATIVO') {
                actionButton.textContent = 'Bloquear Gestor';
                actionButton.className = 'btn btn-danger'; // Vermelho para bloquear
                actionButton.dataset.action = 'INATIVO';
            } else {
                actionButton.textContent = 'Ativar Gestor';
                actionButton.className = 'btn btn-success'; // Verde para ativar
                actionButton.dataset.action = 'ATIVO';
            }
            
            actionButton.style.display = 'block';
            
            // Remove listener antigo e adiciona novo para evitar duplicatas
            actionButton.replaceWith(actionButton.cloneNode(true));
            document.getElementById('detail-action-button').addEventListener('click', handleUpdateUserStatus);
        } else {
             actionButton.style.display = 'none';
        }

    } catch (error) {
        console.error('Erro ao buscar detalhes do gestor:', error);
        modalBody.innerHTML = `<p style="color: red;">${error.message || 'Erro ao carregar dados.'}</p>`;
    }
}

/**
 * Lida com o clique do botão "Bloquear" ou "Ativar" no modal de detalhes.
 */
async function handleUpdateUserStatus(event) {
    const button = event.currentTarget;
    const userId = button.dataset.userId;
    const newStatus = button.dataset.action;
    
    const actionText = newStatus === 'ATIVO' ? 'ativar' : 'bloquear';
    
    if (!confirm(`Tem certeza de que deseja ${actionText} este gestor?`)) {
        return;
    }

    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

    try {
        await updateUser(userId, { status: newStatus }); 
        
        alert(`Gestor ${actionText} com sucesso!`);
        document.getElementById('modal-manager-details').classList.remove('show');
        loadAllManagers(); // Recarrega a lista para refletir a mudança
        
    } catch (error) {
        console.error(`Erro ao ${actionText} gestor:`, error);
        alert(error.message || `Não foi possível ${actionText} o gestor.`);
    } finally {
        button.disabled = false;
        // O texto do botão será redefinido na próxima vez que o modal abrir
    }
}