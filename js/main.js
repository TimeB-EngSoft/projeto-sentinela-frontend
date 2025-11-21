import { registrarDenunciaExterna } from './services/apiService.js';

document.addEventListener("DOMContentLoaded", function() {

    // ... (Código de animação dos contadores mantido igual) ...
    const statNumbers = document.querySelectorAll('.stat-number');
    // ... (lógica de observer) ...

    // Form Handling
    const form = document.getElementById('denunciaForm');
    const feedback = document.getElementById('denunciaFeedback');

    const toggleFeedback = (message, type) => {
        if (!feedback) return;
        feedback.textContent = message;
        feedback.classList.remove('is-success', 'is-error', 'is-visible');
        if (type) feedback.classList.add(`is-${type}`);
        feedback.classList.add('is-visible');
    };

    const setSubmittingState = (isSubmitting) => {
        const submitButton = form?.querySelector('button[type="submit"]');
        if (!submitButton) return;
        submitButton.disabled = isSubmitting;
        submitButton.textContent = isSubmitting ? 'Registrando...' : 'Registrar';
    };

    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();

            let isValid = true;
            const requiredFields = form.querySelectorAll('[required]');

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = 'red';
                } else {
                    field.style.borderColor = '';
                }
            });

            if (!isValid) {
                toggleFeedback('Por favor, preencha todos os campos obrigatórios (*).', 'error');
                return;
            }

            // 1. Mapa de conversão do valor do HTML para o ENUM do Java
            const tipoDenunciaMap = {
                'terra-indigena': 'TERRA_INDIGENA',
                'disputa-posse': 'DISPUTA_DE_POSSE',
                'territorio-quilombola': 'TERRITORIO_QUILOMBOLA',
                'recursos-hidricos': 'RECURSO_HIDRICO',
                'desmatamento': 'DESMATAMENTO',
                'outro': 'OUTRO'
            };

            const formValue = form['tipo-conflito'].value;
            const tipoDenunciaEnum = tipoDenunciaMap[formValue];

            if (!tipoDenunciaEnum) {
                toggleFeedback('Por favor, selecione um Tipo de Conflito válido.', 'error');
                return; 
            }

            const denunciaData = {
                nomeDenunciante: form.nome.value.trim(),
                cpfDenunciante: form.cpf.value.trim(),
                emailDenunciante: form.email.value.trim(),
                telefoneDenunciante: form.telefone.value.trim(),
                
                tipoDenuncia: tipoDenunciaEnum,

                tituloDenuncia: form.titulo.value.trim(),       
                descricaoDenuncia: form.descricao.value.trim(),   
                dataOcorrido: form['data-ocorrido'].value + 'T00:00:00',
                descricaoPartesEnvolvidas: form['partes-envolvidas'].value.trim(), 

                // --- NOVOS CAMPOS DE LOCALIZAÇÃO ---
                // Capturando os IDs que já existem no index.html
                cep: document.getElementById('cep').value,
                estado: document.getElementById('estado').value,
                municipio: document.getElementById('cidade').value, // Mapeia 'cidade' para 'municipio'
                bairro: document.getElementById('bairro').value,
                rua: document.getElementById('rua').value,
                numero: document.getElementById('numero').value,
                referencia: document.getElementById('referencia').value,
                
                // Campos de controle (nulos para público)
                instituicaoId: null,
                fonteDenuncia: 'FORMULARIO_PUBLICO'
            };

            setSubmittingState(true);

            try {
                await registrarDenunciaExterna(denunciaData);
                toggleFeedback('Denúncia registrada com sucesso! Agradecemos sua colaboração.', 'success');
                form.reset();
            } catch (error) {
                const message = error?.message || 'Não foi possível registrar a denúncia. Tente novamente.';
                toggleFeedback(message, 'error');
            } finally {
                setSubmittingState(false);
            }
        });
    }
});