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

    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent the default form submission

            // Simple validation check
            let isValid = true;
            const requiredFields = form.querySelectorAll('[required]');
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = 'red'; // Highlight empty required fields
                } else {
                    field.style.borderColor = ''; // Reset border color
                }
            });

            if (isValid) {
                alert('Denúncia registrada com sucesso! Agradecemos sua colaboração.');
                form.reset(); // Clear the form
            } else {
                alert('Por favor, preencha todos os campos obrigatórios (*).');
            }
        });
    }

});

// Seleciona o formulário de login
const loginForm = document.getElementById('form-login');

// Adiciona um "ouvinte" para o evento de envio do formulário
loginForm.addEventListener('submit', function(event) {
    // Previne o comportamento padrão do formulário (que é recarregar a página)
    event.preventDefault();

    // Pega os valores dos campos de email e senha
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Validação simples: verifica se os campos não estão vazios
    if (email.trim() === '' || password.trim() === '') {
        alert('Por favor, preencha todos os campos.');
        return; // Para a execução se a validação falhar
    }

    // Se a validação passar, você pode prosseguir
    // Aqui, estamos apenas exibindo uma mensagem de sucesso no console
    console.log('Tentativa de login com:');
    console.log('Email/CPF:', email);
    console.log('Senha:', password);

    alert('Login realizado com sucesso! (Demonstração)');
    
    // Em um sistema real, aqui você faria uma chamada para a API do seu backend
    // para verificar as credenciais do usuário.
});

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('accessForm');
    const requiredFields = form.querySelectorAll('[required]');

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Impede o envio padrão do formulário

        let isValid = true;

        // Remove erros antigos
        requiredFields.forEach(field => {
            field.classList.remove('error');
        });

        // Validação dos campos
        requiredFields.forEach(field => {
            // .trim() remove espaços em branco do início e do fim
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('error'); // Adiciona borda vermelha
            }
        });

        if (isValid) {
            // Se tudo estiver certo, exibe um alerta de sucesso
            alert('Solicitação enviada com sucesso! Aguarde a análise.');
            form.reset(); // Limpa o formulário
        } else {
            // Se houver erros, exibe um alerta de erro
            alert('Por favor, preencha todos os campos obrigatórios (*).');
        }
    });
});