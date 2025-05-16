function evaluateBoard(board) {
    const pieceValues = {
        'wK': 1000, 'wQ': 9, 'wR': 5, 'wB': 3, 'wN': 3, 'wP': 1,
        'bK': -1000, 'bQ': -9, 'bR': -5, 'bB': -3, 'bN': -3, 'bP': -1
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

function findBestMove(board, playerColor, getAllLegalMovesFunc) {
    const moves = getAllLegalMovesFunc(playerColor, board);
    let bestScore = playerColor === 'w' ? -Infinity : Infinity;
    let bestMove = null;

    for (const move of moves) {
        const simulatedBoard = makeMove(board, move);
        const opponent = playerColor === 'w' ? 'b' : 'w';
        const opponentMoves = getAllLegalMovesFunc(opponent, simulatedBoard);

        if (opponentMoves.length === 0) {
            const score = evaluateBoard(simulatedBoard);
            if ((playerColor === 'w' && score > bestScore) ||
                (playerColor === 'b' && score < bestScore)) {
                bestScore = score;
                bestMove = move;
            }
            continue;
        }

        let worstScore = playerColor === 'w' ? Infinity : -Infinity;
        for (const oppMove of opponentMoves) {
            const oppBoard = makeMove(simulatedBoard, oppMove);
            const score = evaluateBoard(oppBoard);
            if (playerColor === 'w') {
                if (score < worstScore) worstScore = score;
            } else {
                if (score > worstScore) worstScore = score;
            }
        }
        if ((playerColor === 'w' && worstScore > bestScore) ||
            (playerColor === 'b' && worstScore < bestScore)) {
            bestScore = worstScore;
            bestMove = move;
        }
    }

    // Логируем результат для отладки
    console.log("AI bestMove:", bestMove);

    // Если нет ни одного хода (пат/мат) — вернуть null
    return bestMove ? {
        from: { r: bestMove.from.r, c: bestMove.from.c },
        to: { tr: bestMove.to.tr, tc: bestMove.to.tc },
        pieceCode: bestMove.pieceCode,
        details: bestMove.details
    } : null;
}

const ChessAI = {
    getSmartMove: function(boardStateFromGame, playerColor, getAllLegalMovesFunc) {
        return findBestMove(boardStateFromGame, playerColor, getAllLegalMovesFunc);
    }
};
