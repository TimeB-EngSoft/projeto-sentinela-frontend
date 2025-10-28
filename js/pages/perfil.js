import { updateUser } from '../../services/apiService.js';

document.addEventListener('DOMContentLoaded', function() {

    // Carrega informações do usuário logado
    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const cargoInput = document.getElementById('cargo');
    const instituicaoInput = document.getElementById('instituicao');

    nomeInput.value = localStorage.getItem('userName') || '';
    emailInput.value = localStorage.getItem('userEmail') || '';
    cargoInput.value = localStorage.getItem('userCargo') || '';
    instituicaoInput.value = localStorage.getItem('userInstituicao') || '';

    // ====== Atualizar Perfil ======
    const profileForm = document.querySelector('.profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const userId = localStorage.getItem('userId');
            if (!userId) {
                alert('Usuário não identificado.');
                return;
            }

            const userData = {
                nome: nomeInput.value,
                email: emailInput.value,
                instituicaoNome: instituicaoInput.value,
                cargo: cargoInput.value
            };

            try {
                const result = await updateUser(userId, userData);
                alert('Perfil atualizado com sucesso!');
                console.log(result);

                // Atualiza localStorage
                localStorage.setItem('userName', result.nome);
                localStorage.setItem('userEmail', result.email);
                localStorage.setItem('userCargo', result.cargo);
                localStorage.setItem('userInstituicao', result.instituicao?.nome || '');

            } catch (error) {
                alert('Erro ao salvar: ' + (error.message || 'Falha na atualização.'));
            }
        });
    }

    // ====== Alterar Senha (simulação futura) ======
    const passwordForm = document.querySelector('.password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Integração de senha em desenvolvimento.');
        });
    }
});
