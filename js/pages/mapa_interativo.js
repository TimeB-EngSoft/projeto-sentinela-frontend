document.addEventListener('DOMContentLoaded', function () {

    // Função que carrega os dados do usuário no cabeçalho (navbar)
    // Nome hardcoded

    function loadHeaderUserData() { 
        //const userName = localStorage.getItem('userName') || 'Secretário(a)';
        const userName = 'Alice Oliveira'; // temporário
        const userCargo = localStorage.getItem('userCargo') || 'FUNAI';
        localStorage.setItem('userName', userName); // temporário

        if (userName) { // temporário
            document.getElementById('headerUserName').textContent = userName;
        } else {
            document.getElementById('headerUserName').textContent = 'Usuário';
        }

        //const headerUserName = document.getElementById('headerUserName');
        //if (headerUserName) {
        //    // Apenas o primeiro nome para caber
        //    headerUserName.textContent = userName.split(' ')[0];
        //}

        //const headerUserRole = document.getElementById('headerUserRole');
        //if (headerUserRole) {
        //    headerUserRole.textContent = userCargo;
        //}

        //const avatar = document.getElementById('headerUserAvatar');
        //if (userName && avatar) {
        //    const inicial = userName.charAt(0).toUpperCase();
        //    avatar.innerHTML = `<span>${inicial}</span>`;
        //    avatar.classList.remove('avatar-placeholder');
        //}
    }

    loadHeaderUserData();

    // variáveis do sidebar
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    // Implementação completa da lógica do menu hambúrguer e clique fora
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });
    }

    if (mainContent && sidebar) {
        mainContent.addEventListener('click', (event) => {
            // Se o menu estiver aberto e o clique não for dentro da sidebar/toggle
            if (sidebar.classList.contains('open')) {
                const isClickInsideSidebar = sidebar.contains(event.target);
                const isClickOnMenuToggle = menuToggle.contains(event.target);

                if (!isClickInsideSidebar && !isClickOnMenuToggle) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }

    // --- 3. Carregamento e Renderização de Dados Simulados ---
    
    // Dados temporários
    const mockInstitutions = [
        { name: 'Escola Municipal Santos Dumont', type: 'Escola Municipal', conflicts: 12, gravity: 'medium' },
        { name: 'Colégio Estadual Dom Pedro', type: 'Colégio Estadual', conflicts: 8, gravity: 'low' },
        { name: 'Centro Educacional Madre Teresa', type: 'Centro Educacional', conflicts: 23, gravity: 'high' },
    ];

    // Dados temporários
    const mockStats = {
        totalInstitutions: 3,
        totalConflicts: 43,
        highGravity: 1
    };

    // Definição dos ícones a partir da gravidade associada a instituição
    function getGravityClass(gravity) {
        switch (gravity.toLowerCase()) {
            case 'low': return 'status-dot-low';
            case 'medium': return 'status-dot-medium';
            case 'high': return 'status-dot-high';
            default: return 'status-dot-low';
        }
    }

    // formatação temporária da exibição das instituições
    function renderInstitutionList(institutions) {
        const listContainer = document.getElementById('institutionList');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        institutions.forEach(inst => {
            const statusClass = getGravityClass(inst.gravity);

            const html = `
                <div class="institution-item">
                    <div class="institution-details">
                        <p>${inst.name}</p>
                        <small>${inst.type}</small>
                        <span class="conflict-count">${inst.conflicts} conflitos</span>
                    </div>
                    <span class="${statusClass} institution-status-dot"></span>
                </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', html);
        });
    }

    function renderStats(stats) {
        document.getElementById('totalInstitutions').textContent = stats.totalInstitutions;
        document.getElementById('totalConflicts').textContent = stats.totalConflicts;
        document.getElementById('highGravity').textContent = stats.highGravity;
    }

    // Chamadas para renderizar os dados
    renderInstitutionList(mockInstitutions);
    renderStats(mockStats);
});