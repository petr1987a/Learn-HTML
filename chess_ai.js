// ChessAI: умный минимакс без воркеров, динамическая глубина

const ChessAI = {
    getSmartMove: function(boardStateFromGame, playerColor, getAllLegalMovesFunc, isKingInCheckFunc) {
        return new Promise((resolve) => {
            const boardSize = 8;
            const moves = getAllLegalMovesFunc(playerColor, boardStateFromGame, boardSize);

            if (!moves || moves.length === 0) {
                resolve(null);
                return;
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
            function evaluateBoard(board) {
                const pieceValues = { 'wK': 0, 'wQ': 9, 'wR': 5, 'wB': 3, 'wN': 3, 'wP': 1, 'bK': 0, 'bQ': -9, 'bR': -5, 'bB': -3, 'bN': -3, 'bP': -1 };
                let total = 0;
                for (let r = 0; r < boardSize; r++) for (let c = 0; c < boardSize; c++) {
                    const piece = board[r][c];
                    if (piece) total += pieceValues[piece] || 0;
                }
                return total;
            }
            function minimax(board, depth, alpha, beta, maximizingPlayer) {
                if (depth === 0) {
                    return { value: evaluateBoard(board) };
                }
                const currentColor = maximizingPlayer ? 'w' : 'b';
                const moves = getAllLegalMovesFunc(currentColor, board, boardSize);

                if (moves.length === 0) {
                    if (isKingInCheckFunc(currentColor, board, boardSize)) {
                        return { value: maximizingPlayer ? -10000 : 10000 };
                    } else {
                        return { value: 0 };
                    }
                }

                let bestValue = maximizingPlayer ? -Infinity : Infinity;
                for (const move of moves) {
                    const newBoard = makeMove(board, move);
                    const result = minimax(newBoard, depth - 1, alpha, beta, !maximizingPlayer);
                    if (maximizingPlayer) {
                        bestValue = Math.max(bestValue, result.value);
                        alpha = Math.max(alpha, bestValue);
                    } else {
                        bestValue = Math.min(bestValue, result.value);
                        beta = Math.min(beta, bestValue);
                    }
                    if (beta <= alpha) break;
                }
                return { value: bestValue };
            }

            function getPieceValue(piece) {
                const pieceValues = { 'wK': 0, 'wQ': 9, 'wR': 5, 'wB': 3, 'wN': 3, 'wP': 1, 'bK': 0, 'bQ': -9, 'bR': -5, 'bB': -3, 'bN': -3, 'bP': -1 };
                return pieceValues[piece] || 0;
            }
            function orderMoves(moves) {
                return moves.slice().sort((a, b) => {
                    const aCaptureValue = a.details && a.details.type === 'capture' ? getPieceValue(a.capturedPiece) : 0;
                    const bCaptureValue = b.details && b.details.type === 'capture' ? getPieceValue(b.capturedPiece) : 0;
                    return bCaptureValue - aCaptureValue;
                });
            }
            const orderedMoves = orderMoves(moves);

            // Динамическая глубина: больше ходов - меньше глубина
            let depth = 3;
            if (orderedMoves.length <= 10) depth = 4;
            else if (orderedMoves.length >= 30) depth = 2;

            // Синхронно считаем минимакс для всех ходов
            let bestMove = null;
            let bestValue = playerColor === 'w' ? -Infinity : Infinity;

            for (const move of orderedMoves) {
                const newBoard = makeMove(boardStateFromGame, move);
                const result = minimax(newBoard, depth - 1, -Infinity, Infinity, playerColor !== 'w');
                if (playerColor === 'w') {
                    if (result.value > bestValue) {
                        bestValue = result.value;
                        bestMove = move;
                    }
                } else {
                    if (result.value < bestValue) {
                        bestValue = result.value;
                        bestMove = move;
                    }
                }
            }
            resolve(bestMove);
        });
    }
};
