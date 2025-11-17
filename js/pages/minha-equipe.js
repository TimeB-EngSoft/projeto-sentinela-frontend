import { listUsersByStatus } from '../services/apiService.js';

// ##################################################################
// ##                  INICIALIZAÇÃO DA PÁGINA                     ##
// ##################################################################

document.addEventListener('DOMContentLoaded', () => {
    loadHeaderUserData();
    setupSidebarToggle();
    loadTeamMembers();
    // A lógica da busca e do modal "Adicionar Membro" pode ser adicionada aqui depois
});

// ##################################################################
// ##                  FUNÇÕES BÁSICAS DE SETUP                    ##
// ##################################################################

function loadHeaderUserData() {
    const userName = localStorage.getItem('userName');
    const headerName = document.getElementById('headerUserName');
    if (headerName) {
        headerName.textContent = userName || 'Usuário';
    }

    const avatar = document.getElementById('headerUserAvatar');
    if (avatar) {
        if (userName) {
            avatar.classList.remove('avatar-placeholder');
            avatar.innerHTML = `<span>${userName.charAt(0).toUpperCase()}</span>`;
            // Você pode customizar o avatar se quiser
        } else {
            avatar.classList.add('avatar-placeholder');
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        }
    }
}

function setupSidebarToggle() {
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
            const isClickOnMenuToggle = menuToggle ? menuToggle.contains(event.target) : false;

            if (!isClickInsideSidebar && !isClickOnMenuToggle) {
                sidebar.classList.remove('open');
            }
        }
    });
}

// ##################################################################
// ##                  CARREGAR MEMBROS DA EQUIPE                  ##
// ##################################################################

/**
 * Busca todos os usuários ativos, filtra pela equipe da secretaria e renderiza na tela.
 */
async function loadTeamMembers() {
    const gridContainer = document.querySelector('.team-grid');
    if (!gridContainer) {
        console.error('Container .team-grid não encontrado.');
        return;
    }

    gridContainer.innerHTML = '<p>Carregando membros da equipe...</p>';

    try {
        // 1. Busca TODOS os usuários ativos
        const allActiveUsers = await listUsersByStatus('ATIVO');

        // 2. Filtra apenas os usuários da secretaria
        const equipeSecretaria = allActiveUsers.filter(user => {
            return user.cargo === 'GESTOR_SECRETARIA' || 
                   user.cargo === 'USUARIO_SECRETARIA';
        });

        if (!equipeSecretaria || equipeSecretaria.length === 0) {
            gridContainer.innerHTML = '<p>Nenhum membro da equipe encontrado.</p>';
            updateStatsCards(0); // Atualiza os stats para 0
            return;
        }

        // 3. Renderiza os cards
        gridContainer.innerHTML = ''; // Limpa a mensagem "Carregando..."
        equipeSecretaria.forEach(member => {
            const cardHTML = createTeamCard(member);
            gridContainer.insertAdjacentHTML('beforeend', cardHTML);
        });

        // 4. Atualiza os cards de estatísticas
        updateStatsCards(equipeSecretaria.length);

    } catch (error) {
        console.error('Erro ao carregar equipe:', error);
        gridContainer.innerHTML = `<p style="color: red;">${error.message || 'Erro ao carregar membros da equipe.'}</p>`;
    }
}

/**
 * Cria o HTML para um único card de membro da equipe.
 */
function createTeamCard(user) {
    const initials = (user.nome || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const style = getRoleStyle(user.cargo);
    
    // Formata o cargo para exibição (ex: "GESTOR_SECRETARIA" -> "Gestor Secretaria")
    const cargoText = user.cargo.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

    // Nota: A API não fornece estatísticas de "Resolvidos" e "Pendentes" por usuário.
    // Vamos preencher com '—' por enquanto.
    
    return `
    <div class="team-card">
        <div class="team-card__avatar" style="background-color: ${style.bgColor}; color: ${style.color};">${initials}</div>
        <div class="team-card__info">
            <h4>${user.nome}</h4>
            <p>${cargoText}</p>
        </div>
        <div class="team-card__contact">
            <span><i class="fas fa-envelope"></i> ${user.email || 'Email não informado'}</span>
            <span><i class="fas fa-phone"></i> ${user.telefone || 'Telefone não informado'}</span>
        </div>
        <div class="team-card__stats">
            <div class="stat">
                <strong>—</strong>
                <small>Resolvidos</small>
            </div>
            <div class="stat">
                <strong>—</strong>
                <small>Pendentes</small>
            </div>
        </div>
        <div class="team-card__footer">
            <button class="btn btn-secondary" data-user-id="${user.id}"><i class="fas fa-eye"></i> Ver Detalhes</button>
        </div>
    </div>
    `;
}

/**
 * Helper para definir a cor do avatar com base no cargo.
 */
function getRoleStyle(cargo) {
    if (cargo === 'GESTOR_SECRETARIA') {
        return { bgColor: '#fceeee', color: '#d9534f' }; // Estilo Gestor (Vermelho)
    }
    // Padrão para USUARIO_SECRETARIA
    return { bgColor: '#fef8e5', color: '#f0ad4e' }; // Estilo Usuário (Amarelo)
}

/**
 * Atualiza os cards de estatísticas no topo da página.
 */
function updateStatsCards(totalMembers) {
    const totalCard = document.querySelector('.stats-grid .stat-card:nth-child(1) span');
    const activeCard = document.querySelector('.stats-grid .stat-card:nth-child(2) span');

    if (totalCard) {
        totalCard.textContent = totalMembers;
    }
    if (activeCard) {
        activeCard.textContent = totalMembers; // Assumindo que todos listados estão ativos
    }
}