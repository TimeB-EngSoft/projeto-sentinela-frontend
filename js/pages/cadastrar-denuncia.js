import { registrarDenunciaExterna, getUserData } from '../services/apiService.js';

// Variáveis de estado
let currentCoords = { lat: null, long: null };
let pendingDenunciaData = null; 

export async function init() {
    // --- 1. CONFIGURAÇÃO DO LOADER ---
    const loader = document.getElementById('global-loader');
    const content = document.getElementById('main-content');
    
    if (loader && content) {
        loader.style.display = 'flex';
        content.style.display = 'none';
    }

    try {
        setupInputMasks(); 
        
        // Aguarda o preenchimento dos dados do usuário antes de liberar a tela
        await prefillUserData(); 
        
        setupDenunciaForm(); 
        setupCepBlur();
        setupModals(); // Garante que os modais estejam configurados

    } catch (error) {
        console.error("Erro ao inicializar tela de denúncia:", error);
    } finally {
        // --- 2. REMOVE O LOADER ---
        if (loader && content) {
            loader.style.display = 'none';
            content.style.display = 'block';
        }
    }
}

// --- 0. MÁSCARAS E VALIDAÇÕES VISUAIS ---
function setupInputMasks() {
    const cpfInput = document.getElementById('cpf');
    const telInput = document.getElementById('telefone');
    const cepInput = document.getElementById('cep');

    if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = value;
        });
    }

    if (telInput) {
        telInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
            value = value.replace(/(\d)(\d{4})$/, '$1-$2');
            e.target.value = value;
        });
    }

    if (cepInput) {
        cepInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 8) value = value.slice(0, 8);
            value = value.replace(/^(\d{5})(\d)/, '$1-$2');
            e.target.value = value;
        });
    }
}

// --- 1. CONFIGURAÇÃO DE MODAIS ---
function setupModals() {
    const modalConfirm = document.getElementById('modal-confirmar-sem-coords');
    const btnConfirmar = document.getElementById('btn-confirmar-envio');
    const btnCancelar = document.getElementById('btn-cancelar-envio');
    const submitButton = document.querySelector('#denunciaFormInternal button[type="submit"]');

    // Remove listeners antigos clonando os botões (previne duplicação)
    if (btnConfirmar) {
        const newBtn = btnConfirmar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(newBtn, btnConfirmar);
        
        newBtn.onclick = async () => {
            if (modalConfirm) modalConfirm.classList.remove('show');
            if (pendingDenunciaData) {
                await enviarDenuncia(pendingDenunciaData, submitButton);
            }
        };
    }

    if (btnCancelar) {
        const newBtn = btnCancelar.cloneNode(true);
        btnCancelar.parentNode.replaceChild(newBtn, btnCancelar);

        newBtn.onclick = () => {
            if (modalConfirm) modalConfirm.classList.remove('show');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Registrar Denúncia';
            }
            pendingDenunciaData = null;
        };
    }
}

// --- 2. FUNÇÃO DE BUSCA DE COORDENADAS ---
async function fetchCoordinates(cep) {
    try {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return null;
        
        const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
        if (!res.ok) return null;
        
        const data = await res.json();
        
        // Preenche campos de endereço visualmente
        if (data.street) document.getElementById('rua').value = data.street;
        if (data.neighborhood) document.getElementById('bairro').value = data.neighborhood;
        if (data.city) document.getElementById('cidade').value = data.city;
        if (data.state) document.getElementById('estado').value = data.state;

        // Tenta capturar coordenadas
        if (data.location && data.location.coordinates) {
            const lat = parseFloat(data.location.coordinates.latitude);
            const long = parseFloat(data.location.coordinates.longitude);
            
            if (!isNaN(lat) && !isNaN(long)) {
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
            if(user.cpf) cpfInput.value = user.cpf; 
            if(user.telefone) telInput.value = user.telefone;
            
            cpfInput.dispatchEvent(new Event('input'));
            telInput.dispatchEvent(new Event('input'));
        } catch (e) {
            console.warn("Não foi possível carregar dados do usuário.");
        }
    }
}

function setupCepBlur() {
    const cepInput = document.getElementById('cep');
    if (!cepInput) return;

    const newCepInput = cepInput.cloneNode(true);
    cepInput.parentNode.replaceChild(newCepInput, cepInput);
    setupInputMasks();

    newCepInput.addEventListener('blur', async () => {
        const cepValue = newCepInput.value.replace(/\D/g, '');
        if (cepValue.length === 8) {
            newCepInput.style.cursor = 'wait';
            const coords = await fetchCoordinates(cepValue);
            newCepInput.style.cursor = 'text';
            
            if (coords) {
                currentCoords.lat = coords.latitude;
                currentCoords.long = coords.longitude;
            } else {
                currentCoords = { lat: null, long: null };
            }
        }
    });
}

// --- 3. CONFIGURAÇÃO DO FORMULÁRIO ---
function setupDenunciaForm() {
    const form = document.getElementById('denunciaFormInternal');
    const feedback = document.getElementById('denunciaFeedback');
    const successModal = document.getElementById('modal-success-denuncia');
    const btnCloseSuccess = document.getElementById('btn-close-success');
    
    if (!form) return;

    const hideFeedback = () => {
        feedback.className = 'form-alert';
        feedback.style.display = 'none';
    };
    const showFeedback = (msg) => {
        feedback.textContent = msg;
        feedback.className = 'form-alert is-error is-visible';
        feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    if(btnCloseSuccess) {
        const newBtn = btnCloseSuccess.cloneNode(true);
        btnCloseSuccess.parentNode.replaceChild(newBtn, btnCloseSuccess);
        newBtn.onclick = () => {
            successModal.classList.remove('show');
            window.location.hash = '#/denuncias'; 
        };
    }

    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    setupInputMasks(); 

    const submitButton = newForm.querySelector('button[type="submit"]');

    // --- SUBMIT DO FORMULÁRIO ---
    newForm.addEventListener('submit', async function(event) {
        event.preventDefault(); 
        hideFeedback();

        const originalBtnText = submitButton.textContent;
        submitButton.disabled = true;
        
        const cepRaw = document.getElementById('cep').value;
        const cepClean = cepRaw ? cepRaw.replace(/\D/g, '') : '';
        
        // 1. Verifica se precisa buscar endereço
        let needsFetch = false;
        const estadoVal = document.getElementById('estado').value;
        const cidadeVal = document.getElementById('cidade').value;
        
        if (cepClean.length === 8) {
            if (!estadoVal || !cidadeVal || currentCoords.lat === null) {
                needsFetch = true;
            }
        }

        if (needsFetch) {
            submitButton.innerHTML = '<i class="fas fa-search fa-spin"></i> Verificando endereço...';
            const coords = await fetchCoordinates(cepClean);
            if (coords) {
                currentCoords.lat = coords.latitude;
                currentCoords.long = coords.longitude;
            }
        }

        // 2. Coleta dados
        const titulo = document.getElementById('titulo').value.trim();
        const tipo = document.getElementById('tipo-conflito').value;
        const descricao = document.getElementById('descricao').value.trim();
        const dataOcorrido = document.getElementById('data-ocorrido').value;
        const cpfRaw = document.getElementById('cpf').value;
        const estadoFinal = document.getElementById('estado').value;
        const cidadeFinal = document.getElementById('cidade').value;

        // 3. Validações
        if (cpfRaw && cpfRaw.replace(/\D/g, '').length !== 11) {
            showFeedback('O CPF deve conter 11 dígitos.');
            submitButton.disabled = false;
            submitButton.textContent = originalBtnText; 
            return; 
        }

        if (!titulo || !tipo || !descricao || !dataOcorrido || cepClean.length !== 8 || !estadoFinal || !cidadeFinal) {
            showFeedback('Por favor, preencha todos os campos obrigatórios.');
            submitButton.disabled = false;
            submitButton.textContent = originalBtnText;
            return;
        }

        // 4. Prepara Objeto
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
            } catch(e) { console.warn("Erro vínculo inst."); }
        }

        const denunciaData = {
            nomeDenunciante: document.getElementById('nome').value,
            emailDenunciante: document.getElementById('email').value,
            cpfDenunciante: cpfRaw.replace(/\D/g, ''),
            telefoneDenunciante: document.getElementById('telefone').value.replace(/\D/g, ''),
            tipoDenuncia: tipo, 
            tituloDenuncia: titulo,
            descricaoDenuncia: descricao,
            descricaoPartesEnvolvidas: document.getElementById('partes-envolvidas').value,
            dataOcorrido: dataOcorrido + 'T00:00:00',
            cep: cepClean, 
            estado: estadoFinal,
            municipio: cidadeFinal,
            bairro: document.getElementById('bairro').value,
            rua: document.getElementById('rua').value,
            numero: document.getElementById('numero').value,
            referencia: document.getElementById('referencia').value,
            latitude: currentCoords.lat,
            longitude: currentCoords.long,
            instituicaoId: instituicaoId,
            fonteDenuncia: fonte
        };

        // 5. Verifica Coordenadas
        if (currentCoords.lat === null || currentCoords.long === null) {
            pendingDenunciaData = denunciaData; 
            document.getElementById('modal-confirmar-sem-coords').classList.add('show');
            return; 
        }

        // 6. Envio direto
        await enviarDenuncia(denunciaData, submitButton);
    });
}

// Função isolada de envio
async function enviarDenuncia(data, submitButton) {
    const successModal = document.getElementById('modal-success-denuncia');
    const feedback = document.getElementById('denunciaFeedback');
    
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    try {
        await registrarDenunciaExterna(data);
        successModal.classList.add('show');
        document.getElementById('denunciaFormInternal').reset();
        currentCoords = { lat: null, long: null };
        prefillUserData(); 

    } catch (error) {
        console.error(error);
        let msg = 'Erro ao registrar. Tente novamente.';
        if(error.message) msg = error.message;
        
        feedback.textContent = msg;
        feedback.className = 'form-alert is-error is-visible';
        feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Registrar Denúncia';
        pendingDenunciaData = null;
    }
}