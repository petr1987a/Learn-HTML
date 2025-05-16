function evaluateBoard(board, getAllLegalMovesFunc) {
    // Если мат — огромный штраф/бонус
    const botColor = 'b';
    const humanColor = 'w';
    const botMoves = getAllLegalMovesFunc(botColor, board);
    const humanMoves = getAllLegalMovesFunc(humanColor, board);

    if (botMoves.length === 0) {
        // Проверяем, в шаху ли бот
        if (isKingInCheck(botColor, board)) return -10000; // Мат боту
        else return 0; // Пат
    }
    if (humanMoves.length === 0) {
        if (isKingInCheck(humanColor, board)) return 10000; // Мат человеку
        else return 0; // Пат
    }
    // Обычная оценка материала
    const pieceValues = {
        'wK': 0, 'wQ': 9, 'wR': 5, 'wB': 3, 'wN': 3, 'wP': 1,
        'bK': 0, 'bQ': -9, 'bR': -5, 'bB': -3, 'bN': -3, 'bP': -1
    };
    let total = 0;
    for (let row of board) {
        for (let piece of row) {
            if (piece) total += pieceValues[piece] || 0;
        }
    }
    return total;
}

function cloneBoard(board) {
    return board.map(row => row.slice());
}

function makeMove(board, move) {
    const newBoard = cloneBoard(board);
    newBoard[move.to.tr][move.to.tc] = newBoard[move.from.r][move.from.c];
    newBoard[move.from.r][move.from.c] = '';
    return newBoard;
}

function minimax(board, depth, maximizingPlayer, getAllLegalMovesFunc) {
    // maximizingPlayer: true — за человека (w), false — за бота (b)
    const currentColor = maximizingPlayer ? 'w' : 'b';
    const moves = getAllLegalMovesFunc(currentColor, board);

    if (depth === 0 || moves.length === 0) {
        return { value: evaluateBoard(board, getAllLegalMovesFunc) };
    }

    let bestValue = maximizingPlayer ? -Infinity : Infinity;
    let bestMove = null;

    for (let move of moves) {
        const newBoard = makeMove(board, move);
        const evalResult = minimax(newBoard, depth - 1, !maximizingPlayer, getAllLegalMovesFunc);

        if (maximizingPlayer) {
            if (evalResult.value > bestValue) {
                bestValue = evalResult.value;
                bestMove = move;
            }
        } else {
            if (evalResult.value < bestValue) {
                bestValue = evalResult.value;
                bestMove = move;
            }
        }
    }
    return { value: bestValue, move: bestMove };
}

// API для игры
const ChessAI = {
    getSmartMove: function(boardStateFromGame, playerColor, getAllLegalMovesFunc) {
        // Достаточно глубины 3 или 4, если хотите не пропускать мат в 1
        // (для браузера — 3, иначе может тормозить)
        const depth = 3;
        // maximizingPlayer: true если playerColor === 'w', иначе false
        const maximizingPlayer = (playerColor === 'w');
        const result = minimax(boardStateFromGame, depth, maximizingPlayer, getAllLegalMovesFunc);
        return result.move;
    }
};
