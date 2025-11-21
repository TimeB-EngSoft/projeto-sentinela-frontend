export async function init() {
    // Agora as funções e variáveis estão visíveis
    renderRecentReports(mockRecentReports);
    setupGenerateButton();
}

const mockRecentReports = [
    { name: 'Relatorio_Geral_Out2025.pdf', size: '3.2 MB', type: 'PDF', date: '14/10/2025' },
    { name: 'Conflitos_Regiao_Norte.xlsx', size: '1.8 MB', type: 'Excel', date: '12/10/2025' },
    { name: 'Analise_Instituicoes.csv', size: '456 KB', type: 'CSV', date: '05/10/2025' },
];

function getFileIcon(type) {
    switch (type.toLowerCase()) {
        case 'pdf': return 'fas fa-file-pdf';
        case 'excel': case 'xlsx': return 'fas fa-file-excel';
        case 'csv': return 'fas fa-file-csv';
        default: return 'fas fa-file';
    }
}

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

function setupGenerateButton() {
    const btn = document.getElementById('generateReportBtn');
    if (btn) {
        // Clonar para limpar listeners antigos
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', () => {
            const tipo = document.getElementById('tipoRelatorio').value;
            const formato = document.getElementById('formato').value;
            alert(`Simulação: Gerando relatório "${tipo}" em "${formato}"...`);
        });
    }
}