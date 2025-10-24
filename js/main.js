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