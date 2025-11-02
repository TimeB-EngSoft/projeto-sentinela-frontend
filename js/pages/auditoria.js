document.addEventListener('DOMContentLoaded', function () {

    // Função que carrega os dados do usuário no cabeçalho (navbar)
    // Nome hardcoded

    function loadHeaderUserData() {
        //const userName = localStorage.getItem('userName') || 'Secretário(a)';
        const userName = 'Alice Oliveira'; // temporário
        const userCargo = localStorage.getItem('userCargo') || 'FUNAI';
        localStorage.setItem('userName', userName); // temporário

        document.getElementById('headerUserName').textContent = userName.split(' ')[0];

        if (userName) { // teste
            document.getElementById('headerUserName').textContent = userName;
        } else {
            document.getElementById('headerUserName').textContent = 'Usuário';
        }

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

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });
    }

    // fecha o sidebar quando clicar fora
    if (mainContent && sidebar) {
        mainContent.addEventListener('click', () => {
            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    }


    // dados temporários
    const mockLogs = [
        { dateTime: '2024-03-20<br>14:35:22', user: 'maria.silva@escola.edu.br', action: 'Login no sistema', module: 'Autenticação', details: 'Acesso realizado com sucesso', level: 'info', ip: '192.168.1.100' },
        { dateTime: '2024-03-20<br>13:22:15', user: 'joao.santos@escola.edu.br', action: 'Tentativa de acesso negada', module: 'Autorização', details: 'Tentativa de acesso a módulo sem permissão', level: 'aviso', ip: '192.168.1.105' },
        { dateTime: '2024-03-20<br>03:00:00', user: 'sistema', action: 'Backup automático', module: 'Sistema', details: 'Backup diário executado com sucesso', level: 'info', ip: '127.0.0.1' },
        { dateTime: '2024-03-19<br>16:45:30', user: 'ana.oliveira@escola.edu.br', action: 'Alteração de dados sensíveis', module: 'Configurações', details: 'Alterou configurações de segurança da instituição', level: 'aviso', ip: '192.168.1.110' },
        { dateTime: '2024-03-19<br>11:20:45', user: 'carlos.admin@secretaria.gov.br', action: 'Erro no sistema', module: 'Relatórios', details: 'Falha ao gerar relatório mensal - timeout na conexão', level: 'erro', ip: '192.168.1.95' },
    ];

    function renderLogsTable(logs) {
        const tableBody = document.getElementById('logsTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        logs.forEach(log => {
            // Renderiza o Nível como uma tag colorida (info, aviso, erro)
            const levelTag = `<span class="level-tag ${log.level}">${log.level.toUpperCase()}</span>`;

            // Renderiza o Módulo como uma tag destacada
            const moduleTag = `<span class="module-tag">${log.module}</span>`;

            const rowHtml = `
                <td>${log.dateTime}</td>
                <td>${log.user}</td>
                <td>${log.action}</td>
                <td>${moduleTag}</td>
                <td>${log.details}</td>
                <td>${levelTag}</td>
                <td>${log.ip}</td>
            `;

            // Usando insertRow() e innerHTML do elemento para garantir compatibilidade e funcionamento
            const row = tableBody.insertRow();
            row.innerHTML = rowHtml;
        });
    }

    renderLogsTable(mockLogs);

    
    // dados temporários
    const mockActionsFrequency = [
        { action: 'Login no sistema', count: 156 },
        { action: 'Aprovação de usuários', count: 83 },
        { action: 'Consulta de relatórios', count: 38 },
        { action: 'Alteração de dados', count: 29 },
    ];

    // dados temporários
    const mockUsersActivity = [
        { user: 'maria.silva@escola.gov.br', count: 89 },
        { user: 'joao.santos@escola.edu.br', count: 57 },
        { user: 'ana.oliveira@escola.edu.br', count: 52 },
        { user: 'carlos.admin@secretaria.gov.br', count: 41 },
    ];

    function renderFrequencyList(listId, data) {
        const listContainer = document.getElementById(listId);
        if (!listContainer) return;
        listContainer.innerHTML = '';

        data.forEach(item => {
            const isActionList = !!item.action;
            const textContent = isActionList ? item.action : item.user;
            const badgeLabel = isActionList ? 'ações' : 'acessos';

            const html = `
                <div class="frequency-item">
                    <p>${textContent}</p>
                    <span class="frequency-badge">${item.count} ${badgeLabel}</span>
                </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', html);
        });

        // Este loop é mantido, mas o anterior já resolve o conteúdo.
        // É apenas para garantir que as cores corretas do CSS sejam aplicadas.
        document.querySelectorAll(`#${listId} .frequency-badge`).forEach((badge, index) => {
            // Apenas o count, como na imagem original (ex: '156')
            const isActionList = !!data[index].action;
            badge.textContent = data[index].count + (isActionList ? '' : ' acessos');
        });
    }

    renderFrequencyList('actionsFrequencyList', mockActionsFrequency);
    renderFrequencyList('usersActivityList', mockUsersActivity);
});