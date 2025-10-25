// Importa TODAS as funções necessárias do serviço de API
import { loginUser, recoverPassword, validateToken, resetPassword } from './apiService.js';

document.addEventListener('DOMContentLoaded', function() {
    // --- LÓGICA DE LOGIN ---
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const emailInput = document.getElementById('email').value;
            const passwordInput = document.getElementById('password').value;
            const submitButton = loginForm.querySelector('button[type="submit"]');

            if (emailInput.trim() === '' || passwordInput.trim() === '') {
                alert('Por favor, preencha todos os campos.');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Entrando...';

            try {
                // Chama a função de login da API (que agora envia FormData)
                const successMessage = await loginUser(emailInput, passwordInput);

                // O back-end retorna uma string de sucesso, não um token
                alert(successMessage);
                
                // Em uma aplicação real com tokens, você salvaria o token aqui.
                // localStorage.setItem('userMessage', successMessage);

                // Redireciona para a página principal do sistema
                window.location.href = '../secretaria/secretaria.html'; // Mude para a sua página de dashboard

            } catch (error) {
                console.error('Erro no login:', error);
                alert(error.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Entrar no Sistema';
            }
        });
    }

    // --- LÓGICA DE RECUPERAÇÃO DE SENHA (SOLICITAÇÃO) ---
    const recoveryForm = document.getElementById('recovery-form');
    if (recoveryForm) {
        recoveryForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const emailInput = document.getElementById('email').value;
            const submitButton = recoveryForm.querySelector('button[type="submit"]');

            if (emailInput.trim() === '') {
                alert('Por favor, digite seu e-mail.');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';

            try {
                const resultMessage = await recoverPassword(emailInput);
                alert(resultMessage); // Ex: "Instruções enviadas para seu e-mail!"
                // Após o sucesso, redireciona para a tela de inserir o token
                window.location.href = 'inserir_token.html';
            } catch (error) {
                console.error('Erro na recuperação:', error);
                alert(error.message || 'Não foi possível processar sua solicitação. Verifique o e-mail digitado.');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar Instruções';
            }
        });
    }

    // --- LÓGICA DE VALIDAÇÃO DE TOKEN ---
    const tokenForm = document.getElementById('token-form');
    if (tokenForm) {
        tokenForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const tokenInput = document.getElementById('token').value;
            const submitButton = tokenForm.querySelector('button[type="submit"]');

            if (tokenInput.trim().length < 6) { // Validação básica
                alert('Por favor, insira um token válido.');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Verificando...';

            try {
                await validateToken(tokenInput);
                // Em caso de sucesso, o redirecionamento ocorrerá
                window.location.href = `redefinir_senha.html?token=${tokenInput}`;
            } catch (error) {
                console.error('Erro na validação do token:', error);
                alert(error.message || 'Token inválido ou expirado. Por favor, tente novamente.');
            } finally {
                // Este bloco executa sempre, garantindo que o botão seja reativado se o usuário
                // não for redirecionado por algum motivo ou se a requisição falhar.
                submitButton.disabled = false;
                submitButton.textContent = 'Verificar Código';
            }
        });
    }

    // --- LÓGICA DE REDEFINIÇÃO DE SENHA (FINAL) ---
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        // 1. Extrair o token da URL assim que a página carregar
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        // 2. Medida de segurança: se não houver token, não permitir o acesso à página
        if (!token) {
            alert('Token de redefinição não encontrado. Por favor, inicie o processo novamente.');
            window.location.href = 'recuperar_senha.html'; // Redireciona para o início
            return; // Interrompe a execução do script
        }

        // 3. Armazena o token no campo hidden do formulário (opcional, mas bom para debug)
        document.getElementById('reset-token').value = token;

        // 4. Adiciona o listener para o envio do formulário
        resetPasswordForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const newPassword = document.getElementById('nova-senha').value;
            const confirmPassword = document.getElementById('confirmar-senha').value;
            const submitButton = resetPasswordForm.querySelector('button[type="submit"]');

            if (newPassword.trim() === '' || confirmPassword.trim() === '') {
                alert('Por favor, preencha os dois campos de senha.');
                return;
            }

            if (newPassword !== confirmPassword) {
                alert('As senhas não coincidem. Tente novamente.');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';

            try {
                // Usa o token da URL e a nova senha para chamar a API
                const resultMessage = await resetPassword(token, newPassword);
                alert(resultMessage); // Ex: "Senha redefinida com sucesso!"
                // Redireciona para o login após o sucesso
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Erro ao redefinir a senha:', error);
                alert(error.message || 'Não foi possível redefinir sua senha. O token pode ter expirado.');
                submitButton.disabled = false;
                submitButton.textContent = 'Salvar Nova Senha';
            }
        });
    }
});