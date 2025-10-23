// Wait for the entire HTML document to be loaded before running the script
document.addEventListener('DOMContentLoaded', function() {

    // Select the form by its ID
    const loginForm = document.getElementById('form-login');

    // Check if the form actually exists on the page
    if (loginForm) {
        // Add an event listener for the 'submit' event
        loginForm.addEventListener('submit', function(event) {
            
            // Prevent the default form submission behavior (which reloads the page)
            event.preventDefault();

            // Get the values from the email and password input fields
            const emailInput = document.getElementById('email').value;
            const passwordInput = document.getElementById('password').value;

            // --- Validation Logic ---
            // .trim() removes any whitespace from the beginning or end of the string
            if (emailInput.trim() !== '' && passwordInput.trim() !== '') {
                // If both fields have content, proceed with the redirection.
                
                // For demonstration, show a success message
                alert('Login bem-sucedido! Redirecionando...');

                // Redirect the user to the desired page.
                // IMPORTANT: Adjust the path to your target file.
                window.location.href = '../secretaria/secretaria.html';

            } else {
                // If either field is empty, show an error message
                alert('Por favor, preencha os campos de e-mail e senha.');
            }
        });
    }
});

// RECUPERAR SENHA JS
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('recovery-form');
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('email-error');

    // Função para validar o formato do e-mail
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    // Função para mostrar erro
    const showError = (message) => {
        emailError.textContent = message;
        emailInput.classList.add('error');
    };

    // Função para limpar o erro
    const clearError = () => {
        emailError.textContent = '';
        emailInput.classList.remove('error');
    };

    // Adiciona o listener para o envio do formulário
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Previne o recarregamento da página
        clearError();

        const email = emailInput.value.trim();

        // Validação
        if (email === '') {
            showError('O campo de email é obrigatório.');
            return;
        }

        if (!validateEmail(email)) {
            showError('Por favor, insira um endereço de email válido.');
            return;
        }

        // Se a validação passar, simula o envio
        alert(`Instruções de recuperação enviadas para ${email}! Por favor, verifique sua caixa de entrada.`);
        form.reset(); // Limpa o formulário
    });

    // Limpa o erro enquanto o usuário digita
    emailInput.addEventListener('input', clearError);
});