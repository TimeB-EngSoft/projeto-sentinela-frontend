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