// ChessAI: умный минимакс с простыми шахматными эвристиками (еще сильнее, но быстро)

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
                // Материальная оценка + центр + развитие + продвижение пешек + безопасность короля
                const pieceValues = { 'wK': 0, 'wQ': 9, 'wR': 5, 'wB': 3, 'wN': 3, 'wP': 1, 'bK': 0, 'bQ': -9, 'bR': -5, 'bB': -3, 'bN': -3, 'bP': -1 };
                let total = 0;
                let whiteCenter = 0, blackCenter = 0;
                let whiteMinorDev = 0, blackMinorDev = 0;
                let whitePawn7 = 0, blackPawn2 = 0;
                let whiteKingOnStart = false, blackKingOnStart = false;
                let whiteRookStartFiles = 0, blackRookStartFiles = 0;
                let whiteEarlyQueen = 0, blackEarlyQueen = 0;
                // Центр: d4,e4,d5,e5 (3,3),(3,4),(4,3),(4,4)
                const centerSquares = [[3,3],[3,4],[4,3],[4,4]];
                for (let r = 0; r < boardSize; r++) for (let c = 0; c < boardSize; c++) {
                    const piece = board[r][c];
                    if (!piece) continue;
                    total += pieceValues[piece] || 0;
                    // Контроль центра пешками
                    if (piece === 'wP' && centerSquares.some(([cr,cc])=>cr===r&&cc===c)) whiteCenter++;
                    if (piece === 'bP' && centerSquares.some(([cr,cc])=>cr===r&&cc===c)) blackCenter++;
                    // Развитие легких фигур (кони и слоны не на первой горизонтали)
                    if (piece === 'wN' || piece === 'wB') if (r < 7) whiteMinorDev++;
                    if (piece === 'bN' || piece === 'bB') if (r > 0) blackMinorDev++;
                    // Пешки на 7-й (у белых) и 2-й (у черных)
                    if (piece === 'wP' && r === 1) whitePawn7++;
                    if (piece === 'bP' && r === 6) blackPawn2++;
                    // Ранний выход ферзя
                    if (piece === 'wQ' && r < 6) whiteEarlyQueen++;
                    if (piece === 'bQ' && r > 1) blackEarlyQueen++;
                }
                // Король на исходной
                whiteKingOnStart = board[7][4] === 'wK';
                blackKingOnStart = board[0][4] === 'bK';
                // Ладьи на исходных (для проверки потенциальной рокировки)
                if (board[7][0] === 'wR') whiteRookStartFiles++;
                if (board[7][7] === 'wR') whiteRookStartFiles++;
                if (board[0][0] === 'bR') blackRookStartFiles++;
                if (board[0][7] === 'bR') blackRookStartFiles++;

                // Суммируем бонусы/штрафы
                total += (whiteCenter - blackCenter) * 0.3;
                total += (whiteMinorDev - blackMinorDev) * 0.2;
                total += (whitePawn7 - blackPawn2) * 0.35; // За продвинутую пешку
                total -= (whiteEarlyQueen - blackEarlyQueen) * 0.3; // Наказание за раннего ферзя
                // Безопасность короля: если король и обе ладьи на месте — небольшой штраф (за не рокированного)
                if (whiteKingOnStart && whiteRookStartFiles === 2) total -= 0.3;
                if (blackKingOnStart && blackRookStartFiles === 2) total += 0.3;
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
                // В первую очередь — взятия дорогих фигур
                return moves.slice().sort((a, b) => {
                    const aCaptureValue = a.details && a.details.type === 'capture' ? getPieceValue(a.capturedPiece) : 0;
                    const bCaptureValue = b.details && b.details.type === 'capture' ? getPieceValue(b.capturedPiece) : 0;
                    return bCaptureValue - aCaptureValue;
                });
            }
            const orderedMoves = orderMoves(moves);

            // Динамическая глубина: чуть выше, но не слишком
            let depth = 5;
            if (orderedMoves.length <= 10) depth = 6;
            else if (orderedMoves.length >= 18) depth = 4;
            else if (orderedMoves.length >= 28) depth = 3;
           

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
