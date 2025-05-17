// chess_rules.js — Модуль для шахматных правил

const ChessRules = (function() {
    /**
     * Проверяет, является ли ход допустимым для заданной фигуры.
     * @param {string} piece Фигура (например, 'wP', 'bK').
     * @param {{rank: number, file: number}} from Координаты исходного положения.
     * @param {{rank: number, file: number}} to Координаты целевого положения.
     * @param {string[][]} board Текущая шахматная доска.
     * @returns {boolean} true, если ход допустим.
     */
    function isValidMove(piece, from, to, board) {
        // Логика для каждой фигуры
        switch (piece[1]) {
            case 'P': return isValidPawnMove(piece, from, to, board);
            case 'R': return isValidRookMove(from, to, board);
            case 'N': return isValidKnightMove(from, to);
            case 'B': return isValidBishopMove(from, to, board);
            case 'Q': return isValidQueenMove(from, to, board);
            case 'K': return isValidKingMove(from, to, board);
            default: return false;
        }
    }

    function isValidPawnMove(piece, from, to, board) {
        // Логика движения пешки
        const direction = piece[0] === 'w' ? -1 : 1;
        const startRank = piece[0] === 'w' ? 6 : 1;

        // Простое движение вперед
        if (to.file === from.file && board[to.rank][to.file] === '') {
            if (to.rank === from.rank + direction) return true;
            if (from.rank === startRank && to.rank === from.rank + 2 * direction) return true;
        }

        // Взятие фигуры
        if (
            Math.abs(to.file - from.file) === 1 &&
            to.rank === from.rank + direction &&
            board[to.rank][to.file] !== '' &&
            board[to.rank][to.file][0] !== piece[0]
        ) return true;

        return false;
    }

    function isValidRookMove(from, to, board) {
        // Логика движения ладьи
        if (from.rank !== to.rank && from.file !== to.file) return false;

        // Проверка препятствий
        if (from.rank === to.rank) {
            const step = from.file < to.file ? 1 : -1;
            for (let file = from.file + step; file !== to.file; file += step) {
                if (board[from.rank][file] !== '') return false;
            }
        } else {
            const step = from.rank < to.rank ? 1 : -1;
            for (let rank = from.rank + step; rank !== to.rank; rank += step) {
                if (board[rank][from.file] !== '') return false;
            }
        }

        return true;
    }

    function isValidKnightMove(from, to) {
        // Логика движения коня
        const dx = Math.abs(from.file - to.file);
        const dy = Math.abs(from.rank - to.rank);
        return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
    }

    function isValidBishopMove(from, to, board) {
        // Логика движения слона
        if (Math.abs(from.file - to.file) !== Math.abs(from.rank - to.rank)) return false;

        // Проверка препятствий
        const stepRank = from.rank < to.rank ? 1 : -1;
        const stepFile = from.file < to.file ? 1 : -1;
        let rank = from.rank + stepRank;
        let file = from.file + stepFile;
        while (rank !== to.rank && file !== to.file) {
            if (board[rank][file] !== '') return false;
            rank += stepRank;
            file += stepFile;
        }

        return true;
    }

    function isValidQueenMove(from, to, board) {
        // Логика движения ферзя (комбинация ладьи и слона)
        return isValidRookMove(from, to, board) || isValidBishopMove(from, to, board);
    }

    function isValidKingMove(from, to, board) {
        // Логика движения короля
        const dx = Math.abs(from.file - to.file);
        const dy = Math.abs(from.rank - to.rank);
        return dx <= 1 && dy <= 1;
    }

    return {
        isValidMove,
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessRules;
}