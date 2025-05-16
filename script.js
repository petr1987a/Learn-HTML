// script.js

// В САМОЕ НАЧАЛО script.js: функция для отладки ТОЛЬКО в консоль
function debugMessage(msg) {
    // Для объектов и массивов используем JSON.stringify для более читаемого вывода в консоли
    const messageContent = (typeof msg === 'object' && msg !== null) ? JSON.stringify(msg, null, 2) : msg;
    console.log("DEBUG:", msg);
}
// --- КОНЕЦ ФУНКЦИИ DEBUGMESSAGE ---

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
let selectedSquare = null; // { row, col, piece }
let currentPlayer = 'w'; // 'w' - белые, 'b' - черные
const boardSize = 8;

// Состояния для специальных ходов и статуса игры
let whiteKingMoved = false;
let blackKingMoved = false;
let whiteRookKingsideMoved = false; // h1
let whiteRookQueensideMoved = false; // a1
let blackRookKingsideMoved = false; // h8
let blackRookQueensideMoved = false; // a8
let enPassantTargetSquare = null; // { row, col }
let gameStatus = "ongoing"; // "ongoing", "checkmate", "stalemate"

const boardElement = document.getElementById('chessBoard');
const messageElement = document.getElementById('message');
const currentPlayerElement = document.getElementById('currentPlayer');
const resetButton = document.getElementById('resetButton');

let botThinkingPhrases = []; // Массив для хранения "мыслей бота"

// --- ИНИЦИАЛИЗАЦИЯ ФРАЗ ДЛЯ БОТА ---
function initializeBotPhrases() {
    if (typeof PoeticPhrasesSource !== 'undefined' && typeof PoeticPhrasesSource.getPhrases === 'function') {
        botThinkingPhrases = PoeticPhrasesSource.getPhrases();
        if (botThinkingPhrases.length === 0) {
            debugMessage("WARN: PoeticPhrasesSource.getPhrases() вернул пустой массив.");
            // Можно добавить дефолтные фразы на случай, если что-то пошло не так
            // botThinkingPhrases = ["Бот напряженно думает...", "Анализ позиции...", "Расчет вариантов..."];
        }
    } else {
        debugMessage("ERROR: PoeticPhrasesSource не найден или не содержит метода getPhrases. Мысли бота будут стандартными.");
        // Запасной вариант фраз, если модуль не загрузился
        botThinkingPhrases = ["Бот обдумывает свой ход...", "ИИ в процессе размышлений...", "Пожалуйста, подождите..."];
    }
}

// --- ОБНОВЛЕНИЕ ИНФОРМАЦИОННОЙ ПАНЕЛИ ---
function updateInfoPanel(messageText) {
    if (messageElement) {
        messageElement.textContent = messageText;
        messageElement.style.fontStyle = 'normal'; // Сброс стиля на обычный
        messageElement.style.color = '';           // Сброс цвета на дефолтный
    }
    if (currentPlayerElement) {
        currentPlayerElement.textContent = (currentPlayer === 'w' ? 'Белых' : 'Черных');
    }
}

// --- ОТОБРАЖЕНИЕ "МЫСЛЕЙ БОТА" ---
function showBotThinkingPoetry() {
    if (!messageElement) return;

    if (botThinkingPhrases.length > 0) {
        const randomPhrase = botThinkingPhrases[Math.floor(Math.random() * botThinkingPhrases.length)];
        messageElement.textContent = randomPhrase;
        messageElement.style.fontStyle = 'italic'; // Стиль для мыслей бота
        messageElement.style.color = '#16a085';   // Акцентный цвет для мыслей бота (бирюзовый)
    } else {
        // Если фразы не загрузились, показываем стандартное сообщение
        updateInfoPanel("Бот думает...");
    }
}

// --- ИНИЦИАЛИЗАЦИЯ ДОСКИ ---
function initializeBoard() {
    debugMessage("initializeBoard called");
    currentBoardState = JSON.parse(JSON.stringify(initialBoardSetup));
    selectedSquare = null;
    currentPlayer = 'w';
    whiteKingMoved = false;
    blackKingMoved = false;
    whiteRookKingsideMoved = false;
    whiteRookQueensideMoved = false;
    blackRookKingsideMoved = false;
    blackRookQueensideMoved = false;
    enPassantTargetSquare = null;
    gameStatus = "ongoing";

    renderBoard();
    clearKingInCheckHighlight();
    updateInfoPanel("Игра началась. Ход Белых.");
    
    // PoeticBoardOverlay.activate() больше не нужен и удален
}

// --- РЕНДЕР ДОСКИ ---
function renderBoard() {
    boardElement.innerHTML = '';
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = row;
            square.dataset.col = col;

            const pieceCode = currentBoardState[row][col];
            if (pieceCode) {
                square.textContent = PIECES[pieceCode];
                square.classList.add('piece');
                square.classList.add(pieceCode.startsWith('w') ? 'white' : 'black');
            }

            square.addEventListener('click', () => onSquareClick(row, col));
            boardElement.appendChild(square);
        }
    }
    if (selectedSquare) {
        const domSquare = boardElement.querySelector(`.square[data-row='${selectedSquare.row}'][data-col='${selectedSquare.col}']`);
        if (domSquare) domSquare.classList.add('selected');
    }
    if (gameStatus === "ongoing" && isKingInCheck(currentPlayer, currentBoardState)) {
         highlightKingInCheck(currentPlayer, false);
    } else if (gameStatus === "checkmate") {
        const loser = currentPlayer;
        highlightKingInCheck(loser, true);
    }
}

// --- КЛИК ПО КЛЕТКЕ ---
function onSquareClick(row, col) {
    debugMessage(`onSquareClick: ${row},${col}. Player: ${currentPlayer}. Selected: ${selectedSquare ? selectedSquare.piece : 'null'}`);
    if (gameStatus !== "ongoing") {
        updateInfoPanel("Игра завершена. Начните новую игру, нажав 'Начать заново'.");
        return;
    }

    const pieceCode = currentBoardState[row][col];

    if (selectedSquare) {
        const moveDetails = isValidMove(selectedSquare.row, selectedSquare.col, row, col, currentBoardState);
        if (moveDetails) {
            debugMessage(`Player move valid: ${PIECES[selectedSquare.piece]} to ${row},${col}. Details: ${JSON.stringify(moveDetails)}`);
            movePiece(selectedSquare.row, selectedSquare.col, row, col, moveDetails);
            const prevSelectedPiece = selectedSquare.piece;
            selectedSquare = null;
            clearPossibleMovesHighlight();

            if (gameStatus === "ongoing") {
                switchPlayer();
                debugMessage(`After switchPlayer, currentPlayer is: ${currentPlayer}, gameStatus: ${gameStatus}`);

                const botColor = 'b';
                if (currentPlayer === botColor && gameStatus === "ongoing") {
                    showBotThinkingPoetry(); // <--- ПОЭЗИЯ БОТА ЗДЕСЬ
                    
                    debugMessage(`[Game] Player's ${PIECES[prevSelectedPiece]} turn ended. Bot's turn (${botColor}). Calling makeBotMove.`);
                    setTimeout(() => {
                        debugMessage("[Game] setTimeout: Calling makeBotMove now.");
                        makeBotMove();
                    }, 500); // Задержка для "раздумий"
                }
            }
        } else if (selectedSquare.row === row && selectedSquare.col === col) {
            debugMessage("Player cancelled selection.");
            selectedSquare = null;
            clearPossibleMovesHighlight();
            updateInfoPanel("Выбор отменен. Выберите фигуру для хода.");
            renderBoard();
        } else if (pieceCode && pieceCode.startsWith(currentPlayer)) {
            debugMessage(`Player re-selected piece: ${PIECES[pieceCode]}`);
            clearPossibleMovesHighlight();
            selectedSquare = { row, col, piece: pieceCode };
            highlightPossibleMoves(row, col, pieceCode);
            updateInfoPanel(`Выбрана фигура ${PIECES[pieceCode]}. Куда походить?`);
            renderBoard();
        } else {
            debugMessage("Invalid move attempt by player.");
            updateInfoPanel("Неверный ход. Попробуйте снова.");
            renderBoard();
        }
    } else if (pieceCode && pieceCode.startsWith(currentPlayer)) {
        debugMessage(`Player selected piece: ${PIECES[pieceCode]}`);
        selectedSquare = { row, col, piece: pieceCode };
        highlightPossibleMoves(row, col, pieceCode);
        updateInfoPanel(`Выбрана фигура ${PIECES[pieceCode]}. Куда походить?`);
        renderBoard();
    } else if (pieceCode && !pieceCode.startsWith(currentPlayer)) {
        debugMessage("Not player's turn or selected opponent's piece.");
        updateInfoPanel("Сейчас не ваш ход или выбрана фигура противника!");
    } else {
        debugMessage("Clicked on empty square without prior selection.");
        updateInfoPanel("Пустая клетка. Выберите свою фигуру.");
    }
}

// --- ЛОГИКА ХОДОВ ФИГУР (_getPieceSpecificMoveLogic) ---
// ... (эта функция остается без изменений, она большая, поэтому я ее не дублирую здесь) ...
// Убедись, что она у тебя есть и корректна.
function _getPieceSpecificMoveLogic(startRow, startCol, endRow, endCol, pieceCode, boardState, forAttackCheck = false) {
    const targetPieceOnEndSquare = boardState[endRow][endCol];
    if (!pieceCode) return false;
    if (startRow === endRow && startCol === endCol) return false;
    if (!forAttackCheck && targetPieceOnEndSquare && targetPieceOnEndSquare.startsWith(pieceCode[0])) return false;

    const pieceType = pieceCode.substring(1);
    const pieceColor = pieceCode[0];

    switch (pieceType) {
        case 'P':
            const direction = (pieceColor === 'w') ? -1 : 1;
            const initialRow = (pieceColor === 'w') ? 6 : 1;
            if (endCol === startCol) {
                if (!targetPieceOnEndSquare) {
                    if (endRow === startRow + direction) return { type: 'normal' };
                    if (startRow === initialRow && endRow === startRow + 2 * direction && !boardState[startRow + direction][startCol]) return { type: 'pawn_two_step' };
                }
            } else if (Math.abs(endCol - startCol) === 1 && endRow === startRow + direction) {
                if (forAttackCheck) return { type: 'capture_or_attack' };
                if (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) return { type: 'capture' };
                if (enPassantTargetSquare && endRow === enPassantTargetSquare.row && endCol === enPassantTargetSquare.col && !targetPieceOnEndSquare) return { type: 'en_passant' };
            }
            return false;
        case 'R':
            if (startRow !== endRow && startCol !== endCol) return false;
            if (startRow === endRow) {
                const step = (endCol > startCol) ? 1 : -1;
                for (let c = startCol + step; c !== endCol; c += step) { if (boardState[startRow][c]) return false; }
            } else {
                const step = (endRow > startRow) ? 1 : -1;
                for (let r = startRow + step; r !== endRow; r += step) { if (boardState[r][startCol]) return false; }
            }
            return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };
        case 'N':
            const dRowN = Math.abs(endRow - startRow);
            const dColN = Math.abs(endCol - startCol);
            if ((dRowN === 2 && dColN === 1) || (dRowN === 1 && dColN === 2))
                return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };
            return false;
        case 'B':
            if (Math.abs(endRow - startRow) !== Math.abs(endCol - startCol)) return false;
            const dRowB = (endRow > startRow) ? 1 : -1;
            const dColB = (endCol > startCol) ? 1 : -1;
            let rB = startRow + dRowB, cB = startCol + dColB;
            while (rB !== endRow || cB !== endCol) { if (boardState[rB][cB]) return false; rB += dRowB; cB += dColB; }
            return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };
        case 'Q':
            const isRookMove = (startRow === endRow || startCol === endCol);
            const isBishopMove = (Math.abs(endRow - startRow) === Math.abs(endCol - startCol));
            if (!isRookMove && !isBishopMove) return false;
            if (isRookMove) {
                if (startRow === endRow) {
                    const step = (endCol > startCol) ? 1 : -1;
                    for (let c = startCol + step; c !== endCol; c += step) { if (boardState[startRow][c]) return false; }
                } else {
                    const step = (endRow > startRow) ? 1 : -1;
                    for (let r = startRow + step; r !== endRow; r += step) { if (boardState[r][startCol]) return false; }
                }
            } else { // isBishopMove
                const dRowQ = (endRow > startRow) ? 1 : -1;
                const dColQ = (endCol > startCol) ? 1 : -1;
                let rQ = startRow + dRowQ, cQ = startCol + dColQ;
                while (rQ !== endRow || cQ !== endCol) { if (boardState[rQ][cQ]) return false; rQ += dRowQ; cQ += dColQ; }
            }
            return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };
        case 'K':
            const dRowK = Math.abs(endRow - startRow);
            const dColK = Math.abs(endCol - startCol);
            if (dRowK <= 1 && dColK <= 1 && (dRowK > 0 || dColK > 0))
                return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };
            if (!forAttackCheck && dRowK === 0 && dColK === 2) {
                const kingMoved = (pieceColor === 'w') ? whiteKingMoved : blackKingMoved;
                if (kingMoved || isKingInCheck(pieceColor, boardState)) return false;
                const kingSide = endCol > startCol;
                const rookColInitial = kingSide ? 7 : 0;
                const rookExpectedPiece = pieceColor + 'R';
                if (boardState[startRow][rookColInitial] !== rookExpectedPiece) return false;
                const rookMovedFlag = kingSide ?
                    ((pieceColor === 'w') ? whiteRookKingsideMoved : blackRookKingsideMoved) :
                    ((pieceColor === 'w') ? whiteRookQueensideMoved : blackRookQueensideMoved);
                if (rookMovedFlag) return false;
                const pathDir = kingSide ? 1 : -1;
                for (let c = startCol + pathDir; c !== rookColInitial; c += pathDir) {
                    if (boardState[startRow][c]) return false;
                }
                const opponentColor = (pieceColor === 'w') ? 'b' : 'w';
                if (isSquareAttacked(startRow, startCol + pathDir, opponentColor, boardState)) return false;
                if (isSquareAttacked(startRow, startCol + 2 * pathDir, opponentColor, boardState)) return false;
                return { type: kingSide ? 'castling_kingside' : 'castling_queenside' };
            }
            return false;
        default: return false;
    }
}


// --- ПРОВЕРКА КОРРЕКТНОСТИ ХОДА (isValidMove) ---
// ... (эта функция остается без изменений) ...
// Убедись, что она у тебя есть и корректна.
function isValidMove(startRow, startCol, endRow, endCol, boardStateToTest) {
    debugMessage(`isValidMove: from ${startRow},${startCol} to ${endRow},${endCol} on board (first row): ${JSON.stringify(boardStateToTest[0])}`);
    const pieceCode = boardStateToTest[startRow][startCol];
    if (!pieceCode) {
        debugMessage("isValidMove returning false: no piece on start square.");
        return false;
    }
    const pieceColor = pieceCode[0];
    const moveDetails = _getPieceSpecificMoveLogic(startRow, startCol, endRow, endCol, pieceCode, boardStateToTest);
    if (!moveDetails) {
        debugMessage("isValidMove returning false: _getPieceSpecificMoveLogic returned false.");
        return false;
    }
    const tempBoardState = JSON.parse(JSON.stringify(boardStateToTest));
    const pieceToMove = tempBoardState[startRow][startCol];
    if (moveDetails.type === 'en_passant') {
        const capturedPawnRow = startRow;
        const capturedPawnCol = endCol;
        tempBoardState[capturedPawnRow][capturedPawnCol] = '';
    } else if (moveDetails.type === 'castling_kingside') {
        tempBoardState[startRow][startCol + 1] = tempBoardState[startRow][7];
        tempBoardState[startRow][7] = '';
    } else if (moveDetails.type === 'castling_queenside') {
        tempBoardState[startRow][startCol - 1] = tempBoardState[startRow][0];
        tempBoardState[startRow][0] = '';
    }
    tempBoardState[endRow][endCol] = pieceToMove;
    tempBoardState[startRow][startCol] = '';
    if (isKingInCheck(pieceColor, tempBoardState)) {
        debugMessage(`isValidMove returning false: King ${pieceColor} would be in check.`);
        return false;
    }
    debugMessage(`isValidMove returning: ${JSON.stringify(moveDetails)}`);
    return moveDetails;
}

// --- ПРОВЕРКА, АТАКОВАНА ЛИ КЛЕТКА (isSquareAttacked) ---
// ... (эта функция остается без изменений) ...
// Убедись, что она у тебя есть и корректна.
function isSquareAttacked(targetRow, targetCol, attackerColor, boardState) {
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            const pieceCode = boardState[r][c];
            if (pieceCode && pieceCode.startsWith(attackerColor)) {
                if (_getPieceSpecificMoveLogic(r, c, targetRow, targetCol, pieceCode, boardState, true)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// --- ПРОВЕРКА, НАХОДИТСЯ ЛИ КОРОЛЬ ПОД ШАХОМ (isKingInCheck) ---
// ... (эта функция остается без изменений) ...
// Убедись, что она у тебя есть и корректна.
function isKingInCheck(kingColor, boardState) {
    let kingRow, kingCol;
    const kingPieceCode = kingColor + 'K';
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (boardState[r][c] === kingPieceCode) {
                kingRow = r;
                kingCol = c;
                break;
            }
        }
        if (kingRow !== undefined) break;
    }
    if (kingRow === undefined) {
        debugMessage(`ERROR: King ${kingPieceCode} not found on board in isKingInCheck!`);
        return true; 
    }
    const attackerColor = (kingColor === 'w') ? 'b' : 'w';
    return isSquareAttacked(kingRow, kingCol, attackerColor, boardState);
}

// --- ПОЛУЧЕНИЕ ВСЕХ ЛЕГАЛЬНЫХ ХОДОВ (getAllLegalMoves) ---
// ... (эта функция остается без изменений) ...
// Убедись, что она у тебя есть и корректна.
function getAllLegalMoves(playerColor, board) {
    debugMessage(`getAllLegalMoves called for: ${playerColor}.`);
    const legalMoves = [];
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            const piece = board[r][c];
            if (piece && piece.startsWith(playerColor)) {
                for (let tr = 0; tr < boardSize; tr++) {
                    for (let tc = 0; tc < boardSize; tc++) {
                        const moveDetails = isValidMove(r, c, tr, tc, board);
                        if (moveDetails) {
                            legalMoves.push({ from: { r, c }, to: { tr, tc }, pieceCode: piece, details: moveDetails });
                        }
                    }
                }
            }
        }
    }
    debugMessage(`getAllLegalMoves for ${playerColor} found: ${legalMoves.length} moves.`);
    return legalMoves;
}

// --- ПОДСВЕТКА ВОЗМОЖНЫХ ХОДОВ (ЗАГЛУШКА) ---
function highlightPossibleMoves(row, col, pieceCode) {
    // debugMessage(`TODO: highlight moves for ${PIECES[pieceCode]}`);
}

// --- ОЧИСТКА ПОДСВЕТКИ ВОЗМОЖНЫХ ХОДОВ (ЗАГЛУШКА) ---
function clearPossibleMovesHighlight() {
    document.querySelectorAll('.possible-move').forEach(sq => sq.classList.remove('possible-move'));
}

// --- ПОДСВЕТКА КОРОЛЯ ПОД ШАХОМ/МАТОМ ---
function highlightKingInCheck(kingColor, isMate) {
    let kingRow, kingCol;
    const kingPieceCode = kingColor + 'K';
    for (let r = 0; r < boardSize; r++) { for (let c = 0; c < boardSize; c++) { if (currentBoardState[r][c] === kingPieceCode) { kingRow = r; kingCol = c; break; } } if (kingRow !== undefined) break; }

    if (kingRow !== undefined && kingCol !== undefined) {
        const kingSquare = boardElement.querySelector(`.square[data-row='${kingRow}'][data-col='${kingCol}']`);
        if (kingSquare) {
            kingSquare.classList.add(isMate ? 'checkmate' : 'check');
            debugMessage(`King ${kingColor} is in ${isMate ? 'CHECKMATE' : 'CHECK'} on currentBoard`);
        }
    } else {
        debugMessage(`ERROR: Could not find king ${kingColor} to highlight on currentBoard.`);
    }
}

// --- ОЧИСТКА ПОДСВЕТКИ ШАХА/МАТА ---
function clearKingInCheckHighlight() {
    document.querySelectorAll('.check, .checkmate').forEach(sq => { sq.classList.remove('check'); sq.classList.remove('checkmate'); });
}

// --- ПЕРЕМЕЩЕНИЕ ФИГУРЫ (movePiece) ---
// ... (эта функция остается без изменений, но убедись, что вызовы debugMessage в ней не мешают) ...
// Убедись, что она у тебя есть и корректна.
function movePiece(startRow, startCol, endRow, endCol, moveDetails) {
    const piece = currentBoardState[startRow][startCol];
    debugMessage(`movePiece: ${PIECES[piece]} from ${startRow},${startCol} to ${endRow},${endCol}. Details: ${JSON.stringify(moveDetails)}`);

    const pieceColor = piece[0];
    const pieceType = piece.substring(1);
    enPassantTargetSquare = null;

    if (pieceType === 'K') {
        if (pieceColor === 'w') whiteKingMoved = true;
        else blackKingMoved = true;
    } else if (pieceType === 'R') {
        if (pieceColor === 'w') {
            if (startRow === 7 && startCol === 0) whiteRookQueensideMoved = true;
            if (startRow === 7 && startCol === 7) whiteRookKingsideMoved = true;
        } else {
            if (startRow === 0 && startCol === 0) blackRookQueensideMoved = true;
            if (startRow === 0 && startCol === 7) blackRookKingsideMoved = true;
        }
    }

    if (moveDetails.type === 'en_passant') {
        currentBoardState[startRow][endCol] = '';
        debugMessage(`En passant: removed pawn at ${startRow},${endCol}`);
    } else if (moveDetails.type === 'castling_kingside') {
        currentBoardState[startRow][startCol + 1] = currentBoardState[startRow][7];
        currentBoardState[startRow][7] = '';
        debugMessage("Kingside castling performed.");
    } else if (moveDetails.type === 'castling_queenside') {
        currentBoardState[startRow][startCol - 1] = currentBoardState[startRow][0];
        currentBoardState[startRow][0] = '';
        debugMessage("Queenside castling performed.");
    }

    currentBoardState[endRow][endCol] = piece;
    currentBoardState[startRow][startCol] = '';

    if (pieceType === 'P') {
        const promotionRank = (pieceColor === 'w') ? 0 : 7;
        if (endRow === promotionRank) {
            let promotedPieceType = 'Q';
            const botColor = 'b';
            if (pieceColor !== botColor) {
                const promotedPieceInput = prompt(`Пешка достигла последней горизонтали! В какую фигуру превратить? (Q, R, B, N)`, 'Q');
                if (promotedPieceInput) {
                     const upperInput = promotedPieceInput.toUpperCase();
                     if (['Q', 'R', 'B', 'N'].includes(upperInput)) {
                        promotedPieceType = upperInput;
                     } else {
                        alert(`Некорректный выбор. Пешка превращена в Ферзя.`);
                     }
                }
            }
            currentBoardState[endRow][endCol] = pieceColor + promotedPieceType;
            debugMessage(`Pawn promoted to ${PIECES[currentBoardState[endRow][endCol]]} for ${pieceColor}`);
        }
    }

    if (moveDetails.type === 'pawn_two_step') {
        enPassantTargetSquare = { row: (startRow + endRow) / 2, col: startCol };
        debugMessage(`En passant target set at: ${JSON.stringify(enPassantTargetSquare)}`);
    }
}

// --- СМЕНА ИГРОКА ---
function switchPlayer() {
    currentPlayer = (currentPlayer === 'w') ? 'b' : 'w';
    debugMessage(`switchPlayer: New current player is ${currentPlayer}`);
    updateInfoPanel(`Ход ${currentPlayer === 'w' ? 'Белых' : 'Черных'}.`); // Сначала общее сообщение
    checkGameStatus(); // Затем проверка статуса, которая может обновить сообщение (шах, мат)
}

// --- ПРОВЕРКА СТАТУСА ИГРЫ ---
function checkGameStatus() {
    debugMessage(`checkGameStatus for player ${currentPlayer} on currentBoard`);
    const legalMovesForCurrentPlayer = getAllLegalMoves(currentPlayer, currentBoardState);
    const kingIsCurrentlyInCheck = isKingInCheck(currentPlayer, currentBoardState);

    clearKingInCheckHighlight();

    if (legalMovesForCurrentPlayer.length === 0) {
        if (kingIsCurrentlyInCheck) {
            gameStatus = "checkmate";
            highlightKingInCheck(currentPlayer, true);
            const winner = (currentPlayer === 'w') ? 'Черные' : 'Белые';
            updateInfoPanel(`МАТ! ${winner} выиграли. Нажмите 'Начать заново'.`);
        } else {
            gameStatus = "stalemate";
            updateInfoPanel(`ПАТ! Ничья. Нажмите 'Начать заново'.`);
        }
        debugMessage(`Game over: ${gameStatus}. Player ${currentPlayer} has no legal moves.`);
    } else if (kingIsCurrentlyInCheck) {
        highlightKingInCheck(currentPlayer, false);
        updateInfoPanel(`ШАХ ${currentPlayer === 'w' ? 'Белым' : 'Черным'}! Ваш ход.`);
    }
    // Если не мат/пат и не шах, сообщение уже установлено в switchPlayer
    renderBoard();
}

// --- ХОД БОТА ---
function makeBotMove() {
    debugMessage("[Game] makeBotMove function CALLED.");
    const botColor = 'b';

    if (currentPlayer !== botColor || gameStatus !== "ongoing") {
        debugMessage(`[AI] makeBotMove: Not bot's turn or game over. Current: ${currentPlayer}, Status: ${gameStatus}. Aborting.`);
        return;
    }

    const boardForAI = JSON.parse(JSON.stringify(currentBoardState));
    const moveData = ChessAI.getRandomMove(
        boardForAI,
        botColor,
        getAllLegalMoves,
        isValidMove
    );

    if (moveData && moveData.pieceCode) {
        debugMessage(`[AI] Got move from AI: ${PIECES[moveData.pieceCode]} from ${moveData.startRow},${moveData.startCol} to ${moveData.endRow},${moveData.endCol}. Details: ${JSON.stringify(moveData.moveDetails)}`);
        movePiece(moveData.startRow, moveData.startCol, moveData.endRow, moveData.endCol, moveData.moveDetails);
        switchPlayer();
    } else {
        debugMessage("[AI] AI's getRandomMove returned null or invalid data. Game status: " + gameStatus);
        if (gameStatus === "ongoing") {
            debugMessage("[AI-ERROR] AI returned no move, but game is ongoing. Problem with legal move generation or AI logic.");
            updateInfoPanel("Ошибка ИИ: не удалось сделать ход. Попробуйте начать заново.");
        }
    }
}

// --- НАЧАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ ИГРЫ И ОБРАБОТЧИКИ ---
if (resetButton) {
    resetButton.addEventListener('click', initializeBoard);
} else {
    console.error("Кнопка сброса #resetButton не найдена!");
    // debugMessage("ERROR: resetButton not found!"); // Можно убрать, т.к. console.error уже есть
}

document.addEventListener('DOMContentLoaded', () => {
    debugMessage("DOM fully loaded. Initializing phrases and board...");
    initializeBotPhrases(); // Инициализируем фразы для бота
    initializeBoard();    // Инициализируем доску
});
