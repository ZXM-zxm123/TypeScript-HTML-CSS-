type Player = 'X' | 'O' | '';
type Board = Player[];
type GameMode = 'pvp' | 'pve';
type Difficulty = 'easy' | 'hard';
type Theme = 'classic' | 'neon' | 'retro';

interface GameState {
    board: Board;
    currentPlayer: Player;
    gameMode: GameMode;
    difficulty: Difficulty;
    gameOver: boolean;
    winningCombination: number[] | null;
}

interface Scores {
    player1: number;
    player2: number;
    draw: number;
}

const WINNING_COMBINATIONS: number[][] = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

class TicTacToe {
    private state: GameState;
    private scores: Scores;
    private theme: Theme;

    private cells: NodeListOf<HTMLDivElement>;
    private gameStatus: HTMLDivElement;
    private player1Score: HTMLSpanElement;
    private player2Score: HTMLSpanElement;
    private drawScore: HTMLSpanElement;
    private player1Label: HTMLSpanElement;
    private player2Label: HTMLSpanElement;
    private gameModeSelect: HTMLSelectElement;
    private difficultySelect: HTMLSelectElement;
    private difficultyContainer: HTMLDivElement;
    private themeSelect: HTMLSelectElement;
    private resetBtn: HTMLButtonElement;

    constructor() {
        this.cells = document.querySelectorAll('.cell');
        this.gameStatus = document.getElementById('gameStatus') as HTMLDivElement;
        this.player1Score = document.getElementById('player1Score') as HTMLSpanElement;
        this.player2Score = document.getElementById('player2Score') as HTMLSpanElement;
        this.drawScore = document.getElementById('drawScore') as HTMLSpanElement;
        this.player1Label = document.getElementById('player1Label') as HTMLSpanElement;
        this.player2Label = document.getElementById('player2Label') as HTMLSpanElement;
        this.gameModeSelect = document.getElementById('gameMode') as HTMLSelectElement;
        this.difficultySelect = document.getElementById('aiDifficulty') as HTMLSelectElement;
        this.difficultyContainer = document.getElementById('difficultyContainer') as HTMLDivElement;
        this.themeSelect = document.getElementById('themeSelect') as HTMLSelectElement;
        this.resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;

        this.loadFromLocalStorage();
        this.state = this.createInitialState();
        this.bindEvents();
        this.updateUI();
    }

    private createInitialState(): GameState {
        return {
            board: Array(9).fill(''),
            currentPlayer: 'X',
            gameMode: 'pvp',
            difficulty: 'easy',
            gameOver: false,
            winningCombination: null
        };
    }

    private loadFromLocalStorage(): void {
        const savedScores = localStorage.getItem('tictactoe_scores');
        if (savedScores) {
            this.scores = JSON.parse(savedScores);
        } else {
            this.scores = { player1: 0, player2: 0, draw: 0 };
        }

        const savedTheme = localStorage.getItem('tictactoe_theme') as Theme;
        if (savedTheme) {
            this.theme = savedTheme;
            this.themeSelect.value = savedTheme;
        } else {
            this.theme = 'classic';
        }
    }

    private saveScoresToLocalStorage(): void {
        localStorage.setItem('tictactoe_scores', JSON.stringify(this.scores));
    }

    private saveThemeToLocalStorage(): void {
        localStorage.setItem('tictactoe_theme', this.theme);
    }

    private bindEvents(): void {
        this.cells.forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });

        this.gameModeSelect.addEventListener('change', () => {
            this.state.gameMode = this.gameModeSelect.value as GameMode;
            this.updateDifficultyVisibility();
            this.updatePlayerLabels();
            this.resetGame();
        });

        this.difficultySelect.addEventListener('change', () => {
            this.state.difficulty = this.difficultySelect.value as Difficulty;
            this.resetGame();
        });

        this.themeSelect.addEventListener('change', () => {
            this.theme = this.themeSelect.value as Theme;
            this.applyTheme();
            this.saveThemeToLocalStorage();
        });

        this.resetBtn.addEventListener('click', () => this.resetGame());
    }

    private applyTheme(): void {
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    private updateDifficultyVisibility(): void {
        if (this.state.gameMode === 'pve') {
            this.difficultyContainer.style.display = 'flex';
        } else {
            this.difficultyContainer.style.display = 'none';
        }
    }

    private updatePlayerLabels(): void {
        if (this.state.gameMode === 'pve') {
            this.player1Label.textContent = '玩家 X';
            this.player2Label.textContent = 'AI O';
        } else {
            this.player1Label.textContent = '玩家 X';
            this.player2Label.textContent = '玩家 O';
        }
    }

    private handleCellClick(e: Event): void {
        const cell = e.target as HTMLDivElement;
        const index = parseInt(cell.dataset.index as string);

        if (this.state.board[index] !== '' || this.state.gameOver) {
            return;
        }

        this.makeMove(index);

        if (!this.state.gameOver && this.state.gameMode === 'pve' && this.state.currentPlayer === 'O') {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    private makeMove(index: number): void {
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

    private makeAIMove(): void {
        if (this.state.gameOver) return;

        let moveIndex: number;

        if (this.state.difficulty === 'easy') {
            moveIndex = this.getRandomMove();
        } else {
            moveIndex = this.getBestMove();
        }

        if (moveIndex !== -1) {
            this.makeMove(moveIndex);
        }
    }

    private getRandomMove(): number {
        const availableMoves: number[] = [];
        for (let i = 0; i < 9; i++) {
            if (this.state.board[i] === '') {
                availableMoves.push(i);
            }
        }

        if (availableMoves.length === 0) return -1;

        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        return availableMoves[randomIndex];
    }

    private getBestMove(): number {
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

    private minimax(board: Board, depth: number, isMaximizing: boolean): number {
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

    private evaluateBoard(board: Board): number | null {
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

    private checkWinner(): { player: Player; combination: number[] } | null {
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

    private isBoardFull(): boolean {
        return this.state.board.every(cell => cell !== '');
    }

    private updateScores(winner: Player): void {
        if (winner === 'X') {
            this.scores.player1++;
        } else if (winner === 'O') {
            this.scores.player2++;
        }
        this.saveScoresToLocalStorage();
        this.updateScoreboard();
    }

    private updateCellUI(index: number): void {
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

    private highlightWinningCells(): void {
        if (this.state.winningCombination) {
            this.state.winningCombination.forEach(index => {
                this.cells[index].classList.add('winning');
            });
        }
    }

    private updateStatus(message?: string): void {
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

    private updateScoreboard(): void {
        this.player1Score.textContent = this.scores.player1.toString();
        this.player2Score.textContent = this.scores.player2.toString();
        this.drawScore.textContent = this.scores.draw.toString();
    }

    private resetGame(): void {
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

    private updateUI(): void {
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
