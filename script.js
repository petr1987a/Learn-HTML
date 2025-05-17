// script.js — Интеграция нового шахматного мозга с существующей логикой интерфейса

const ChessEngine = require('./chess_ai'); // Импорт нового шахматного движка
const PIECES = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
};

const initialBoardSetup = [
    ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
    ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
    ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
];

let currentBoardState = [];
let selectedSquare = null;
let currentPlayer = 'w';
let gameStatus = "ongoing";

const boardElement = document.getElementById('chessBoard');
const messageElement = document.getElementById('message');
const currentPlayerElement = document.getElementById('currentPlayer');
const resetButton = document.getElementById('resetButton');

const chessEngine = new ChessEngine(); // Новый шахматный мозг

function updateInfoPanel(message) {
    messageElement.textContent = message;
    currentPlayerElement.textContent = currentPlayer === 'w' ? 'Белых' : 'Черных';
}

function initializeBoard() {
    currentBoardState = JSON.parse(JSON.stringify(initialBoardSetup));
    selectedSquare = null;
    currentPlayer = 'w';
    gameStatus = "ongoing";
    chessEngine.setPosition('startpos'); // Инициализация движка
    renderBoard();
    updateInfoPanel("Игра началась. Ход Белых.");
}

function renderBoard() {
    boardElement.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = row;
            square.dataset.col = col;

            const piece = currentBoardState[row][col];
            if (piece) {
                square.textContent = PIECES[piece];
                square.classList.add('piece');
                square.classList.add(piece.startsWith('w') ? 'white' : 'black');
            }

            square.addEventListener('click', () => onSquareClick(row, col));
            boardElement.appendChild(square);
        }
    }
}

function onSquareClick(row, col) {
    if (gameStatus !== "ongoing") {
        updateInfoPanel("Игра завершена. Нажмите 'Начать заново'.");
        return;
    }

    const piece = currentBoardState[row][col];
    if (selectedSquare) {
        const move = { from: selectedSquare, to: { row, col } };
        chessEngine.makeMove(selectedSquare, { rank: row, file: col });
        currentBoardState = chessEngine.board; // Синхронизация доски
        selectedSquare = null;
        renderBoard();
        switchPlayer();
    } else if (piece && piece.startsWith(currentPlayer)) {
        selectedSquare = { rank: row, file: col };
        updateInfoPanel("Выберите клетку для хода.");
    }
}

function makeBotMove() {
    const botColor = 'b';
    if (currentPlayer !== botColor || gameStatus !== "ongoing") return;

    const move = chessEngine.generateMove();
    if (move) {
        chessEngine.makeMove(move.from, move.to);
        currentBoardState = chessEngine.board; // Синхронизация доски
        renderBoard();
        switchPlayer();
    } else {
        updateInfoPanel("Бот не смог сделать ход.");
    }
}

function switchPlayer() {
    currentPlayer = currentPlayer === 'w' ? 'b' : 'w';
    updateInfoPanel(`Ход ${currentPlayer === 'w' ? 'Белых' : 'Черных'}`);
    if (currentPlayer === 'b') makeBotMove();
}

resetButton.addEventListener('click', initializeBoard);
document.addEventListener('DOMContentLoaded', initializeBoard);
