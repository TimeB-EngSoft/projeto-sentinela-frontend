document.addEventListener('DOMContentLoaded', function() {

    // Lógica para o menu hambúrguer em telas móveis
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Lógica para fechar a sidebar ao clicar fora dela
    document.addEventListener('click', (event) => {
        if (sidebar && sidebar.classList.contains('open')) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnMenuToggle = menuToggle.contains(event.target);

            if (!isClickInsideSidebar && !isClickOnMenuToggle) {
                sidebar.classList.remove('open');
            }
        }
    });


    // Lógica para renderizar o gráfico com Chart.js
    const ctx = document.getElementById('evolutionChart');
    if (ctx) {
        const evolutionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Denúncias',
                    data: [12, 19, 3, 5, 2, 3],
                    borderColor: '#f0ad4e', // Cor amarela/laranja para denúncias
                    backgroundColor: 'rgba(240, 173, 78, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4 // Deixa a linha mais suave
                }, {
                    label: 'Conflitos',
                    data: [7, 11, 5, 8, 3, 7],
                    borderColor: '#D44716', // Cor primária para conflitos
                    backgroundColor: 'rgba(212, 71, 22, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        align: 'start',
                        labels: {
                            usePointStyle: true,
                            boxWidth: 8,
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e9e5dc' // Cor da grade mais suave
                        }
                    },
                    x: {
                        grid: {
                            display: false // Remove a grade vertical
                        }
                    }
                }
            }
        });
    }

});