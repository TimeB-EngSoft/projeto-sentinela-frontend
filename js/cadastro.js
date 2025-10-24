import { requestAccess } from './services/apiService.js';

document.addEventListener('DOMContentLoaded', function() {
    const accessForm = document.getElementById('accessForm');

    if (accessForm) {
        accessForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const submitButton = accessForm.querySelector('button[type="submit"]');

            // Coleta dos dados do formulário
            const formData = new FormData(accessForm);
            const accessData = Object.fromEntries(formData.entries());

            // Validação simples (pode ser melhorada)
            if (!accessData.accessLevel || !accessData.fullName || !accessData.email || !accessData.justification) {
                alert('Por favor, preencha todos os campos obrigatórios (*).');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';

            try {
                // Chama a API para solicitar acesso
                const result = await requestAccess(accessData);
                alert(result.message || 'Solicitação enviada com sucesso! Você será notificado por e-mail após a análise.');
                accessForm.reset();
            } catch (error) {
                console.error('Erro ao solicitar acesso:', error);
                alert(error.message || 'Ocorreu um erro ao enviar sua solicitação. Tente novamente.');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar Solicitação';
            }
        });
    }
});