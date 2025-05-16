// ChessAI with parallel calculation, time-limited processing, and explicit boardSize argument

const ChessAI = {
    getSmartMove: function(boardStateFromGame, playerColor, getAllLegalMovesFunc, isKingInCheckFunc) {
        return new Promise((resolve, reject) => {
            const boardSize = 8;
            const moves = getAllLegalMovesFunc(playerColor, boardStateFromGame, boardSize);

            if (moves.length === 0) {
                console.error("Нет доступных ходов для бота!");
                resolve(null);
                return;
            }

            // --- Worker code as string ---
            const workerCode = `
                onmessage = function(event) {
                    const { board, playerColor, move, depth, getAllLegalMovesStr, isKingInCheckStr, boardSize } = event.data;
                    const getAllLegalMovesFunc = eval('(' + getAllLegalMovesStr + ')');
                    const isKingInCheckFunc = eval('(' + isKingInCheckStr + ')');

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
                            return { value: maximizingPlayer ? -10000 : 10000 };
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

                    const result = minimax(board, depth, -Infinity, Infinity, playerColor === 'w');
                    postMessage({ move, value: result.value });
                };
            `;
            // --- End worker code ---

            const workerBlob = new Blob([workerCode], { type: "application/javascript" });
            const workerURL = URL.createObjectURL(workerBlob);

            // Оборачиваем getAllLegalMoves и isKingInCheck в функции с boardSize!
            function getAllLegalMovesWithSize(playerColor, board, boardSize) {
                return getAllLegalMovesFunc(playerColor, board, boardSize);
            }
            function isKingInCheckWithSize(kingColor, board, boardSize) {
                return isKingInCheckFunc(kingColor, board, boardSize);
            }

            const getAllLegalMovesStr = getAllLegalMovesWithSize.toString();
            const isKingInCheckStr = isKingInCheckWithSize.toString();

            // --- Move ordering ---
            function orderMoves(moves) {
                return moves.slice().sort((a, b) => {
                    const aCaptureValue = a.details && a.details.type === 'capture' ? getPieceValue(a.capturedPiece) : 0;
                    const bCaptureValue = b.details && b.details.type === 'capture' ? getPieceValue(b.capturedPiece) : 0;
                    return bCaptureValue - aCaptureValue;
                });
            }

            function getPieceValue(piece) {
                const pieceValues = { 'wK': 0, 'wQ': 9, 'wR': 5, 'wB': 3, 'wN': 3, 'wP': 1, 'bK': 0, 'bQ': -9, 'bR': -5, 'bB': -3, 'bN': -3, 'bP': -1 };
                return pieceValues[piece] || 0;
            }

            const orderedMoves = orderMoves(moves);

            if (orderedMoves.length === 0) {
                console.error("Сортировка вернула пустой массив!");
                resolve(null);
                return;
            }

            const workerPool = [];
            const maxWorkers = Math.min(4, navigator.hardwareConcurrency || 2);
            for (let i = 0; i < maxWorkers; i++) {
                workerPool.push(new Worker(workerURL));
            }

            let finished = 0;
            const results = [];
            const WORKER_TIMEOUT = 10000;

            workerPool.forEach((worker, index) => {
                if (index < orderedMoves.length) {
                    const timeoutId = setTimeout(() => {
                        console.warn("Worker exceeded time limit and was terminated");
                        worker.terminate();
                        finished++;
                        if (finished === orderedMoves.length && results.length > 0) {
                            resolve(results[0].move);
                        }
                    }, WORKER_TIMEOUT);

                    worker.postMessage({
                        board: boardStateFromGame,
                        playerColor,
                        move: orderedMoves[index],
                        getAllLegalMovesStr,
                        isKingInCheckStr,
                        depth: 2,
                        boardSize // <-- теперь всегда есть в воркере!
                    });

                    worker.onmessage = function(e) {
                        clearTimeout(timeoutId);
                        results.push(e.data);
                        finished++;
                        worker.terminate();

                        if (finished === orderedMoves.length) {
                            results.sort((a, b) => playerColor === 'w' ? b.value - a.value : a.value - b.value);
                            resolve(results[0].move);
                        }
                    };

                    worker.onerror = function(err) {
                        console.error("Ошибка воркера:", err);
                        finished++;
                        worker.terminate();

                        if (finished === orderedMoves.length && results.length > 0) {
                            resolve(results[0].move);
                        }
                    };
                }
            });
        });
    }
};
