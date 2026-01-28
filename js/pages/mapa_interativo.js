import { listarConflitos, listarDenuncias } from '../services/apiService.js';

let map;
let markerClusterGroup;

// Configurações de estilo e rótulo dos MARCADORES INDIVIDUAIS
const CONFIG = {
    conflito: { color: '#e74c3c', label: 'Conflito', icon: 'fa-exclamation' }, // Vermelho
    denuncia: { color: '#f39c12', label: 'Denúncia', icon: 'fa-bullhorn' }    // Laranja
};

// --- Função auxiliar para exibir toast ---
function showToast(message, type = 'success', title = null) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    const titleText = title || (type === 'success' ? 'Sucesso' : 'Atenção');
    toast.innerHTML = `
        <i class="fas ${icon}" style="font-size: 1.2rem;"></i>
        <div class="toast-content">
            <span class="toast-title">${titleText}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.showToast = showToast;

export async function init() {
    await initMap();
    
    setTimeout(() => {
        if(map) map.invalidateSize();
        loadMapData();
    }, 200);
    
    document.getElementById('resetMapBtn')?.addEventListener('click', loadMapData);
}

async function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;
    
    if (map) {
        map.remove();
        map = null;
    }
    
    // Configuração de Limites (Pernambuco)
    const boundsPE = L.latLngBounds(
        L.latLng(-9.8, -41.5),
        L.latLng(-6.5, -34.4)
    );
    
    map = L.map('map', {
        center: [-8.3, -37.5],
        zoom: 7,
        minZoom: 6,
        maxBounds: boundsPE,
        maxBoundsViscosity: 0.6
    });
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
        className: 'map-tiles-grayscale'
    }).addTo(map);
    
    // INICIALIZA O CLUSTER COM COR PERSONALIZADA (VERMELHO/LARANJA)
    if (L.markerClusterGroup) {
        markerClusterGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            // Função Customizada para criar ícones de cluster vermelhos
            iconCreateFunction: function(cluster) {
                const childCount = cluster.getChildCount();
                
                // Define a classe base e tamanho
                let c = ' marker-cluster-';
                let size = 40;
                let colorClass = '';

                // Lógica de cores "quentes" (Vermelho/Laranja)
                // Usamos estilos inline para garantir a cor sem CSS externo
                let bgColor = 'rgba(241, 196, 15, 0.6)'; // Amarelo/Laranja claro (< 10)
                
                if (childCount >= 10 && childCount < 50) {
                    bgColor = 'rgba(230, 126, 34, 0.7)'; // Laranja (10-50)
                } else if (childCount >= 50) {
                    bgColor = 'rgba(231, 76, 60, 0.8)';  // Vermelho (> 50)
                }

                // Cria o HTML do ícone do cluster
                return new L.DivIcon({ 
                    html: `<div style="
                        background-color: ${bgColor};
                        width: 40px; height: 40px;
                        border-radius: 50%;
                        display: flex; align-items: center; justify-content: center;
                        font-weight: bold; color: white;
                        border: 4px solid rgba(255,255,255,0.4);
                        font-family: sans-serif;">
                        <span>${childCount}</span>
                        </div>`, 
                    className: 'custom-cluster-icon', 
                    iconSize: new L.Point(40, 40) 
                });
            }
        });
        map.addLayer(markerClusterGroup);
    }

    await addStateBorder();
}

// BORDA AZUL (Igual à Visão Geral)
async function addStateBorder() {
    try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v3/malhas/estados/26?formato=application/vnd.geo+json');
        if (!response.ok) throw new Error('Falha na API IBGE');
        const data = await response.json();
        
        L.geoJSON(data, {
            style: {
                color: '#0d6efd', // AZUL
                weight: 2,        // Espessura da linha
                opacity: 0.8,
                fillColor: '#0d6efd',
                fillOpacity: 0.05 // Leve preenchimento azul
            }
        }).addTo(map);
    } catch (error) {
        // Fallback
        const bounds = [[-9.8, -41.5], [-6.5, -34.4]];
        L.rectangle(bounds, {color: "#0d6efd", weight: 1, fill: false, dashArray: '5, 5'}).addTo(map);
    }
}

async function loadMapData() {
    const listEl = document.getElementById('itemsList');
    if(listEl) listEl.innerHTML = '<div class="text-center p-3 text-muted"><i class="fas fa-spinner fa-spin"></i> Carregando dados...</div>';
    
    try {
        const [conflitosRes, denunciasRes] = await Promise.all([
            listarConflitos().catch(e => []),
            listarDenuncias().catch(e => [])
        ]);
        
        const todosConflitos = Array.isArray(conflitosRes) ? conflitosRes : (conflitosRes.content || []);
        const todasDenuncias = Array.isArray(denunciasRes) ? denunciasRes : (denunciasRes.content || []);
        
        const conflitos = todosConflitos.filter(c => c.status === 'ATIVO');
        const denuncias = todasDenuncias.filter(d => d.status === 'PENDENTE');
        
        if (markerClusterGroup) {
            markerClusterGroup.clearLayers();
        }
        
        if(listEl) listEl.innerHTML = '';
        
        await plotGroup(conflitos, 'conflito');
        await plotGroup(denuncias, 'denuncia');
        
        const elConf = document.getElementById('countConflitos');
        const elDen = document.getElementById('countDenuncias');
        if (elConf) elConf.textContent = conflitos.length;
        if (elDen) elDen.textContent = denuncias.length;
        
        if (conflitos.length === 0 && denuncias.length === 0) {
            if(listEl) listEl.innerHTML = '<p class="text-center p-3">Nenhum registro localizado.</p>';
        }
    } catch (error) {
        console.error("Erro no mapa:", error);
        if(listEl) listEl.innerHTML = '<p class="text-center p-3 text-danger">Erro ao carregar dados.</p>';
    }
}

async function plotGroup(items, type) {
    const config = CONFIG[type];
    const listEl = document.getElementById('itemsList');
    
    const processingPromises = items.map(async (item) => {
        let { lat, lng, cep, municipio } = getLocData(item, type);
        
        if ((!lat || !lng) && cep) {
            const coords = await fetchCoordinatesFromCEP(cep).catch(() => null);
            if (coords) {
                lat = coords.lat;
                lng = coords.lng;
            }
        }
        return { item, lat, lng, municipio };
    });
    
    const results = await Promise.all(processingPromises);
    
    results.forEach(data => {
        const { item, lat, lng, municipio } = data;
        
        // Adiciona ao MAPA (via Cluster)
        if (lat && lng) {
            const marker = createMarker(lat, lng, config, item, type);
            if (markerClusterGroup) {
                markerClusterGroup.addLayer(marker);
            } else {
                marker.addTo(map);
            }
        }
        
        // Adiciona à LISTA LATERAL
        if (listEl) {
            const clickAction = (lat && lng)
                ? `window.panToMarker(${lat}, ${lng})`
                : `window.showToast('Este item não possui localização georreferenciada.', 'error')`;
            
            const locationText = municipio || (lat && lng ? 'Localizado no mapa' : 'Localização pendente');
            const iconStatus = (lat && lng) ? '' : '<i class="fas fa-exclamation-circle text-warning" title="Sem coordenadas"></i> ';
            
            const html = `
                <div class="list-item-row" onclick="${clickAction}" style="cursor: pointer;">
                    <div class="list-indicator ${type}"></div>
                    <div class="item-details">
                        <h4>${getTitle(item, type)}</h4>
                        <p>
                            ${iconStatus}
                            <i class="fas fa-map-marker-alt"></i> ${locationText}
                        </p>
                    </div>
                </div>
            `;
            listEl.insertAdjacentHTML('beforeend', html);
        }
    });
}

// CRIAÇÃO DO ÍCONE INDIVIDUAL (PRIORIZADO)
function createMarker(lat, lng, config, item, type) {
    const htmlIcon = `
        <div style="
            background-color: ${config.color};
            width: 30px; height: 30px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.4);
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 14px;
            z-index: 1000;"> <i class="fas ${config.icon}"></i>
        </div>
    `;
    
    const icon = L.divIcon({
        className: 'custom-map-marker-modern',
        html: htmlIcon,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });
    
    const marker = L.marker([lat, lng], { icon: icon });
    marker.bindPopup(`
        <div style="text-align:center; font-family: sans-serif;">
            <strong style="color:${config.color}; text-transform: uppercase; font-size: 0.8rem;">${config.label}</strong><br>
            <b style="font-size: 1rem;">${getTitle(item, type)}</b><br>
            <span style="color: #666; font-size: 0.9rem;">${getLocData(item, type).municipio || ''}</span>
        </div>
    `);
    
    return marker;
}

function getLocData(item, type) {
    let lat = item.latitude;
    let lng = item.longitude;
    let cep = item.cep;
    let municipio = item.municipio;
    
    if (item.localizacao) {
        if (!lat) lat = item.localizacao.latitude;
        if (!lng) lng = item.localizacao.longitude;
        if (!cep) cep = item.localizacao.cep;
        if (!municipio) municipio = item.localizacao.municipio;
    }
    
    if (type === 'conflito' && item.denunciaOrigem?.localizacao) {
        if (!lat) lat = item.denunciaOrigem.localizacao.latitude;
        if (!lng) lng = item.denunciaOrigem.localizacao.longitude;
        if (!cep) cep = item.denunciaOrigem.localizacao.cep;
        if (!municipio) municipio = item.denunciaOrigem.localizacao.municipio;
    }
    
    return { lat, lng, cep, municipio };
}

function getTitle(item, type) {
    return type === 'conflito' ? (item.tituloConflito || 'Conflito') : (item.tituloDenuncia || 'Denúncia');
}

async function fetchCoordinatesFromCEP(cep) {
    try {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return null;
        const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
        if (!res.ok) return null;
        const data = await res.json();
        if (data.location?.coordinates) {
            return {
                lng: data.location.coordinates.longitude,
                lat: data.location.coordinates.latitude
            };
        }
        return null;
    } catch { return null; }
}

window.panToMarker = (lat, lng) => {
    map.setView([lat, lng], 15, { animate: true });
};