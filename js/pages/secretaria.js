import { listUsersByStatus, listarInstituicoes, listarConflitos, listarDenuncias, approveOrRejectUser } from '../services/apiService.js';

// Cores Padrão
const COLORS = {
    primary: '#D44716',
    secondary: '#F59E0B',
    info: '#3B82F6',
    success: '#10B981',
    danger: '#EF4444',
    gray: '#9CA3AF',
    palette: ['#D44716', '#F59E0B', '#2196F3', '#4CAF50', '#9C27B0', '#607D8B']
};

let dashboardMap = null;

export async function init() {
    console.log('Dashboard Iniciado...');
    const data = await loadDashboardData();
    loadPendingUsers();
    
    if(data) {
        setTimeout(() => {
            initDashboardMap(data.conflicts, data.denuncias);
        }, 100);
    }
}

async function loadDashboardData() {
    try {
        const [pendentes, ativos, institutions, conflicts, denuncias] = await Promise.all([
            listUsersByStatus('PENDENTE').catch(() => []),
            listUsersByStatus('ATIVO').catch(() => []),
            listarInstituicoes().catch(() => []),
            listarConflitos().catch(() => []),
            listarDenuncias().catch(() => [])
        ]);

        // KPIs
        updateText('stat-total-gestores', ativos.filter(u => u.cargo?.includes('GESTOR')).length);
        updateText('stat-instituicoes', institutions.filter(i => i.status === 'ATIVO').length);
        updateText('stat-conflitos', conflicts.filter(c => c.status === 'ATIVO').length);
        
        const hoje = new Date().toISOString().split('T')[0];
        const denunciasHoje = denuncias.filter(d => d.dataOcorrido && d.dataOcorrido.startsWith(hoje)).length;
        updateText('stat-denuncias-hoje', denunciasHoje);

        const badge = document.getElementById('pending-users-badge');
        if(badge) badge.textContent = pendentes.length;

        // Gráficos
        renderConflictsTypeChart(conflicts);
        renderDenunciasStatusChart(denuncias);
        renderTopCitiesChart(conflicts, denuncias);
        renderEvolutionChart(denuncias, conflicts);

        return { conflicts, denuncias };

    } catch (error) {
        console.error("Erro dashboard:", error);
        return null;
    }
}

// --- MAPA CORRIGIDO (ESTILO CLARO / GRAYSCALE) ---
function initDashboardMap(conflitos, denuncias) {
    const container = document.getElementById('dashboard-map');
    if (!container) return;

    if (dashboardMap) {
        dashboardMap.remove();
    }

    // 1. Configuração do Mapa
    dashboardMap = L.map('dashboard-map', {
        center: [-8.4, -37.5], // Centro PE
        zoom: 7,
        zoomControl: false, 
        attributionControl: false
    });

    // 2. TileLayer Voyager (Claro) com classe de filtro grayscale
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
        className: 'map-tiles-grayscale' // Aplica o filtro do CSS
    }).addTo(dashboardMap);

    // Adiciona Borda de PE (Opcional, para consistência com o outro mapa)
    addStateBorder(dashboardMap);

    const plotCircles = (items, color, radius) => {
        items.forEach(item => {
            let lat = item.latitude || (item.localizacao ? item.localizacao.latitude : null);
            let lng = item.longitude || (item.localizacao ? item.localizacao.longitude : null);

            if (lat && lng) {
                L.circleMarker([lat, lng], {
                    radius: radius,
                    fillColor: color,
                    color: null, 
                    weight: 0,
                    opacity: 1,
                    fillOpacity: 0.6 // Mais opaco para ver melhor no fundo claro
                }).addTo(dashboardMap)
                .bindPopup(`
                    <div style="text-align:center; color:#333; font-size:0.9rem;">
                        <strong>${item.tituloConflito || item.tituloDenuncia}</strong><br>
                        <small>${item.municipio || (item.localizacao ? item.localizacao.municipio : '')}</small>
                    </div>
                `);
            }
        });
    };

    // 3. Cores Padrão (Vermelho/Laranja)
    const activeConflicts = conflitos.filter(c => c.status === 'ATIVO');
    plotCircles(activeConflicts, '#e74c3c', 10); // Vermelho

    const activeDenuncias = denuncias.filter(d => d.status === 'PENDENTE');
    plotCircles(activeDenuncias, '#f39c12', 8);  // Laranja
}

async function addStateBorder(mapInstance) {
    try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v3/malhas/estados/26?formato=application/vnd.geo+json');
        if (!response.ok) return;
        const data = await response.json();
        L.geoJSON(data, {
            style: { color: '#0d6efd', weight: 2, opacity: 0.3, fill: false }
        }).addTo(mapInstance);
    } catch (e) {}
}

function updateText(id, val) {
    const el = document.getElementById(id);
    if(el) el.innerText = val;
}

// --- GRÁFICOS (Mantidos) ---

function renderConflictsTypeChart(conflitos) {
    const ctx = document.getElementById('conflitosTypeChart');
    if (!ctx) return;

    const counts = {};
    conflitos.forEach(c => {
        const label = (c.tipoConflito || 'OUTRO').replace(/_/g, ' ');
        counts[label] = (counts[label] || 0) + 1;
    });

    destroyChart(ctx);
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: COLORS.palette,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } }
        }
    });
}

function renderDenunciasStatusChart(denuncias) {
    const ctx = document.getElementById('denunciasStatusChart');
    if (!ctx) return;

    const counts = { 'PENDENTE': 0, 'APROVADA': 0, 'ARQUIVADA': 0 };
    denuncias.forEach(d => {
        let st = d.status === 'REJEITADA' ? 'ARQUIVADA' : d.status;
        if(counts.hasOwnProperty(st)) counts[st]++;
    });

    destroyChart(ctx);
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Pendente', 'Aprovada', 'Arquivada'],
            datasets: [{
                label: 'Qtd',
                data: Object.values(counts),
                backgroundColor: [COLORS.secondary, COLORS.success, COLORS.gray],
                barThickness: 40,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function renderTopCitiesChart(conflitos, denuncias) {
    const ctx = document.getElementById('topCitiesChart');
    if (!ctx) return;

    const cityCounts = {};
    [...conflitos, ...denuncias].forEach(item => {
        let city = 'N/I';
        if(item.localizacao?.municipio) city = item.localizacao.municipio;
        else if(item.municipio) city = item.municipio;
        cityCounts[city] = (cityCounts[city] || 0) + 1;
    });

    const sortedCities = Object.entries(cityCounts).sort(([,a], [,b]) => b - a).slice(0, 5);

    destroyChart(ctx);
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedCities.map(([c]) => c),
            datasets: [{
                label: 'Total',
                data: sortedCities.map(([,v]) => v),
                backgroundColor: COLORS.info,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

function renderEvolutionChart(denuncias, conflitos) {
    const ctx = document.getElementById('evolutionChart');
    if (!ctx) return;

    const months = [];
    const today = new Date();
    for(let i=5; i>=0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth()-i, 1);
        months.push(d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase());
    }

    const countMonth = (list, field) => {
        const data = [0,0,0,0,0,0];
        const currM = today.getMonth();
        const currY = today.getFullYear();
        list.forEach(item => {
            if(!item[field]) return;
            const d = new Date(item[field]);
            const diff = (currY - d.getFullYear())*12 + (currM - d.getMonth());
            if(diff >= 0 && diff <= 5) data[5-diff]++;
        });
        return data;
    };

    destroyChart(ctx);
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Denúncias',
                    data: countMonth(denuncias, 'dataOcorrido'),
                    borderColor: COLORS.secondary,
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Conflitos',
                    data: countMonth(conflitos, 'dataInicio'),
                    borderColor: COLORS.primary,
                    backgroundColor: 'rgba(212, 71, 22, 0.05)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', align: 'end' } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } }
        }
    });
}

function destroyChart(canvas) {
    const chart = Chart.getChart(canvas);
    if(chart) chart.destroy();
}

async function loadPendingUsers() {
    const container = document.getElementById('approval-list-container');
    if(!container) return;

    try {
        const users = await listUsersByStatus('PENDENTE');
        if(!users || !users.length) {
            container.innerHTML = '<div style="padding:20px; color:#999; text-align:center; width:100%;">Nenhuma pendência.</div>';
            return;
        }

        container.innerHTML = users.map(user => `
            <div class="approval-item-card" id="user-card-${user.id}">
                <div class="approval-header">
                    <div class="approval-avatar">${user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}</div>
                    <div>
                        <strong style="display:block; font-size:0.9rem;">${user.nome}</strong>
                        <small style="color:#777;">${user.instituicaoNome || 'Sem Instituição'}</small>
                    </div>
                </div>
                <div class="approval-actions">
                    <button class="btn-action btn-reject" onclick="handleApproval('${user.id}', false)">Rejeitar</button>
                    <button class="btn-action btn-approve" onclick="handleApproval('${user.id}', true)">Aprovar</button>
                </div>
            </div>
        `).join('');
        
        window.handleApproval = async (id, approved) => {
            const card = document.getElementById(`user-card-${id}`);
            if(card) card.style.opacity = '0.5';
            try {
                await approveOrRejectUser(id, approved);
                init(); 
            } catch(e) {
                alert('Erro ao processar');
                if(card) card.style.opacity = '1';
            }
        };

    } catch(e) {
        container.innerHTML = '<div style="color:red; padding:10px;">Erro ao carregar lista.</div>';
    }
}