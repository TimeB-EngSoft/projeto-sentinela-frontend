import { listarConflitos, listarDenuncias } from '../services/apiService.js';

let map;
let allMarkers = [];

const CONFIG = {
    conflito: { color: '#e74c3c', label: 'Conflito', icon: 'fa-exclamation' },
    denuncia: { color: '#f39c12', label: 'Denúncia', icon: 'fa-bullhorn' }
};

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

    await addStateBorder();
}

async function addStateBorder() {
    try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v3/malhas/estados/26?formato=application/vnd.geo+json');
        if (!response.ok) throw new Error('Falha na API IBGE');
        const data = await response.json();

        L.geoJSON(data, {
            style: {
                color: '#0d6efd',
                weight: 3,
                opacity: 1,
                fillColor: '#0d6efd',
                fillOpacity: 0.1
            }
        }).addTo(map);
    } catch (error) {
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

        // --- APLICAÇÃO DOS FILTROS SOLICITADOS ---
        const conflitos = todosConflitos.filter(c => c.status === 'ATIVO');
        const denuncias = todasDenuncias.filter(d => d.status === 'PENDENTE');
        // -----------------------------------------

        allMarkers.forEach(m => map.removeLayer(m));
        allMarkers = [];
        if(listEl) listEl.innerHTML = '';

        // Plotagem dos dados filtrados
        await plotGroup(conflitos, 'conflito');
        await plotGroup(denuncias, 'denuncia');

        // Atualiza os contadores laterais com os números filtrados
        const elConf = document.getElementById('countConflitos');
        const elDen = document.getElementById('countDenuncias');
        if (elConf) elConf.textContent = conflitos.length;
        if (elDen) elDen.textContent = denuncias.length;

        if (conflitos.length === 0 && denuncias.length === 0) {
            if(listEl) listEl.innerHTML = '<p class="text-center p-3">Nenhum registro localizado para os filtros atuais (Conflitos Ativos / Denúncias Pendentes).</p>';
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

        // Tenta buscar na API se não tiver no banco
        if ((!lat || !lng) && cep) {
            const coords = await fetchCoordinatesFromCEP(cep).catch(() => null);
            if (coords) {
                lat = coords.lat;
                lng = coords.lng;
            }
        }

        // AGORA RETORNA O ITEM MESMO SEM COORDENADAS
        return { item, lat, lng, municipio };
    });

    const results = await Promise.all(processingPromises);

    results.forEach(data => {
        // Removido o filtro que ignorava itens nulos
        const { item, lat, lng, municipio } = data;

        // 1. Adiciona ao MAPA (Apenas se tiver coordenadas)
        if (lat && lng) {
            const marker = createMarker(lat, lng, config, item, type);
            marker.addTo(map);
            allMarkers.push(marker);
        }

        // 2. Adiciona à LISTA LATERAL (Sempre, mesmo sem mapa)
        if (listEl) {
            // Define o que acontece ao clicar (zoom ou alerta)
            const clickAction = (lat && lng) 
                ? `window.panToMarker(${lat}, ${lng})` 
                : `alert('Este item não possui localização georreferenciada.')`;

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

    // Tenta pegar da estrutura aninhada se não estiver na raiz
    if (item.localizacao) {
        if (!lat) lat = item.localizacao.latitude;
        if (!lng) lng = item.localizacao.longitude;
        if (!cep) cep = item.localizacao.cep;
        if (!municipio) municipio = item.localizacao.municipio;
    }
    
    // Tratamento especial para conflitos que herdam da denúncia original
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
    map.setView([lat, lng], 13, { animate: true });
};