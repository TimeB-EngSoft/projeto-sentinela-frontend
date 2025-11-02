// Importa a nova função do apiService
import { cadastrarCompleto } from '../services/apiService.js';

document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('finishRegistrationForm');
    
    // 1. Pegar o Token da URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        alert('Token de finalização não encontrado. Por favor, use o link enviado para seu e-mail.');
        // Redireciona para o login, pois não há o que fazer aqui
        window.location.href = '../../app/authentication/finalizar-cadastro.html'; 
        return;
    }

    if (registrationForm) {
        registrationForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const submitButton = registrationForm.querySelector('button[type="submit"]');

            // 2. Coletar dados do formulário
            const cpf = document.getElementById('cpf').value;
            const telefone = document.getElementById('telefone').value;
            const dataNascimento = document.getElementById('dataNascimento').value;
            const senha = document.getElementById('senha').value;
            const confirmarSenha = document.getElementById('confirmar-senha').value;

            // 3. Validações
            if (senha !== confirmarSenha) {
                alert('As senhas não coincidem. Tente novamente.');
                return;
            }
            if (!cpf || !telefone || !dataNascimento || !senha) {
                alert('Por favor, preencha todos os campos obrigatórios (*).');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Finalizando...';

            try {
                // 4. Enviar para a API (com o token)
                const message = await cadastrarCompleto(token, senha, telefone, dataNascimento, cpf);
                
                alert(message); // Ex: "Cadastro completo realizado com sucesso!"
                
                // Redireciona para o login
                window.location.href = 'login.html';

            } catch (error) {
                console.error('Erro ao finalizar cadastro:', error);
                alert(error.message || 'Não foi possível finalizar seu cadastro. O token pode ter expirado.');
                submitButton.disabled = false;
                submitButton.textContent = 'Finalizar Cadastro';
            }
        });
    }
});