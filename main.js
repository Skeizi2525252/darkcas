document.addEventListener('DOMContentLoaded', function() {
    // Обработка кнопки регистрации
    const registerBtn = document.querySelector('.register-btn');
    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            // Здесь будет логика регистрации
            console.log('Регистрация');
        });
    }

    // Обработка кликов по играм
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(card => {
        card.addEventListener('click', function() {
            const gameName = this.querySelector('h3').textContent;
            if (gameName === 'Мины') {
                window.location.href = 'mines.html';
            }
            // Здесь будет логика перехода к другим играм
        });
    });

    // Обработка поиска
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const games = document.querySelectorAll('.game-card');
            
            games.forEach(game => {
                const gameName = game.querySelector('h3').textContent.toLowerCase();
                if (gameName.includes(searchTerm)) {
                    game.style.display = 'block';
                } else {
                    game.style.display = 'none';
                }
            });
        });
    }

    // Обработка категорий
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок
            categoryBtns.forEach(b => b.classList.remove('active'));
            // Добавляем активный класс нажатой кнопке
            this.classList.add('active');
            
            // Здесь будет логика фильтрации игр по категориям
            const category = this.textContent;
            console.log(`Выбрана категория: ${category}`);
        });
    });

    // Обработчики для игры Мины
    const betInput = document.querySelector('.bet-input');
    const betButton = document.querySelector('.bet-button');
    const multiplierButtons = document.querySelectorAll('.multiplier-btn');
    const mineCells = document.querySelectorAll('.mine-cell');
    const mineSound = document.getElementById('mineSound');
    const diamondSound = document.getElementById('diamondSound');
    
    let gameActive = false;
    let currentBet = 0;
    let currentMines = 3;
    let mines = [];
    let revealedCells = 0;
    let currentWinnings = 0;
    let userStats = {
        totalGames: 0,
        totalWins: 0,
        totalLosses: 0,
        totalWinnings: 0,
        initialBalance: 100,
        currentBalance: 100
    };

    // Безопасная генерация случайных чисел
    function secureRandom() {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return array[0] / (0xffffffff + 1);
    }

    // Проверка статистики игрока
    function shouldForceLose() {
        if (userStats.totalGames < 3) return false;
        
        const winRate = userStats.totalWins / userStats.totalGames;
        const profitRatio = userStats.totalWinnings / userStats.initialBalance;
        
        return winRate > 0.7 || profitRatio > 3;
    }

    function updateButtonState() {
        const buttonText = betButton.querySelector('.button-text');
        if (gameActive) {
            betButton.classList.add('playing');
            buttonText.textContent = `Забрать ${currentWinnings} ₽`;
        } else {
            betButton.classList.remove('playing');
            buttonText.textContent = 'Играть';
        }
    }

    function calculateWinnings() {
        // Формула выигрыша: ставка * (1 + количество_открытых_ячеек * 0.1)
        return Math.floor(currentBet * (1 + revealedCells * 0.1));
    }

    function updateBalance() {
        const balanceElement = document.querySelector('.user-balance');
        if (balanceElement) {
            balanceElement.textContent = `${userStats.currentBalance.toFixed(2)} ₽`;
            
            // Добавляем класс для недостаточного баланса
            if (userStats.currentBalance <= 0) {
                balanceElement.classList.add('insufficient');
                disableGameControls();
            } else {
                balanceElement.classList.remove('insufficient');
                enableGameControls();
            }
        }
    }

    function disableGameControls() {
        betButton.disabled = true;
        betInput.disabled = true;
        multiplierButtons.forEach(btn => btn.disabled = true);
        mineCells.forEach(cell => {
            cell.style.pointerEvents = 'none';
            cell.style.opacity = '0.5';
        });
    }

    function enableGameControls() {
        if (!gameActive) {
            betButton.disabled = false;
            betInput.disabled = false;
            multiplierButtons.forEach(btn => btn.disabled = false);
            mineCells.forEach(cell => {
                cell.style.pointerEvents = 'auto';
                cell.style.opacity = '1';
            });
        }
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 1400);
    }

    function startGame() {
        if (userStats.currentBalance <= 0) {
            showNotification('Недостаточно средств');
            return;
        }

        if (!currentBet || !currentMines) {
            showNotification('Введите сумму ставки');
            return;
        }

        if (currentBet > userStats.currentBalance) {
            showNotification('Недостаточно средств');
            return;
        }

        gameActive = true;
        revealedCells = 0;
        currentWinnings = currentBet;
        mines = [];
        
        // Определяем количество мин на основе статистики
        const forceLose = shouldForceLose();
        const mineCount = forceLose ? currentMines + 2 : currentMines;
        
        // Создаем мины с учетом статистики
        while (mines.length < mineCount) {
            const mineIndex = Math.floor(secureRandom() * 25);
            if (!mines.includes(mineIndex)) {
                mines.push(mineIndex);
            }
        }

        // Сбрасываем состояние ячеек
        mineCells.forEach(cell => {
            cell.classList.remove('revealed', 'mine');
            cell.innerHTML = '';
        });

        // Блокируем кнопки выбора мин
        multiplierButtons.forEach(btn => btn.disabled = true);
        betInput.disabled = true;
        
        updateButtonState();
    }

    // Настройка звуков
    function setupSounds() {
        // Обрезаем звук взрыва до 0.5 секунд
        mineSound.addEventListener('timeupdate', function() {
            if (this.currentTime > 0.5) {
                this.pause();
                this.currentTime = 0;
            }
        });

        // Обрезаем звук кристалла до 0.3 секунд
        diamondSound.addEventListener('timeupdate', function() {
            if (this.currentTime > 0.2199) {
                this.pause();
                this.currentTime = 0;
            }
        });
    }

    // Инициализация звуков
    setupSounds();

    function playSound(sound) {
        sound.currentTime = 0;
        sound.play();
    }

    function endGame(win) {
        if (!gameActive) {
            return;
        }

        gameActive = false;
        revealedCells = 0;
        currentWinnings = currentBet;
        mines = [];
        
        if (win) {
            const multiplier = parseFloat(multipliers[currentMultiplierIndex].textContent);
            const winAmount = currentBet * multiplier;
            userStats.currentBalance += winAmount;
        }
        
        updateBalance();
        betButton.classList.remove('playing');
        betButton.querySelector('.button-text').textContent = 'Играть';
        betInput.disabled = false;
        
        // Проверяем баланс после игры
        if (userStats.currentBalance <= 0) {
            disableGameControls();
            showNotification('Недостаточно средств');
        } else {
            enableGameControls();
        }
    }

    if (betButton) {
        betButton.addEventListener('click', function() {
            if (userStats.currentBalance <= 0) {
                showNotification('Недостаточно средств');
                return;
            }

            if (!gameActive) {
                let betAmount = parseInt(betInput.value);
                
                if (!betAmount || betAmount <= 0) {
                    betAmount = Math.floor(userStats.currentBalance * 0.5);
                    betInput.value = betAmount;
                }

                if (betAmount > userStats.currentBalance) {
                    showNotification('Недостаточно средств');
                    return;
                }

                if (betAmount > 0) {
                    currentBet = betAmount;
                    userStats.currentBalance -= betAmount;
                    updateBalance();
                    startGame();
                }
            } else {
                endGame(true);
            }
        });
    }

    if (multiplierButtons.length > 0) {
        multiplierButtons.forEach(button => {
            button.addEventListener('click', function() {
                if (gameActive || userStats.currentBalance <= 0) return;
                
                multiplierButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentMines = parseInt(this.textContent);
            });
        });
    }

    // Инициализация баланса и проверка состояния
    updateBalance();
    if (userStats.currentBalance <= 0) {
        disableGameControls();
    }
});

class MinesGame {
    constructor() {
        this.gameField = document.querySelector('.game-field');
        this.betInput = document.querySelector('.bet-input');
        this.betButton = document.querySelector('.bet-button');
        this.multiplierValues = document.querySelector('.multiplier-values');
        this.multipliers = document.querySelectorAll('.multiplier');
        this.multiplierButtons = document.querySelectorAll('.multiplier-btn');
        this.currentMultiplierIndex = 0;
        this.isPlaying = false;
        this.currentBet = 0;
        this.selectedMines = 3;
        this.hasClicked = false;
        this.isProcessing = false;
        this.mines = [];
        this.userStats = {
            currentBalance: parseFloat(localStorage.getItem('userBalance')) || 100,
            lastActionTime: 0
        };
        
        this.init();
    }

    init() {
        this.betButton.addEventListener('click', () => {
            if (!this.isProcessing) {
                this.isProcessing = true;
                this.toggleGame();
                setTimeout(() => {
                    this.isProcessing = false;
                }, 300);
            }
        });

        // Добавляем обработчик для поля ввода ставки
        this.betInput.addEventListener('input', () => {
            const value = parseFloat(this.betInput.value);
            if (value > this.userStats.currentBalance) {
                this.betInput.value = this.userStats.currentBalance;
            }
        });

        this.multiplierButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.isPlaying) {
                    this.multiplierButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.selectedMines = parseInt(btn.textContent);
                    this.updateMultiplierValues();
                }
            });
        });

        Object.defineProperty(this.userStats, 'currentBalance', {
            get: function() {
                return this._balance || 100;
            },
            set: function(value) {
                if (typeof value !== 'number' || isNaN(value) || value < 0) {
                    console.error('Invalid balance value');
                    return;
                }
                this._balance = Math.floor(value * 100) / 100;
                localStorage.setItem('userBalance', this._balance);
            }
        });

        this.updateBalance();
        this.updateMultiplierValues();
        this.showInitialMultipliers();
        this.multiplierButtons[0].classList.add('active');
    }

    updateMultiplierValues() {
        const baseMultipliers = [1.02, 1.12, 1.19, 2.03, 2.50, 2.65, 2.89, 3.02, 3.15, 3.28, 3.41, 3.54, 3.67, 3.80, 3.93, 4.06, 4.19, 4.32, 4.45, 4.58, 4.71, 4.84, 4.97];
        const mineBonus = (this.selectedMines - 3) * 0.3; // Бонус за каждую мину сверх 3

        this.multipliers.forEach((multiplier, index) => {
            if (index < baseMultipliers.length) {
                const newValue = (baseMultipliers[index] + mineBonus).toFixed(2);
                multiplier.textContent = `${newValue}x`;
            }
        });
    }

    showInitialMultipliers() {
        this.multipliers.forEach((multiplier, index) => {
            if (index < 3) {
                multiplier.style.display = 'block';
                multiplier.classList.remove('active', 'passed');
            } else {
                multiplier.style.display = 'none';
            }
        });
    }

    updateMultipliers() {
        this.multipliers.forEach((multiplier, index) => {
            if (index < this.currentMultiplierIndex) {
                multiplier.style.display = 'block';
                multiplier.classList.add('passed');
                multiplier.classList.remove('active');
            } else if (index === this.currentMultiplierIndex) {
                multiplier.style.display = 'block';
                multiplier.classList.add('active');
                multiplier.classList.remove('passed');
            } else if (index <= this.currentMultiplierIndex + 2) {
                multiplier.style.display = 'block';
                multiplier.classList.remove('active', 'passed');
            } else {
                multiplier.style.display = 'none';
            }
        });
        this.updateButtonText();
    }

    updateButtonText() {
        if (this.isPlaying && this.hasClicked) {
            const currentMultiplier = parseFloat(this.multipliers[this.currentMultiplierIndex].textContent);
            const currentWin = Math.floor(this.currentBet * currentMultiplier * 100) / 100;
            this.betButton.querySelector('.button-text').textContent = `Забрать ${currentWin} ₽`;
        } else {
            this.betButton.querySelector('.button-text').textContent = 'Играть';
        }
    }

    toggleGame() {
        const now = Date.now();
        if (now - this.userStats.lastActionTime < 300) {
            return;
        }
        this.userStats.lastActionTime = now;

        if (this.isPlaying && this.hasClicked) {
            this.endGame(true);
        } else if (!this.isPlaying) {
            this.startGame();
        }
    }

    startGame() {
        if (this.isPlaying) {
            return;
        }

        let betAmount = parseFloat(this.betInput.value);
        
        // Если поле пустое или значение некорректное, используем 50% от баланса
        if (!betAmount || betAmount <= 0) {
            betAmount = Math.floor(this.userStats.currentBalance * 0.5);
            this.betInput.value = betAmount;
        }
        
        if (betAmount > 1000000) {
            this.showNotification('Некорректная сумма ставки');
            return;
        }

        if (betAmount > this.userStats.currentBalance) {
            this.showNotification('Недостаточно средств');
            return;
        }

        this.isProcessing = true;
        this.currentBet = betAmount;
        this.isPlaying = true;
        this.hasClicked = false;
        this.currentMultiplierIndex = 0;
        this.betButton.classList.add('playing');
        this.updateButtonText();
        
        try {
            this.userStats.currentBalance = Math.floor((this.userStats.currentBalance - betAmount) * 100) / 100;
            this.updateBalance();
        } catch (error) {
            console.error('Error updating balance:', error);
            this.showNotification('Ошибка при списании средств');
            this.isPlaying = false;
            this.isProcessing = false;
            return;
        }

        this.showInitialMultipliers();
        this.createGameField();
        this.isProcessing = false;
    }

    createGameField() {
        this.gameField.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'mines-grid';
        
        // Создаем массив с минами
        this.mines = [];
        const totalCells = 25;
        const mineCount = this.selectedMines;
        
        // Оптимизированная генерация мин
        const availableCells = Array.from({length: totalCells}, (_, i) => i);
        for (let i = 0; i < mineCount; i++) {
            const randomIndex = Math.floor(Math.random() * availableCells.length);
            this.mines.push(availableCells[randomIndex]);
            availableCells.splice(randomIndex, 1);
        }
        
        // Создаем ячейки
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'mine-cell';
            cell.dataset.index = i;
            
            // Используем делегирование событий для оптимизации
            cell.addEventListener('click', () => this.handleCellClick(cell));
            
            grid.appendChild(cell);
        }
        
        this.gameField.appendChild(grid);
    }

    handleCellClick(cell) {
        if (!this.isPlaying || cell.classList.contains('revealed')) {
            return;
        }

        this.hasClicked = true;
        const cellIndex = parseInt(cell.dataset.index);
        const isMine = this.mines.includes(cellIndex);
        
        // Добавляем класс revealed до проверки на мину для предотвращения двойных кликов
        cell.classList.add('revealed');
        
        if (isMine) {
            cell.classList.add('mine');
            const mineIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            mineIcon.innerHTML = '<use xlink:href="#mine-icon"/>';
            cell.appendChild(mineIcon);
            this.playSound('explosion');
            this.endGame(false);
        } else {
            cell.classList.add('diamond');
            const diamondIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            diamondIcon.innerHTML = '<use xlink:href="#diamond-icon"/>';
            cell.appendChild(diamondIcon);
            this.playSound('crystal');
            this.currentMultiplierIndex++;
            this.updateMultipliers();
            
            if (this.currentMultiplierIndex >= this.multipliers.length) {
                this.endGame(true);
            }
        }
    }

    endGame(win) {
        if (!this.isPlaying) {
            return;
        }

        this.isPlaying = false;
        this.hasClicked = false;
        this.betButton.classList.remove('playing');
        this.betButton.querySelector('.button-text').textContent = 'Играть';
        
        if (win) {
            const multiplier = parseFloat(this.multipliers[this.currentMultiplierIndex].textContent);
            const winAmount = Math.floor(this.currentBet * multiplier * 100) / 100;
            
            if (winAmount > 1000000) {
                this.showNotification('Превышен максимальный выигрыш');
                this.cleanupGame();
                return;
            }

            this.userStats.currentBalance = Math.floor((this.userStats.currentBalance + winAmount) * 100) / 100;
            this.updateBalance();
            this.cleanupGame();
        } else {
            // При проигрыше показываем все ячейки
            const cells = document.querySelectorAll('.mine-cell');
            cells.forEach((cell, index) => {
                if (!cell.classList.contains('revealed')) {
                    cell.classList.add('revealed');
                    if (this.mines.includes(index)) {
                        cell.classList.add('mine');
                        const mineIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                        mineIcon.innerHTML = '<use xlink:href="#mine-icon"/>';
                        cell.appendChild(mineIcon);
                    } else {
                        cell.classList.add('diamond');
                        const diamondIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                        diamondIcon.innerHTML = '<use xlink:href="#diamond-icon"/>';
                        cell.appendChild(diamondIcon);
                    }
                }
            });

            // Проверяем баланс после проигрыша
            if (this.userStats.currentBalance <= 0) {
                this.disableGameControls();
                this.showNotification('Недостаточно средств');
            } else {
                this.enableGameControls();
            }
        }
    }

    cleanupGame() {
        // Очищаем игровое поле
        this.gameField.innerHTML = '';
        
        // Сбрасываем состояние множителей
        this.currentMultiplierIndex = 0;
        this.showInitialMultipliers();
        
        // Сбрасываем текущую ставку
        this.currentBet = 0;
        
        // Очищаем массив мин
        this.mines = [];
        
        // Сбрасываем состояние кнопок
        this.betButton.disabled = false;
        this.betInput.disabled = false;
        this.multiplierButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('active');
        });
        
        // Активируем первую кнопку множителей по умолчанию
        this.multiplierButtons[0].classList.add('active');
        this.selectedMines = 3;
        
        // Обновляем значения множителей
        this.updateMultiplierValues();
    }

    updateBalance() {
        const balanceElement = document.querySelector('.user-balance');
        if (balanceElement) {
            const balance = Math.floor(this.userStats.currentBalance * 100) / 100;
            balanceElement.textContent = `${balance.toFixed(2)} ₽`;
            
            // Убираем проверку на недостаточный баланс, так как она не нужна во время игры
            if (!this.isPlaying && balance <= 0) {
                balanceElement.classList.add('insufficient');
                this.disableGameControls();
            } else {
                balanceElement.classList.remove('insufficient');
                this.enableGameControls();
            }
        }
    }

    disableGameControls() {
        this.betButton.disabled = true;
        this.betInput.disabled = true;
        const cells = document.querySelectorAll('.mine-cell');
        cells.forEach(cell => {
            cell.style.pointerEvents = 'none';
            cell.style.opacity = '0.5';
        });
    }

    enableGameControls() {
        if (!this.isPlaying) {
            this.betButton.disabled = false;
            this.betInput.disabled = false;
            const cells = document.querySelectorAll('.mine-cell');
            cells.forEach(cell => {
                cell.style.pointerEvents = 'auto';
                cell.style.opacity = '1';
            });
        }
    }

    playSound(type) {
        const sound = new Audio(`sounds/${type}.mp3`);
        sound.volume = 0.5;
        
        // Очищаем предыдущий звук перед воспроизведением нового
        if (this.currentSound) {
            this.currentSound.pause();
            this.currentSound.currentTime = 0;
        }
        
        this.currentSound = sound;
        sound.play();
        
        const maxDuration = type === 'explosion' ? 0.5 : 0.3;
        sound.addEventListener('timeupdate', () => {
            if (sound.currentTime > maxDuration) {
                sound.pause();
                sound.currentTime = 0;
            }
        });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 1400);
    }

    // Добавляем метод для сброса баланса (если нужно)
    resetBalance() {
        this.userStats.currentBalance = 100;
        localStorage.setItem('userBalance', 100);
        this.updateBalance();
    }
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.game-field')) {
        new MinesGame();
    }
});

class LoanManager {
    constructor() {
        this.loanAmount = 0;
        this.loanInterval = null;
        this.notificationInterval = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const depositBtn = document.querySelector('.deposit-btn');
        const loanBtn = document.querySelector('.loan-btn');
        const depositModal = document.querySelector('.deposit-modal');

        if (depositBtn) {
            depositBtn.addEventListener('click', () => {
                depositModal.style.display = 'flex';
            });
        }

        if (depositModal) {
            depositModal.addEventListener('click', (e) => {
                if (e.target === depositModal) {
                    depositModal.style.display = 'none';
                }
            });
        }

        if (loanBtn) {
            loanBtn.addEventListener('click', () => {
                if (!loanBtn.classList.contains('disabled')) {
                    this.takeLoan();
                }
            });
        }
    }

    takeLoan() {
        this.loanAmount = 100;
        const loanBtn = document.querySelector('.loan-btn');
        const balance = document.querySelector('.balance .amount');
        
        if (loanBtn && balance) {
            loanBtn.classList.add('disabled');
            loanBtn.textContent = 'У вас долг 100₽';
            
            // Update balance
            const currentBalance = parseInt(balance.textContent);
            balance.textContent = `${currentBalance + 100} ₽`;

            // Start notification interval
            this.startNotificationInterval();
        }
    }

    startNotificationInterval() {
        const notification = document.querySelector('.loan-notification');
        if (notification) {
            this.notificationInterval = setInterval(() => {
                notification.style.display = 'block';
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 3000);
            }, 30000); // Every 30 seconds
        }
    }

    payLoan() {
        const loanBtn = document.querySelector('.loan-btn');
        const balance = document.querySelector('.balance .amount');
        
        if (loanBtn && balance) {
            const currentBalance = parseInt(balance.textContent);
            if (currentBalance >= 70) { // 70% of loan amount
                balance.textContent = `${currentBalance - this.loanAmount} ₽`;
                loanBtn.classList.remove('disabled');
                loanBtn.innerHTML = `
                    <svg class="loan-icon" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    Игра в долг
                `;
                this.loanAmount = 0;
                clearInterval(this.notificationInterval);
            }
        }
    }
}

// Initialize loan manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.loanManager = new LoanManager();
}); 