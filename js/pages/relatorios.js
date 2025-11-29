import { gerarRelatorio } from '../services/apiService.js';

export async function init() {
    // Mantém a lista mockada de "recentes" ou cria um endpoint para isso no futuro
    renderRecentReports(); 
    setupGenerateButton();
}

function setupGenerateButton() {
    const btn = document.getElementById('generateReportBtn');
    if (!btn) return;

    // Clonar para remover listeners antigos
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', async () => {
        // 1. Captura o email do usuário logado para auditoria
        const userEmail = localStorage.getItem('userEmail') || 'Anônimo';

        const filtros = {
            tipoRelatorio: document.getElementById('tipoRelatorio').value,
            dataInicial: document.getElementById('dataInicial').value,
            dataFinal: document.getElementById('dataFinal').value,
            estado: document.getElementById('estado').value,
            status: document.getElementById('status').value,
            formato: document.getElementById('formato').value,
            // 2. Envia o email no payload
            emailUsuario: userEmail
        };

        newBtn.disabled = true;
        newBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';

        try {
            const blob = await gerarRelatorio(filtros);
            
            // 3. Define a extensão correta baseada no formato escolhido
            let extension = 'csv';
            if (filtros.formato === 'pdf') extension = 'pdf';
            else if (filtros.formato === 'xlsx') extension = 'xlsx';

            // Cria link invisível para download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio_sentinela_${new Date().toISOString().split('T')[0]}.${extension}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            // Adiciona à lista de recentes com o formato correto
            addToRecentList(filtros.tipoRelatorio || 'Relatório Personalizado', extension);

        } catch (error) {
            console.error(error);
            alert("Erro ao gerar relatório: " + (error.message || "Erro desconhecido"));
        } finally {
            newBtn.disabled = false;
            newBtn.innerHTML = '<i class="fas fa-file-export"></i> Gerar Relatório';
        }
    });
}

function renderRecentReports() {
    // Mock inicial (pode ser removido se quiser começar vazio)
}

function addToRecentList(name, format = 'csv') {
    const list = document.getElementById('recentReportsList');
    if(!list) return;
    
    // Define ícone e cor baseado no formato
    let icon = 'fa-file-csv';
    let color = '#28a745'; // Verde para CSV
    
    if (format === 'pdf') {
        icon = 'fa-file-pdf';
        color = '#dc3545'; // Vermelho para PDF
    } else if (format === 'xlsx') {
        icon = 'fa-file-excel';
        color = '#198754'; // Verde escuro para Excel
    }
    
    const html = `
        <div class="report-item">
            <i class="fas ${icon} report-icon" style="color: ${color};"></i>
            <div class="file-details">
                <p>${name}</p>
                <small>${format.toUpperCase()} • Gerado agora</small>
            </div>
            <span class="report-status">Concluído</span>
            <span class="report-date">Hoje</span>
            <button class="report-download-btn" title="Baixar novamente"><i class="fas fa-download"></i></button>
        </div>
    `;
    list.insertAdjacentHTML('afterbegin', html);
}