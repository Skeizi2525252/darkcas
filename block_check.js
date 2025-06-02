function checkBlockStatus() {
    fetch('check_block.php')
        .then(response => response.json())
        .then(data => {
            if (data.blocked) {
                // Создаем оверлей для заблокированного пользователя
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = '#000';
                overlay.style.color = '#fff';
                overlay.style.display = 'flex';
                overlay.style.justifyContent = 'center';
                overlay.style.alignItems = 'center';
                overlay.style.zIndex = '9999';
                overlay.style.fontSize = '24px';
                overlay.style.fontFamily = 'Arial, sans-serif';
                overlay.textContent = 'Аккаунт заблокирован';
                
                // Очищаем содержимое страницы и добавляем оверлей
                document.body.innerHTML = '';
                document.body.appendChild(overlay);
            }
        })
        .catch(error => console.error('Error checking block status:', error));
}

// Проверяем статус блокировки при загрузке страницы
document.addEventListener('DOMContentLoaded', checkBlockStatus);

// Проверяем статус блокировки каждые 30 секунд
setInterval(checkBlockStatus, 30000); 