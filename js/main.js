import { registrarDenunciaExterna } from './services/apiService.js';

document.addEventListener("DOMContentLoaded", function() {

    // Animated Counter
    const statNumbers = document.querySelectorAll('.stat-number');
    const statsSection = document.querySelector('#stats');

    const startCounter = () => {
        statNumbers.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const speed = 200; // Lower number = faster
            
            const updateCount = () => {
                const count = +counter.innerText;
                const increment = target / speed;

                if (count < target) {
                    counter.innerText = Math.ceil(count + increment);
                    setTimeout(updateCount, 1);
                } else {
                    counter.innerText = target.toLocaleString('pt-BR');
                }
            };
            updateCount();
        });
    };

    const observerOptions = {
        root: null,
        threshold: 0.5
    };

    let hasBeenAnimated = false;
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasBeenAnimated) {
                startCounter();
                hasBeenAnimated = true; // Ensure animation runs only once
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    if (statsSection) {
        observer.observe(statsSection);
    }

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

            const denunciaData = {
                nomeDenunciante: form.nome.value.trim(),
                cpf: form.cpf.value.trim(),
                email: form.email.value.trim(),
                telefone: form.telefone.value.trim(),
                tipoConflito: form['tipo-conflito'].value,
                titulo: form.titulo.value.trim(),
                descricao: form.descricao.value.trim(),
                dataOcorrido: form['data-ocorrido'].value,
                status: form.status.value,
                cep: form.cep.value.trim(),
                estado: form.estado.value.trim(),
                cidade: form.cidade.value.trim(),
                bairro: form.bairro.value.trim(),
                rua: form.rua.value.trim(),
                numero: form.numero.value.trim(),
                referencia: form.referencia.value.trim(),
                partesEnvolvidas: form['partes-envolvidas'].value.trim()
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