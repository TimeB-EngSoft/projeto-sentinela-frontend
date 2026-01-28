import { listUsersByStatus, listarInstituicoes, listarConflitos, listarDenuncias, approveOrRejectUser } from '../services/apiService.js';

// --- CONFIGURAÇÕES VISUAIS PROFISSIONAIS ---
Chart.defaults.font.family = "'Poppins', sans-serif";
Chart.defaults.color = '#666';
Chart.defaults.scale.grid.color = '#f0f0f0';
Chart.defaults.scale.grid.borderColor = 'transparent'; // Remove borda dura dos eixos

const COLORS = {
    primary: '#D44716',     // Laranja forte (Identidade)
    primaryLight: 'rgba(212, 71, 22, 0.1)',
    secondary: '#F59E0B',   // Amarelo/Laranja
    success: '#10B981',     // Verde
    info: '#3B82F6',        // Azul
    danger: '#EF4444',      // Vermelho
    gray: '#9CA3AF',        // Cinza
    text: '#374151',
    // Paleta sofisticada para gráficos de pizza/doughnut
    palette: [
        '#D44716', // Laranja
        '#3B82F6', // Azul
        '#10B981', // Verde
        '#F59E0B', // Amarelo
        '#8B5CF6', // Roxo
        '#64748B'  // Slate
    ]
};

// Configuração de Marcadores do Mapa
const MARKER_CONFIG = {
    conflito: { color: '#e74c3c', label: 'Conflito', icon: 'fa-exclamation' },
    denuncia: { color: '#f39c12', label: 'Denúncia', icon: 'fa-bullhorn' }
};

let dashboardMap = null;
let markerClusterGroup = null;

// --- INICIALIZAÇÃO ---
export async function init() {
    console.log('Dashboard Secretaria iniciado (Visual Pro).');
    const data = await loadDashboardData();
    loadPendingUsers();
    
    // Pequeno delay para garantir que o container do mapa tenha tamanho definido
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

        // KPIs (Indicadores)
        updateText('stat-total-gestores', ativos.filter(u => u.cargo?.includes('GESTOR')).length);
        updateText('stat-instituicoes', institutions.filter(i => i.status === 'ATIVO').length);
        updateText('stat-conflitos', conflicts.filter(c => c.status === 'ATIVO').length);
        
        const hoje = new Date().toISOString().split('T')[0];
        const denunciasHoje = denuncias.filter(d => d.dataOcorrido && d.dataOcorrido.startsWith(hoje)).length;
        updateText('stat-denuncias-hoje', denunciasHoje);

        const badge = document.getElementById('pending-users-badge');
        if(badge) badge.textContent = pendentes.length;

        // Renderização dos Gráficos Profissionais
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

// --- MAPA (Cluster Vermelho + Borda Azul + Ícones Customizados) ---
function initDashboardMap(conflitos, denuncias) {
    const container = document.getElementById('dashboard-map');
    if (!container) return;

    if (dashboardMap) {
        dashboardMap.remove();
    }

    dashboardMap = L.map('dashboard-map', {
        center: [-8.4, -37.5], // Centro aproximado de PE
        zoom: 7,
        zoomControl: false, 
        attributionControl: false
    });

    // TileLayer "Voyager" (Limpo/Claro)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
        className: 'map-tiles-grayscale' // CSS Grayscale class
    }).addTo(dashboardMap);

    // Configuração do Cluster (Cores Quentes: Laranja -> Vermelho)
    if (L.markerClusterGroup) {
        markerClusterGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 50,
            iconCreateFunction: function(cluster) {
                const childCount = cluster.getChildCount();
                let bgColor = 'rgba(241, 196, 15, 0.6)'; // Amarelo/Laranja claro
                
                if (childCount >= 10 && childCount < 50) {
                    bgColor = 'rgba(230, 126, 34, 0.7)'; // Laranja Médio
                } else if (childCount >= 50) {
                    bgColor = 'rgba(231, 76, 60, 0.8)';  // Vermelho Intenso
                }

                return new L.DivIcon({ 
                    html: `<div style="
                        background-color: ${bgColor};
                        width: 35px; height: 35px;
                        border-radius: 50%;
                        display: flex; align-items: center; justify-content: center;
                        font-weight: bold; color: white;
                        border: 3px solid rgba(255,255,255,0.5);
                        font-family: 'Poppins', sans-serif; font-size: 0.85rem;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <span>${childCount}</span>
                        </div>`, 
                    className: 'custom-cluster-icon', 
                    iconSize: new L.Point(35, 35) 
                });
            }
        });
        dashboardMap.addLayer(markerClusterGroup);
    }

    // Adiciona Borda de PE (Azul)
    addStateBorder(dashboardMap);

    // Plotagem dos Marcadores
    const activeConflicts = conflitos.filter(c => c.status === 'ATIVO');
    const activeDenuncias = denuncias.filter(d => d.status === 'PENDENTE');

    activeConflicts.forEach(item => addMarkerToCluster(item, 'conflito'));
    activeDenuncias.forEach(item => addMarkerToCluster(item, 'denuncia'));
}

function addMarkerToCluster(item, type) {
    let lat = item.latitude || (item.localizacao ? item.localizacao.latitude : null);
    let lng = item.longitude || (item.localizacao ? item.localizacao.longitude : null);

    if (lat && lng) {
        const config = MARKER_CONFIG[type];
        
        // Ícone HTML Personalizado (Exclamação ou Megafone)
        const htmlIcon = `
            <div style="
                background-color: ${config.color};
                width: 28px; height: 28px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                display: flex; align-items: center; justify-content: center;
                color: white; font-size: 13px;"> 
                <i class="fas ${config.icon}"></i>
            </div>
        `;

        const icon = L.divIcon({
            className: 'custom-dashboard-marker',
            html: htmlIcon,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -14]
        });

        const marker = L.marker([lat, lng], { icon: icon })
            .bindPopup(`
                <div style="text-align:center; color:#333; font-family: 'Poppins', sans-serif;">
                    <div style="font-size: 0.7rem; color:${config.color}; font-weight:700; text-transform:uppercase; margin-bottom:2px;">
                        ${config.label}
                    </div>
                    <div style="font-size:0.95rem; font-weight:600; line-height:1.2; margin-bottom:4px;">
                        ${item.tituloConflito || item.tituloDenuncia}
                    </div>
                    <div style="font-size:0.85rem; color:#666;">
                        <i class="fas fa-map-marker-alt"></i> ${item.municipio || (item.localizacao ? item.localizacao.municipio : 'N/I')}
                    </div>
                </div>
            `);

        if (markerClusterGroup) {
            markerClusterGroup.addLayer(marker);
        } else {
            marker.addTo(dashboardMap);
        }
    }
}

async function addStateBorder(mapInstance) {
    try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v3/malhas/estados/26?formato=application/vnd.geo+json');
        if (!response.ok) return;
        const data = await response.json();
        
        L.geoJSON(data, {
            style: { 
                color: '#0d6efd', // Azul solicitado
                weight: 2, 
                opacity: 0.8, 
                fillColor: '#0d6efd',
                fillOpacity: 0.03 // Levíssimo preenchimento azul
            }
        }).addTo(mapInstance);
    } catch (e) { console.error("Erro malha:", e); }
}

// --- GRÁFICOS (VISUAL DETALHADO E PROFISSIONAL) ---

// 1. Doughnut Chart (Tipos)
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
                borderWidth: 0, // Sem borda para visual flat
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%', // Anel mais fino e elegante
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20,
                        font: { size: 12 }
                    }
                },
                tooltip: getProfessionalTooltipConfig()
            }
        }
    });
}

// 2. Bar Chart (Status) - Minimalista com Borda Arredondada
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
                label: 'Ocorrências',
                data: Object.values(counts),
                backgroundColor: [COLORS.secondary, COLORS.success, COLORS.gray],
                borderRadius: 6, // Arredondado
                barThickness: 45,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: getProfessionalTooltipConfig()
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    grid: { color: '#f3f4f6', borderDash: [5, 5] },
                    ticks: { font: { size: 11 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { weight: 500 } }
                }
            }
        }
    });
}

// 3. Horizontal Bar Chart (Municípios)
function renderTopCitiesChart(conflitos, denuncias) {
    const ctx = document.getElementById('topCitiesChart');
    if (!ctx) return;

    const cityCounts = {};
    [...conflitos, ...denuncias].forEach(item => {
        let city = item.localizacao?.municipio || item.municipio || 'N/I';
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
                borderRadius: 4,
                barThickness: 20
            }]
        },
        options: {
            indexAxis: 'y', // Barra horizontal
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: getProfessionalTooltipConfig()
            },
            scales: {
                x: { 
                    beginAtZero: true,
                    grid: { color: '#f3f4f6' }
                },
                y: {
                    grid: { display: false }
                }
            }
        }
    });
}

// 4. Line Chart (Evolução) com Degradê
function renderEvolutionChart(denuncias, conflitos) {
    const ctx = document.getElementById('evolutionChart');
    if (!ctx) return;

    // Configura o Degradê (Gradient)
    const chartCtx = ctx.getContext('2d');
    
    const gradientDen = chartCtx.createLinearGradient(0, 0, 0, 300);
    gradientDen.addColorStop(0, 'rgba(245, 158, 11, 0.4)'); // Laranja claro topo
    gradientDen.addColorStop(1, 'rgba(245, 158, 11, 0.0)'); // Transparente base

    const gradientConf = chartCtx.createLinearGradient(0, 0, 0, 300);
    gradientConf.addColorStop(0, 'rgba(212, 71, 22, 0.4)'); // Vermelho topo
    gradientConf.addColorStop(1, 'rgba(212, 71, 22, 0.0)'); // Transparente base

    // Lógica de Datas
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
                    backgroundColor: gradientDen,
                    fill: true,
                    tension: 0.4, // Curva suave
                    pointBackgroundColor: '#fff',
                    pointBorderColor: COLORS.secondary,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Conflitos',
                    data: countMonth(conflitos, 'dataInicio'),
                    borderColor: COLORS.primary,
                    backgroundColor: gradientConf,
                    fill: true,
                    tension: 0.4, // Curva suave
                    pointBackgroundColor: '#fff',
                    pointBorderColor: COLORS.primary,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: { position: 'top', align: 'end' },
                tooltip: getProfessionalTooltipConfig()
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f3f4f6', borderDash: [5, 5] },
                    ticks: { precision: 0 }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// Configuração de Tooltip Reutilizável
function getProfessionalTooltipConfig() {
    return {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#555',
        borderColor: '#eee',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowBlur: 10,
        shadowColor: 'rgba(0,0,0,0.1)'
    };
}

function destroyChart(canvas) {
    const chart = Chart.getChart(canvas);
    if(chart) chart.destroy();
}

function updateText(id, val) {
    const el = document.getElementById(id);
    if(el) el.innerText = val;
}

// --- LISTAGEM DE APROVAÇÕES (Mantida) ---
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