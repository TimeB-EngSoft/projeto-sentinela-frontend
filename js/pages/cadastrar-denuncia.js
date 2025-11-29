import { registrarDenunciaExterna, getUserData } from '../services/apiService.js';

// Variáveis para armazenar coordenadas em memória (já que o form de denúncia não tem inputs visíveis de lat/long)
let currentCoords = { lat: null, long: null };

export async function init() {
    prefillUserData();
    setupDenunciaForm();
    setupCepBlur();
}

// --- 1. FUNÇÃO DE BUSCA DE COORDENADAS (ROBUSTA) ---
async function fetchCoordinates(cep) {
    try {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return null;
        
        // Usa a BrasilAPI V2
        const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
        if (!res.ok) return null;
        
        const data = await res.json();
        
        // Preenche campos de endereço automaticamente se existirem
        if (data.street) document.getElementById('rua').value = data.street;
        if (data.neighborhood) document.getElementById('bairro').value = data.neighborhood;
        if (data.city) document.getElementById('cidade').value = data.city;
        if (data.state) document.getElementById('estado').value = data.state;

        if (data.location && data.location.coordinates) {
            const lat = data.location.coordinates.latitude;
            const long = data.location.coordinates.longitude;
            
            // Validação extra para garantir que não é undefined
            if (lat !== undefined && long !== undefined) {
                return { latitude: lat, longitude: long };
            }
        }
        return null;
    } catch (e) {
        console.warn('Erro ao geolocalizar CEP:', e);
        return null;
    }
}

async function prefillUserData() {
    const userId = localStorage.getItem('userId');
    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const cpfInput = document.getElementById('cpf');
    const telInput = document.getElementById('telefone');

    if (userId) {
        try {
            if(localStorage.getItem('userName')) nomeInput.value = localStorage.getItem('userName');
            if(localStorage.getItem('userEmail')) emailInput.value = localStorage.getItem('userEmail');

            const user = await getUserData(userId);
            if(user.nome) nomeInput.value = user.nome;
            if(user.email) emailInput.value = user.email;
            if(user.cpf) {
                cpfInput.value = user.cpf;
                cpfInput.readOnly = true; 
                cpfInput.style.backgroundColor = "#eee";
            }
            if(user.telefone) telInput.value = user.telefone;

        } catch (e) {
            console.warn("Não foi possível carregar dados completos do usuário.");
        }
    }
}

// --- 2. CONFIGURAÇÃO DO EVENTO DE SAÍDA DO CEP ---
function setupCepBlur() {
    const cepInput = document.getElementById('cep');
    if (!cepInput) return;

    // Remove listeners antigos clonando o elemento
    const newCepInput = cepInput.cloneNode(true);
    cepInput.parentNode.replaceChild(newCepInput, cepInput);

    newCepInput.addEventListener('blur', async () => {
        const cepValue = newCepInput.value.replace(/\D/g, '');
        if (cepValue.length === 8) {
            // Feedback visual sutil (mudando cursor ou placeholder)
            newCepInput.style.cursor = 'wait';
            
            const coords = await fetchCoordinates(cepValue);
            
            newCepInput.style.cursor = 'text';
            
            if (coords) {
                currentCoords.lat = coords.latitude;
                currentCoords.long = coords.longitude;
                console.log("Coordenadas obtidas no Blur:", currentCoords);
            } else {
                currentCoords = { lat: null, long: null };
            }
        }
    });
}

function setupDenunciaForm() {
    const form = document.getElementById('denunciaFormInternal');
    const feedback = document.getElementById('denunciaFeedback');
    const successModal = document.getElementById('modal-success-denuncia');
    const btnCloseSuccess = document.getElementById('btn-close-success');

    if (!form) return;

    const showFeedback = (msg) => {
        feedback.textContent = msg;
        feedback.className = 'form-alert is-error is-visible';
        feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const hideFeedback = () => {
        feedback.className = 'form-alert';
        feedback.style.display = 'none';
    };

    if(btnCloseSuccess) {
        const newBtn = btnCloseSuccess.cloneNode(true);
        btnCloseSuccess.parentNode.replaceChild(newBtn, btnCloseSuccess);
        
        newBtn.addEventListener('click', () => {
            successModal.classList.remove('show');
            window.location.hash = '#/denuncias'; 
        });
    }

    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // 1. Previne envio nativo IMEDIATAMENTE
        hideFeedback();

        const submitButton = newForm.querySelector('button[type="submit"]');
        const originalBtnText = submitButton.textContent;
        
        // --- VALIDAÇÃO BÁSICA ---
        const titulo = document.getElementById('titulo').value.trim();
        const tipo = document.getElementById('tipo-conflito').value;
        const descricao = document.getElementById('descricao').value.trim();
        const dataOcorrido = document.getElementById('data-ocorrido').value;
        
        // Limpeza do CEP para validação e envio
        const cepRaw = document.getElementById('cep').value;
        const cepClean = cepRaw ? cepRaw.replace(/\D/g, '') : '';
        const estado = document.getElementById('estado').value;
        const cidade = document.getElementById('cidade').value;
        
        if (!titulo || !tipo || !descricao || !dataOcorrido || cepClean.length !== 8 || !estado || !cidade) {
            showFeedback('Por favor, preencha todos os campos obrigatórios (*). Verifique se o CEP possui 8 dígitos.');
            return;
        }

        submitButton.disabled = true;
        
        // --- LÓGICA DE COORDENADAS (Igual ao Conflitos) ---
        
        // Se as coordenadas ainda não foram capturadas pelo Blur, tenta agora
        if (currentCoords.lat === null || currentCoords.long === null) {
            submitButton.innerHTML = '<i class="fas fa-satellite-dish fa-spin"></i> Geolocalizando...';
            try {
                console.log("Tentando buscar coordenadas no submit para:", cepClean);
                const coords = await fetchCoordinates(cepClean);
                if (coords) {
                    currentCoords.lat = coords.latitude;
                    currentCoords.long = coords.longitude;
                }
            } catch (e) {
                console.warn("Falha ao buscar coordenadas no submit.");
            }
        }

        // --- POP-UP DE CONFIRMAÇÃO SE NÃO HOUVER COORDENADAS ---
        if (currentCoords.lat === null || currentCoords.long === null) {
            const confirmarSemCoords = confirm(
                "⚠️ Atenção: Coordenadas não identificadas!\n\n" +
                "O sistema não conseguiu obter a Latitude/Longitude automaticamente para este CEP.\n" +
                "A denúncia será salva, mas não aparecerá no mapa com precisão exata.\n\n" +
                "Deseja enviar mesmo assim?"
            );

            if (!confirmarSemCoords) {
                submitButton.disabled = false;
                submitButton.textContent = originalBtnText;
                return; // Cancela o envio
            }
        }

        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        const userId = localStorage.getItem('userId');
        let instituicaoId = null;
        let fonte = null;

        if (userId) {
            fonte = 'USUARIO_INTERNO';
            try {
                const userFull = await getUserData(userId);
                if (userFull && userFull.instituicao && userFull.instituicao.id) {
                    instituicaoId = userFull.instituicao.id;
                }
            } catch(e) { 
                console.warn("Erro ao buscar instituição do usuário para vínculo"); 
            }
        }

        const denunciaData = {
            nomeDenunciante: document.getElementById('nome').value,
            emailDenunciante: document.getElementById('email').value,
            cpfDenunciante: document.getElementById('cpf').value,
            telefoneDenunciante: document.getElementById('telefone').value,
            
            tipoDenuncia: tipo, 
            
            tituloDenuncia: titulo,
            descricaoDenuncia: descricao,
            descricaoPartesEnvolvidas: document.getElementById('partes-envolvidas').value,
            dataOcorrido: dataOcorrido + 'T00:00:00',

            // --- CAMPOS DE LOCALIZAÇÃO (CEP LIMPO) ---
            cep: cepClean, // Envia só números para o banco
            estado: estado,
            municipio: cidade,
            bairro: document.getElementById('bairro').value,
            rua: document.getElementById('rua').value,
            numero: document.getElementById('numero').value,
            referencia: document.getElementById('referencia').value,
            
            // Envia coordenadas (ou null se usuário confirmou sem elas)
            latitude: currentCoords.lat,
            longitude: currentCoords.long,
            
            instituicaoId: instituicaoId,
            fonteDenuncia: fonte
        };

        console.log("Payload Denúncia:", denunciaData); // Debug

        try {
            await registrarDenunciaExterna(denunciaData);
            
            successModal.classList.add('show');
            newForm.reset();
            // Reseta coordenadas
            currentCoords = { lat: null, long: null };
            prefillUserData();

        } catch (error) {
            console.error(error);
            let msg = 'Erro ao registrar. Tente novamente.';
            if(error.message && error.message.includes('Erro')) msg = error.message;
            showFeedback(msg);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Registrar Denúncia';
        }
    });
}