// Importa a nova função correta do nosso serviço
import { cadastrarParcial } from './services/apiService.js';

document.addEventListener('DOMContentLoaded', function() {
    const accessForm = document.getElementById('accessForm');

    if (accessForm) {
        accessForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const submitButton = accessForm.querySelector('button[type="submit"]');

            // Mapeamento dos campos do HTML para o que o back-end espera
            const partialData = {
                cargo: document.getElementById('accessLevel').value,
                nome: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                instituicao: document.getElementById('institution').value,
                departamento: document.getElementById('department').value,
                justificativa: document.getElementById('justification').value
            };

            // Validação simples
            if (!partialData.nome || !partialData.email || !partialData.justificativa) {
                alert('Por favor, preencha todos os campos obrigatórios (*).');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';

            try {
                // Chama a nova função da API
                const result = await cadastrarParcial(partialData);
                alert(result); // O back-end retorna uma string, então exibimos diretamente
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