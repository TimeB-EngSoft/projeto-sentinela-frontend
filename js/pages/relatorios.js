document.addEventListener('DOMContentLoaded', function () {

    // Função que carrega os dados do usuário no cabeçalho (navbar)
    // Nome hardcoded

    function loadHeaderUserData() {
        // Mock de dados, se não estiverem no localStorage
        //const userName = localStorage.getItem('userName') || 'Secretário(a)';
        const userName = 'Alice Oliveira'; // temporário
        const userCargo = localStorage.getItem('userCargo') || 'FUNAI';
        localStorage.setItem('userName', userName); // temporário

        if (userName) { // teste
            document.getElementById('headerUserName').textContent = userName;
        } else {
            document.getElementById('headerUserName').textContent = 'Usuário';
        }

        // Preenche o nome (apenas o primeiro nome para caber)
        //const headerUserName = document.getElementById('headerUserName');
        //if (headerUserName) {
        //    headerUserName.textContent = userName.split(' ')[0];
        //}

        // Preenche o cargo
        //const headerUserRole = document.getElementById('headerUserRole');
        //if (headerUserRole) {
        //    headerUserRole.textContent = userCargo;
        //}

        // Simples inicial para o avatar
        //const avatar = document.getElementById('headerUserAvatar');
        //if (userName && avatar) {
        //    const inicial = userName.charAt(0).toUpperCase();
        //    avatar.innerHTML = `<span>${inicial}</span>`;
        //    avatar.classList.remove('avatar-placeholder');
        //}
    }

    loadHeaderUserData();

    // --- 2. Lógica do Menu Hambúrguer ---

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

    // --- 3. Carregamento da Lista de Relatórios Recentes ---

    // dados temporários
    const mockRecentReports = [
        { name: 'Relatorio_Geral_Out2025.pdf', size: '3.2 MB', type: 'PDF', date: '14/10/2025' },
        { name: 'Conflitos_Regiao_Norte.xlsx', size: '1.8 MB', type: 'Excel', date: '12/10/2025' },
        { name: 'Evolucao_Temporal_2025.pdf', size: '2.5 MB', type: 'PDF', date: '08/10/2025' },
        { name: 'Analise_Instituicoes.csv', size: '456 KB', type: 'CSV', date: '05/10/2025' },
    ];

    // coleta de ícones do fonte awesome para o tipo de arquivo
    function getFileIcon(type) {
        switch (type.toLowerCase()) {
            case 'pdf':
                return 'fas fa-file-pdf';
            case 'excel':
            case 'xlsx':
                return 'fas fa-file-excel';
            case 'csv':
                return 'fas fa-file-csv';
            default:
                return 'fas fa-file';
        }
    }

    // formatação temporária da exibição dos arquivos
    function renderRecentReports(reports) {
        const listContainer = document.getElementById('recentReportsList');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        reports.forEach(report => {
            const iconClass = getFileIcon(report.type);

            const html = `
                <div class="report-item">
                    <i class="${iconClass} report-icon"></i>
                    <div class="file-details">
                        <p>${report.name}</p>
                        <small>${report.type} • ${report.size}</small>
                    </div>
                    <span class="report-status">Concluído</span>
                    <span class="report-date">${report.date}</span>
                    <button class="report-download-btn" title="Baixar"><i class="fas fa-download"></i></button>
                </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', html);
        });
    }

    renderRecentReports(mockRecentReports);

    // simulação da geração de relátorio
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', () => {
            // Em uma aplicação real, a lógica de geração seria acionada aqui
            const tipoRelatorio = document.getElementById('tipoRelatorio').value;
            const dataInicial = document.getElementById('dataInicial').value;
            const formato = document.getElementById('formato').value;

            console.log(`Simulação: Gerando Relatório...`);
            console.log(`Tipo: ${tipoRelatorio || 'Não selecionado'} | De: ${dataInicial || 'Inicio'}`);
            console.log(`Formato: ${formato}`);

            alert(`Simulação de Geração: Relatório de tipo "${tipoRelatorio || 'Geral'}" em formato "${formato.toUpperCase()}" solicitado com sucesso!`);
        });
    }
});