// Importa as funções de serviço necessárias
import { cadastrarParcial, listarInstituicoes } from './services/apiService.js';

document.addEventListener('DOMContentLoaded', function() {
    const accessForm = document.getElementById('accessForm');
    const accessLevelSelect = document.getElementById('accessLevel');
    const institutionGroup = document.getElementById('institution-form-group');
    const institutionSelect = document.getElementById('institution');

    /**
     * Busca as instituições da API e preenche o dropdown
     */
    async function populateInstitutions() {
        try {
            institutionSelect.disabled = true;
            institutionSelect.innerHTML = '<option value="">Carregando...</option>';
            
            // Chama a API para listar instituições
            const institutions = await listarInstituicoes(); 
            
            institutionSelect.innerHTML = '<option value="" disabled selected>Selecione uma instituição</option>';
            
            if (institutions && institutions.length > 0) {
                institutions.forEach(inst => {
                    const option = document.createElement('option');
                    // O backend espera o nome da instituição
                    option.value = inst.nome; 
                    option.textContent = inst.nome;
                    institutionSelect.appendChild(option);
                });
            } else {
                institutionSelect.innerHTML = '<option value="">Nenhuma instituição cadastrada</option>';
            }

        } catch (error) {
            console.error('Erro ao carregar instituições:', error);
            institutionSelect.innerHTML = '<option value="">Erro ao carregar lista</option>';
        } finally {
            institutionSelect.disabled = false;
        }
    }

    /**
     * Mostra ou esconde o campo de instituição com base no cargo selecionado
     */
    function toggleInstitutionField() {
        const selectedRole = accessLevelSelect.value;
        
        // Mostra o campo apenas para cargos de instituição
        if (selectedRole === 'GESTOR_INSTITUICAO' || selectedRole === 'USUARIO_INSTITUICAO') {
            institutionGroup.style.display = 'block';
            institutionSelect.required = true;
        } else {
            institutionGroup.style.display = 'none';
            institutionSelect.required = false;
        }
    }

    // --- INICIALIZAÇÃO ---
    populateInstitutions();
    toggleInstitutionField(); // Roda uma vez para verificar o estado inicial
    
    // Adiciona o listener para mudanças no cargo
    accessLevelSelect.addEventListener('change', toggleInstitutionField);


    // --- ENVIO DO FORMULÁRIO ---
    if (accessForm) {
        accessForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const submitButton = accessForm.querySelector('button[type="submit"]');

            // Mapeamento dos campos atualizado (sem departamento)
            const partialData = {
                cargo: accessLevelSelect.value,
                nome: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                instituicao: institutionSelect.value, // Pega o valor do select
                justificativa: document.getElementById('justification').value
            };
            
            // Validação simples
            if (!partialData.nome || !partialData.email || !partialData.justificativa || !partialData.cargo) {
                alert('Por favor, preencha todos os campos obrigatórios (*).');
                return;
            }

            // Validação extra para instituição
            if (institutionSelect.required && !partialData.instituicao) {
                alert('Por favor, selecione uma instituição.');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';

            try {
                // Chama a função da API
                const result = await cadastrarParcial(partialData);
                alert(result); // Exibe a mensagem de sucesso (ex: "Solicitação enviada")
                accessForm.reset();
                toggleInstitutionField(); // Reseta o campo de instituição para escondido
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