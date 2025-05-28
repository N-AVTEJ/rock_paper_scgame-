// Game state
const state = {
    userScore: 0,
    computerScore: 0,
    userChoice: null,
    computerChoice: null,
    isPlaying: false,
    difficulty: 'easy',
    winStreak: 0,
    bestScore: 0,
    totalGames: 0,
    playerPower: 0,
    computerPower: 0,
    combo: 0,
    moveHistory: []
};

// DOM Elements
const userScoreEl = document.getElementById('user-score');
const computerScoreEl = document.getElementById('computer-score');
const resultText = document.getElementById('result-text');
const userMoveEl = document.getElementById('user-move');
const computerMoveEl = document.getElementById('computer-move');
const choices = document.querySelectorAll('.choice');
const resetBtn = document.getElementById('reset-btn');
const themeToggle = document.querySelector('.theme-toggle');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
const rulesBtn = document.getElementById('rules-btn');
const rulesModal = document.getElementById('rules-modal');
const closeModalBtn = document.querySelector('.close-modal');
const winStreakEl = document.getElementById('win-streak');
const bestScoreEl = document.getElementById('best-score');
const totalGamesEl = document.getElementById('total-games');
const playerPowerEl = document.getElementById('player-power');
const computerPowerEl = document.getElementById('computer-power');
const comboFillEl = document.getElementById('combo-fill');

// Audio elements
const clickSound = document.getElementById('click-sound');
const winSound = document.getElementById('win-sound');
const loseSound = document.getElementById('lose-sound');
const comboSound = document.getElementById('combo-sound');
const victoryFanfare = document.getElementById('victory-fanfare');
const streakSound = document.getElementById('streak-sound');
const perfectWin = document.getElementById('perfect-win');

// Initialize game
function init() {
    // Load saved state
    loadGameState();

    // Event listeners
    choices.forEach(choice => {
        choice.addEventListener('click', () => handleChoice(choice.dataset.choice));
    });

    resetBtn.addEventListener('click', resetGame);
    themeToggle.addEventListener('click', toggleTheme);
    rulesBtn.addEventListener('click', showRules);
    closeModalBtn.addEventListener('click', hideRules);
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => setDifficulty(btn.dataset.difficulty));
    });

    // Close modal when clicking outside
    rulesModal.addEventListener('click', (e) => {
        if (e.target === rulesModal) hideRules();
    });

    // Update UI
    updateScoreDisplay();
    updateStatsDisplay();
    updatePowerMeters();
}

// Load game state from localStorage
function loadGameState() {
    const savedState = JSON.parse(localStorage.getItem('rpsState')) || {};
    state.userScore = savedState.userScore || 0;
    state.computerScore = savedState.computerScore || 0;
    state.difficulty = savedState.difficulty || 'easy';
    state.winStreak = savedState.winStreak || 0;
    state.bestScore = savedState.bestScore || 0;
    state.totalGames = savedState.totalGames || 0;
    state.playerPower = savedState.playerPower || 0;
    state.computerPower = savedState.computerPower || 0;
    state.moveHistory = savedState.moveHistory || [];

    // Set active difficulty button
    difficultyBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.difficulty === state.difficulty);
    });
}

// Save game state to localStorage
function saveGameState() {
    localStorage.setItem('rpsState', JSON.stringify({
        userScore: state.userScore,
        computerScore: state.computerScore,
        difficulty: state.difficulty,
        winStreak: state.winStreak,
        bestScore: state.bestScore,
        totalGames: state.totalGames,
        playerPower: state.playerPower,
        computerPower: state.computerPower,
        moveHistory: state.moveHistory
    }));
}

// Set game difficulty
function setDifficulty(difficulty) {
    state.difficulty = difficulty;
    difficultyBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
    });
    saveGameState();
}

// Show rules modal
function showRules() {
    rulesModal.classList.add('active');
}

// Hide rules modal
function hideRules() {
    rulesModal.classList.remove('active');
}

// Handle user choice
function handleChoice(choice) {
    if (state.isPlaying) return;
    
    state.isPlaying = true;
    state.userChoice = choice;
    state.moveHistory.push(choice);
    
    // Play click sound
    clickSound.currentTime = 0;
    clickSound.play();

    // Update UI with animation
    userMoveEl.innerHTML = `<i class="fas fa-hand-${choice}"></i>`;
    userMoveEl.classList.add('winner');
    setTimeout(() => userMoveEl.classList.remove('winner'), 800);
    
    resultText.textContent = 'Computer is choosing...';
    
    // Add enhanced shake animation
    computerMoveEl.classList.add('shake');
    
    // Computer choice with delay and multiple animations
    let shakeCount = 0;
    const maxShakes = 3;
    const shakeInterval = setInterval(() => {
        if (shakeCount >= maxShakes) {
            clearInterval(shakeInterval);
            computerMoveEl.classList.remove('shake');
            state.computerChoice = getComputerChoice();
            computerMoveEl.innerHTML = `<i class="fas fa-hand-${state.computerChoice}"></i>`;
            
            // Determine winner
            const result = getWinner(state.userChoice, state.computerChoice);
            updateScore(result);
            showResult(result);
            
            state.isPlaying = false;
        }
        shakeCount++;
    }, 800);
}

// Get computer choice based on difficulty
function getComputerChoice() {
    const choices = ['rock', 'paper', 'scissors'];
    
    if (state.difficulty === 'easy') {
        return choices[Math.floor(Math.random() * choices.length)];
    }
    
    if (state.difficulty === 'medium') {
        // Analyze last 3 moves and counter the most common choice
        const lastMoves = state.moveHistory.slice(-3);
        const moveCount = lastMoves.reduce((acc, move) => {
            acc[move] = (acc[move] || 0) + 1;
            return acc;
        }, {});
        
        const mostCommonMove = Object.entries(moveCount)
            .sort((a, b) => b[1] - a[1])[0]?.[0];
            
        if (mostCommonMove) {
            const counterMoves = {
                rock: 'paper',
                paper: 'scissors',
                scissors: 'rock'
            };
            return counterMoves[mostCommonMove];
        }
    }
    
    if (state.difficulty === 'hard') {
        // Advanced AI: Predict next move based on patterns
        const patterns = analyzePatterns();
        if (patterns.length > 0) {
            const predictedMove = patterns[0].next;
            const counterMoves = {
                rock: 'paper',
                paper: 'scissors',
                scissors: 'rock'
            };
            return counterMoves[predictedMove];
        }
    }
    
    return choices[Math.floor(Math.random() * choices.length)];
}

// Analyze move patterns for hard difficulty
function analyzePatterns() {
    const patterns = [];
    const history = state.moveHistory;
    
    // Look for patterns of length 2
    for (let i = 0; i < history.length - 2; i++) {
        if (history[i] === history[history.length - 2] && 
            history[i + 1] === history[history.length - 1]) {
            patterns.push({
                pattern: [history[i], history[i + 1]],
                next: history[i + 2],
                confidence: 1
            });
        }
    }
    
    return patterns.sort((a, b) => b.confidence - a.confidence);
}

// Determine winner
function getWinner(userChoice, computerChoice) {
    if (userChoice === computerChoice) return 'draw';
    
    const winConditions = {
        rock: 'scissors',
        paper: 'rock',
        scissors: 'paper'
    };
    
    return winConditions[userChoice] === computerChoice ? 'win' : 'lose';
}

// Play victory sounds based on win conditions
function playVictorySounds() {
    // Reset all sounds
    [winSound, victoryFanfare, streakSound, perfectWin].forEach(sound => {
        sound.currentTime = 0;
    });

    // Play base win sound
    winSound.play();

    // Play additional sounds based on conditions
    if (state.winStreak >= 5) {
        // Play perfect win sound for 5+ win streak
        setTimeout(() => {
            perfectWin.play();
        }, 500);
    } else if (state.winStreak >= 3) {
        // Play streak sound for 3+ win streak
        setTimeout(() => {
            streakSound.play();
        }, 500);
    }

    // Play victory fanfare for significant wins
    if (state.playerPower >= 80) {
        setTimeout(() => {
            victoryFanfare.play();
        }, 1000);
    }
}

// Update score and stats
function updateScore(result) {
    state.totalGames++;
    
    if (result === 'win') {
        state.userScore++;
        state.winStreak++;
        state.combo++;
        state.playerPower = Math.min(100, state.playerPower + 10);
        
        // Play victory sounds
        playVictorySounds();
        
        if (state.combo >= 3) {
            comboSound.currentTime = 0;
            comboSound.play();
        }
    } else if (result === 'lose') {
        state.computerScore++;
        state.winStreak = 0;
        state.combo = 0;
        state.computerPower = Math.min(100, state.computerPower + 10);
        loseSound.currentTime = 0;
        loseSound.play();
    } else {
        state.combo = 0;
    }
    
    state.bestScore = Math.max(state.bestScore, state.userScore);
    
    updateScoreDisplay();
    updateStatsDisplay();
    updatePowerMeters();
    updateComboMeter();
    saveGameState();
}

// Update score display
function updateScoreDisplay() {
    userScoreEl.textContent = state.userScore;
    computerScoreEl.textContent = state.computerScore;
}

// Update stats display
function updateStatsDisplay() {
    winStreakEl.textContent = state.winStreak;
    bestScoreEl.textContent = state.bestScore;
    totalGamesEl.textContent = state.totalGames;
}

// Update power meters
function updatePowerMeters() {
    playerPowerEl.style.width = `${state.playerPower}%`;
    computerPowerEl.style.width = `${state.computerPower}%`;
}

// Update combo meter
function updateComboMeter() {
    comboFillEl.style.width = `${(state.combo / 3) * 100}%`;
}

// Show result with enhanced animations and sounds
function showResult(result) {
    const messages = {
        win: state.winStreak >= 5 ? 'Perfect Victory! 🏆' :
             state.winStreak >= 3 ? 'Amazing Streak! 🔥' :
             'You win! 🎉',
        lose: 'Computer wins! 😢',
        draw: 'It\'s a draw! 🤝'
    };
    
    resultText.textContent = messages[result];
    
    // Enhanced winner animation
    if (result !== 'draw') {
        const winnerEl = result === 'win' ? userMoveEl : computerMoveEl;
        winnerEl.classList.add('winner');
        
        // Add a slight delay before removing the animation
        setTimeout(() => {
            winnerEl.classList.remove('winner');
        }, 800);
    } else {
        // Draw animation - both hands shake
        userMoveEl.classList.add('shake');
        computerMoveEl.classList.add('shake');
        setTimeout(() => {
            userMoveEl.classList.remove('shake');
            computerMoveEl.classList.remove('shake');
        }, 800);
    }
}

// Reset game
function resetGame() {
    state.userScore = 0;
    state.computerScore = 0;
    state.userChoice = null;
    state.computerChoice = null;
    state.isPlaying = false;
    state.winStreak = 0;
    state.combo = 0;
    state.playerPower = 0;
    state.computerPower = 0;
    
    updateScoreDisplay();
    updateStatsDisplay();
    updatePowerMeters();
    updateComboMeter();
    saveGameState();
    
    resultText.textContent = 'Choose your move!';
    userMoveEl.innerHTML = '<i class="fas fa-question"></i>';
    computerMoveEl.innerHTML = '<i class="fas fa-question"></i>';
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('rpsTheme', newTheme);
    updateThemeIcon(newTheme);
}

// Update theme icon
function updateThemeIcon(theme) {
    themeToggle.innerHTML = `<i class="fas fa-${theme === 'light' ? 'moon' : 'sun'}"></i>`;
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 