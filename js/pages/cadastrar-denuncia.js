import { registrarDenunciaExterna, getUserData } from '../services/apiService.js';

export async function init() {
    prefillUserData();
    setupDenunciaForm();
}

async function prefillUserData() {
    // ... (código existente de preenchimento de usuário mantém-se igual) ...
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
        event.preventDefault();
        hideFeedback();

        const submitButton = newForm.querySelector('button[type="submit"]');
        
        const titulo = document.getElementById('titulo').value.trim();
        const tipo = document.getElementById('tipo-conflito').value;
        const descricao = document.getElementById('descricao').value.trim();
        const dataOcorrido = document.getElementById('data-ocorrido').value;
        
        // Validação de Localização Básica
        const cep = document.getElementById('cep').value;
        const estado = document.getElementById('estado').value;
        const cidade = document.getElementById('cidade').value;
        
        if (!titulo || !tipo || !descricao || !dataOcorrido || !cep || !estado || !cidade) {
            showFeedback('Por favor, preencha todos os campos obrigatórios (*), incluindo a localização.');
            return;
        }

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

            // --- CAMPOS DE LOCALIZAÇÃO ---
            cep: cep,
            estado: estado,
            municipio: cidade, // O Back-end espera 'municipio'
            bairro: document.getElementById('bairro').value,
            rua: document.getElementById('rua').value,
            numero: document.getElementById('numero').value,
            referencia: document.getElementById('referencia').value,
            
            instituicaoId: instituicaoId,
            fonteDenuncia: fonte
        };

        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        try {
            await registrarDenunciaExterna(denunciaData);
            
            successModal.classList.add('show');
            newForm.reset();
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