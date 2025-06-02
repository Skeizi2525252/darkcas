class ProfileManager {
    constructor() {
        this.userData = {
            id: this.getRandomId(),
            username: localStorage.getItem('username') || 'Игрок',
            totalWon: parseFloat(localStorage.getItem('totalWon')) || 0,
            totalRefs: parseInt(localStorage.getItem('totalRefs')) || 0,
            totalDeposits: parseInt(localStorage.getItem('totalDeposits')) || 0
        };
        
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.updateReferralLink();
    }

    getRandomId() {
        return Math.floor(Math.random() * (999 - 666 + 1)) + 666;
    }

    loadUserData() {
        // Загружаем данные из localStorage или используем значения по умолчанию
        document.getElementById('userId').textContent = this.userData.id;
        document.getElementById('username').textContent = this.userData.username;
        document.getElementById('totalWon').textContent = this.userData.totalWon.toFixed(2) + ' ₽';
        document.getElementById('totalRefs').textContent = this.userData.totalRefs;
        document.getElementById('totalDeposits').textContent = this.userData.totalDeposits;
    }

    setupEventListeners() {
        // Обработчик редактирования имени
        const editIcon = document.querySelector('.edit-icon');
        const usernameElement = document.getElementById('username');
        
        editIcon.addEventListener('click', () => {
            const currentName = usernameElement.textContent;
            const newName = prompt('Введите новое имя:', currentName);
            
            if (newName && newName.trim() !== '') {
                this.userData.username = newName.trim();
                usernameElement.textContent = this.userData.username;
                localStorage.setItem('username', this.userData.username);
            }
        });

        // Обработчик копирования реферальной ссылки
        const copyButton = document.querySelector('.copy-button');
        copyButton.addEventListener('click', () => {
            const referralLink = document.getElementById('referralLink');
            referralLink.select();
            document.execCommand('copy');
            
            // Показываем уведомление о копировании
            this.showNotification('Ссылка скопирована!');
        });
    }

    updateReferralLink() {
        const referralLink = document.getElementById('referralLink');
        const baseUrl = window.location.origin;
        referralLink.value = `${baseUrl}/casino.html?ref=${this.userData.id}`;
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 2000);
    }

    // Методы для обновления статистики
    updateTotalWon(amount) {
        this.userData.totalWon += amount;
        localStorage.setItem('totalWon', this.userData.totalWon);
        document.getElementById('totalWon').textContent = this.userData.totalWon.toFixed(2) + ' ₽';
    }

    updateTotalRefs() {
        this.userData.totalRefs++;
        localStorage.setItem('totalRefs', this.userData.totalRefs);
        document.getElementById('totalRefs').textContent = this.userData.totalRefs;
    }

    updateTotalDeposits() {
        this.userData.totalDeposits++;
        localStorage.setItem('totalDeposits', this.userData.totalDeposits);
        document.getElementById('totalDeposits').textContent = this.userData.totalDeposits;
    }
}

// Инициализация профиля при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const profileManager = new ProfileManager();
}); 