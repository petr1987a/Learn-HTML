// Новый шахматный движок
class ChessEngine {
    constructor() {
        this.board = this.initializeBoard(); // Инициализация доски
        this.currentPlayer = 'w'; // Белые начинают
    }

    initializeBoard() {
        // Упрощённая начальная позиция
        return [
            ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
            ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
            ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
        ];
    }

    setPosition(startpos, moves = []) {
        if (startpos === 'startpos') {
            this.board = this.initializeBoard(); // Устанавливаем начальную позицию
            this.currentPlayer = 'w';
        }

        // Применяем ходы
        for (const move of moves) {
            const from = this.parseSquare(move.substring(0, 2));
            const to = this.parseSquare(move.substring(2, 4));
            this.makeMove(from, to);
        }
    }

    parseSquare(square) {
        const file = square.charCodeAt(0) - 97; // 'a' -> 0, ..., 'h' -> 7
        const rank = 8 - parseInt(square[1]); // '8' -> 0, ..., '1' -> 7
        return { file, rank };
    }

    makeMove(from, to) {
        const piece = this.board[from.rank][from.file];
        this.board[to.rank][to.file] = piece;
        this.board[from.rank][from.file] = '';
        this.currentPlayer = this.currentPlayer === 'w' ? 'b' : 'w';
    }

    generateMove() {
        // Упрощённая логика генерации случайного хода для тестирования
        const moves = [];
        for (let rank = 0; rank < 8; rank++) {
            for (let file = 0; file < 8; file++) {
                const piece = this.board[rank][file];
                if (piece && piece[0] === this.currentPlayer) {
                    const direction = this.currentPlayer === 'w' ? -1 : 1;
                    const newRank = rank + direction;
                    if (newRank >= 0 && newRank < 8 && !this.board[newRank][file]) {
                        moves.push({
                            from: { rank, file },
                            to: { rank: newRank, file }
                        });
                    }
                }
            }
        }

        if (moves.length === 0) return null; // Нет доступных ходов
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        return randomMove;
    }

    formatMove(move) {
        const from = `${String.fromCharCode(97 + move.from.file)}${8 - move.from.rank}`;
        const to = `${String.fromCharCode(97 + move.to.file)}${8 - move.to.rank}`;
        return `${from}${to}`;
    }
}

// Экспортируем новый движок
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessEngine;
}
