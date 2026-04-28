const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

class TicTacToe {
    constructor() {
        this.cells = document.querySelectorAll('.cell');
        this.gameStatus = document.getElementById('gameStatus');
        this.player1Score = document.getElementById('player1Score');
        this.player2Score = document.getElementById('player2Score');
        this.drawScore = document.getElementById('drawScore');
        this.player1Label = document.getElementById('player1Label');
        this.player2Label = document.getElementById('player2Label');
        this.gameModeSelect = document.getElementById('gameMode');
        this.difficultySelect = document.getElementById('aiDifficulty');
        this.difficultyContainer = document.getElementById('difficultyContainer');
        this.themeSelect = document.getElementById('themeSelect');
        this.resetBtn = document.getElementById('resetBtn');

        this.loadFromLocalStorage();
        this.state = this.createInitialState();
        this.bindEvents();
        this.updateUI();
    }

    createInitialState() {
        return {
            board: Array(9).fill(''),
            currentPlayer: 'X',
            gameMode: 'pvp',
            difficulty: 'easy',
            gameOver: false,
            winningCombination: null
        };
    }

    loadFromLocalStorage() {
        const savedScores = localStorage.getItem('tictactoe_scores');
        if (savedScores) {
            this.scores = JSON.parse(savedScores);
        } else {
            this.scores = { player1: 0, player2: 0, draw: 0 };
        }

        const savedTheme = localStorage.getItem('tictactoe_theme');
        if (savedTheme) {
            this.theme = savedTheme;
            this.themeSelect.value = savedTheme;
        } else {
            this.theme = 'classic';
        }
    }

    saveScoresToLocalStorage() {
        localStorage.setItem('tictactoe_scores', JSON.stringify(this.scores));
    }

    saveThemeToLocalStorage() {
        localStorage.setItem('tictactoe_theme', this.theme);
    }

    bindEvents() {
        this.cells.forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });

        this.gameModeSelect.addEventListener('change', () => {
            this.state.gameMode = this.gameModeSelect.value;
            this.updateDifficultyVisibility();
            this.updatePlayerLabels();
            this.resetGame();
        });

        this.difficultySelect.addEventListener('change', () => {
            this.state.difficulty = this.difficultySelect.value;
            this.resetGame();
        });

        this.themeSelect.addEventListener('change', () => {
            this.theme = this.themeSelect.value;
            this.applyTheme();
            this.saveThemeToLocalStorage();
        });

        this.resetBtn.addEventListener('click', () => this.resetGame());
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    updateDifficultyVisibility() {
        if (this.state.gameMode === 'pve') {
            this.difficultyContainer.style.display = 'flex';
        } else {
            this.difficultyContainer.style.display = 'none';
        }
    }

    updatePlayerLabels() {
        if (this.state.gameMode === 'pve') {
            this.player1Label.textContent = '玩家 X';
            this.player2Label.textContent = 'AI O';
        } else {
            this.player1Label.textContent = '玩家 X';
            this.player2Label.textContent = '玩家 O';
        }
    }

    handleCellClick(e) {
        const cell = e.target;
        const index = parseInt(cell.dataset.index);

        if (this.state.board[index] !== '' || this.state.gameOver) {
            return;
        }

        this.makeMove(index);

        if (!this.state.gameOver && this.state.gameMode === 'pve' && this.state.currentPlayer === 'O') {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    makeMove(index) {
        if (this.state.gameOver || this.state.board[index] !== '') {
            return;
        }

        this.state.board[index] = this.state.currentPlayer;
        this.updateCellUI(index);

        const winner = this.checkWinner();
        if (winner) {
            this.state.gameOver = true;
            this.state.winningCombination = winner.combination;
            this.highlightWinningCells();
            this.updateStatus(`玩家 ${winner.player} 获胜！`);
            this.updateScores(winner.player);
            return;
        }

        if (this.isBoardFull()) {
            this.state.gameOver = true;
            this.updateStatus('平局！');
            this.scores.draw++;
            this.saveScoresToLocalStorage();
            this.updateScoreboard();
            return;
        }

        this.state.currentPlayer = this.state.currentPlayer === 'X' ? 'O' : 'X';
        this.updateStatus();
    }

    makeAIMove() {
        if (this.state.gameOver) return;

        let moveIndex;

        if (this.state.difficulty === 'easy') {
            moveIndex = this.getRandomMove();
        } else {
            moveIndex = this.getBestMove();
        }

        if (moveIndex !== -1) {
            this.makeMove(moveIndex);
        }
    }

    getRandomMove() {
        const availableMoves = [];
        for (let i = 0; i < 9; i++) {
            if (this.state.board[i] === '') {
                availableMoves.push(i);
            }
        }

        if (availableMoves.length === 0) return -1;

        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        return availableMoves[randomIndex];
    }

    getBestMove() {
        let bestScore = -Infinity;
        let bestMove = -1;

        for (let i = 0; i < 9; i++) {
            if (this.state.board[i] === '') {
                this.state.board[i] = 'O';
                const score = this.minimax(this.state.board, 0, false);
                this.state.board[i] = '';

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }

        return bestMove;
    }

    minimax(board, depth, isMaximizing) {
        const result = this.evaluateBoard(board);

        if (result !== null) {
            return result - depth;
        }

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    const score = this.minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    const score = this.minimax(board, depth + 1, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    evaluateBoard(board) {
        for (const combo of WINNING_COMBINATIONS) {
            const [a, b, c] = combo;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a] === 'O' ? 10 : -10;
            }
        }

        if (board.every(cell => cell !== '')) {
            return 0;
        }

        return null;
    }

    checkWinner() {
        for (const combo of WINNING_COMBINATIONS) {
            const [a, b, c] = combo;
            if (this.state.board[a] && 
                this.state.board[a] === this.state.board[b] && 
                this.state.board[a] === this.state.board[c]) {
                return { player: this.state.board[a], combination: combo };
            }
        }
        return null;
    }

    isBoardFull() {
        return this.state.board.every(cell => cell !== '');
    }

    updateScores(winner) {
        if (winner === 'X') {
            this.scores.player1++;
        } else if (winner === 'O') {
            this.scores.player2++;
        }
        this.saveScoresToLocalStorage();
        this.updateScoreboard();
    }

    updateCellUI(index) {
        const cell = this.cells[index];
        const value = this.state.board[index];
        cell.textContent = value;
        cell.classList.add('taken');
        if (value === 'X') {
            cell.classList.add('x');
        } else if (value === 'O') {
            cell.classList.add('o');
        }
    }

    highlightWinningCells() {
        if (this.state.winningCombination) {
            this.state.winningCombination.forEach(index => {
                this.cells[index].classList.add('winning');
            });
        }
    }

    updateStatus(message) {
        if (message) {
            this.gameStatus.textContent = message;
        } else {
            if (this.state.gameMode === 'pve' && this.state.currentPlayer === 'O') {
                this.gameStatus.textContent = 'AI 思考中...';
            } else {
                this.gameStatus.textContent = `玩家 ${this.state.currentPlayer} 的回合`;
            }
        }
    }

    updateScoreboard() {
        this.player1Score.textContent = this.scores.player1.toString();
        this.player2Score.textContent = this.scores.player2.toString();
        this.drawScore.textContent = this.scores.draw.toString();
    }

    resetGame() {
        this.state = {
            ...this.createInitialState(),
            gameMode: this.state.gameMode,
            difficulty: this.state.difficulty
        };

        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('taken', 'x', 'o', 'winning');
        });

        this.updateStatus();
    }

    updateUI() {
        this.applyTheme();
        this.updateDifficultyVisibility();
        this.updatePlayerLabels();
        this.updateScoreboard();
        this.updateStatus();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});
