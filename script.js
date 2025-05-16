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

function initializeBoard() {
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
    clearKingInCheckHighlight(); // Убрать подсветку шаха/мата с прошлой игры
    updateInfoPanel("Игра началась. Ход Белых.");
    console.log('Доска инициализирована.');
}

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
    // Подсветка шаха/мата после рендера
    if (gameStatus === "ongoing" && isKingInCheck(currentPlayer, currentBoardState)) {
         highlightKingInCheck(currentPlayer, false);
    } else if (gameStatus === "checkmate") {
        const loser = currentPlayer; // Игрок, которому мат
        highlightKingInCheck(loser, true);
    }
}

function onSquareClick(row, col) {
    if (gameStatus !== "ongoing") {
        updateInfoPanel("Игра завершена. Начните новую игру, нажав 'Начать заново'.");
        return;
    }

    const pieceCode = currentBoardState[row][col];

    if (selectedSquare) {
        const moveDetails = isValidMove(selectedSquare.row, selectedSquare.col, row, col);
        if (moveDetails) {
            movePiece(selectedSquare.row, selectedSquare.col, row, col, moveDetails);
            selectedSquare = null;
            clearPossibleMovesHighlight();

            if (gameStatus === "ongoing") { // gameStatus обновляется в checkGameStatus, вызываемом из switchPlayer
                switchPlayer();
            }
            // renderBoard() будет вызван после switchPlayer или если игра закончилась
            // updateInfoPanel() также вызывается из switchPlayer или checkGameStatus
        } else if (selectedSquare.row === row && selectedSquare.col === col) {
            selectedSquare = null;
            clearPossibleMovesHighlight();
            updateInfoPanel("Выбор отменен. Выберите фигуру для хода.");
        } else if (pieceCode && pieceCode.startsWith(currentPlayer)) {
            clearPossibleMovesHighlight();
            selectedSquare = { row, col, piece: pieceCode };
            highlightPossibleMoves(row, col, pieceCode);
            updateInfoPanel(`Выбрана фигура ${PIECES[pieceCode]}. Куда походить?`);
        } else {
            updateInfoPanel("Неверный ход. Попробуйте снова.");
        }
        renderBoard(); // Перерисовать в любом случае, чтобы отразить изменения
    } else if (pieceCode && pieceCode.startsWith(currentPlayer)) {
        selectedSquare = { row, col, piece: pieceCode };
        highlightPossibleMoves(row, col, pieceCode);
        updateInfoPanel(`Выбрана фигура ${PIECES[pieceCode]}. Куда походить?`);
        renderBoard();
    } else if (pieceCode && !pieceCode.startsWith(currentPlayer)) {
        updateInfoPanel("Сейчас не ваш ход!");
    } else {
        updateInfoPanel("Пустая клетка. Выберите свою фигуру.");
    }
}

// --- Логика ходов ---

// _getPieceSpecificMoveLogic: Базовая логика движения фигуры, без проверки "свой король под шахом"
// boardState: состояние доски, на котором проверяется ход (может быть currentBoardState или tempBoardState)
// forAttackCheck: true, если мы просто проверяем, атакует ли фигура клетку (важно для пешек и isSquareAttacked)
function _getPieceSpecificMoveLogic(startRow, startCol, endRow, endCol, pieceCode, boardState, forAttackCheck = false) {
    const targetPieceOnEndSquare = boardState[endRow][endCol];

    if (!pieceCode) return false;
    if (startRow === endRow && startCol === endCol) return false;

    if (!forAttackCheck && targetPieceOnEndSquare && targetPieceOnEndSquare.startsWith(pieceCode[0])) {
        return false; // Нельзя ходить на клетку со своей фигурой (если это не проверка атаки)
    }

    const pieceType = pieceCode.substring(1);
    const pieceColor = pieceCode[0];

    switch (pieceType) {
        case 'P': // Пешка
            const direction = (pieceColor === 'w') ? -1 : 1;
            const initialRow = (pieceColor === 'w') ? 6 : 1;

            if (endCol === startCol) { // Движение вперед
                if (!targetPieceOnEndSquare) { // Клетка должна быть пуста
                    if (endRow === startRow + direction) return { type: 'normal' };
                    if (startRow === initialRow && endRow === startRow + 2 * direction && !boardState[startRow + direction][startCol]) {
                        return { type: 'pawn_two_step' };
                    }
                }
            } else if (Math.abs(endCol - startCol) === 1 && endRow === startRow + direction) { // Диагональный ход
                if (forAttackCheck) return { type: 'capture_or_attack' }; // Для isSquareAttacked
                if (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) {
                    return { type: 'capture' }; // Обычное взятие
                }
                // Взятие на проходе (En Passant)
                if (enPassantTargetSquare && endRow === enPassantTargetSquare.row && endCol === enPassantTargetSquare.col && !targetPieceOnEndSquare) {
                    return { type: 'en_passant' };
                }
            }
            return false;

        case 'R': // Ладья
            if (startRow !== endRow && startCol !== endCol) return false;
            if (startRow === endRow) {
                const step = (endCol > startCol) ? 1 : -1;
                for (let c = startCol + step; c !== endCol; c += step) { if (boardState[startRow][c]) return false; }
            } else {
                const step = (endRow > startRow) ? 1 : -1;
                for (let r = startRow + step; r !== endRow; r += step) { if (boardState[r][startCol]) return false; }
            }
            return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };

        case 'N': // Конь
            const dRowN = Math.abs(endRow - startRow);
            const dColN = Math.abs(endCol - startCol);
            if ((dRowN === 2 && dColN === 1) || (dRowN === 1 && dColN === 2)) {
                return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };
            }
            return false;

        case 'B': // Слон
            if (Math.abs(endRow - startRow) !== Math.abs(endCol - startCol)) return false;
            const dRowB = (endRow > startRow) ? 1 : -1;
            const dColB = (endCol > startCol) ? 1 : -1;
            let rB = startRow + dRowB, cB = startCol + dColB;
            while (rB !== endRow || cB !== endCol) {
                if (boardState[rB][cB]) return false;
                rB += dRowB; cB += dColB;
            }
            return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };

        case 'Q': // Ферзь
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
                while (rQ !== endRow || cQ !== endCol) {
                    if (boardState[rQ][cQ]) return false;
                    rQ += dRowQ; cQ += dColQ;
                }
            }
            return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };

        case 'K': // Король
            const dRowK = Math.abs(endRow - startRow);
            const dColK = Math.abs(endCol - startCol);
            if (dRowK <= 1 && dColK <= 1 && (dRowK > 0 || dColK > 0)) {
                return { type: (targetPieceOnEndSquare && !targetPieceOnEndSquare.startsWith(pieceColor)) ? 'capture' : 'normal' };
            }
            // Рокировка
            if (dRowK === 0 && dColK === 2) { // Попытка рокировки (ход на 2 клетки по горизонтали)
                const kingMoved = (pieceColor === 'w') ? whiteKingMoved : blackKingMoved;
                if (kingMoved || isKingInCheck(pieceColor, boardState)) return false; // Король ходил или под шахом

                const kingSide = endCol > startCol; // true для короткой рокировки
                const rookColInitial = kingSide ? 7 : 0;
                const rookExpectedPiece = pieceColor + 'R';
                
                if (boardState[startRow][rookColInitial] !== rookExpectedPiece) return false;

                const rookMovedFlag = kingSide ?
                    ((pieceColor === 'w') ? whiteRookKingsideMoved : blackRookKingsideMoved) :
                    ((pieceColor === 'w') ? whiteRookQueensideMoved : blackRookQueensideMoved);
                if (rookMovedFlag) return false;

                // Проверка пути между королем и ладьей
                const pathDir = kingSide ? 1 : -1;
                for (let c = startCol + pathDir; c !== rookColInitial; c += pathDir) {
                    if (c === endCol) continue; // клетка, на которую встает король, не должна быть "между"
                    if (boardState[startRow][c]) return false; // Путь занят
                }
                 // Проверка, что поля, через которые проходит король, не атакованы
                const opponentColor = (pieceColor === 'w') ? 'b' : 'w';
                if (isSquareAttacked(startRow, startCol + pathDir, opponentColor, boardState)) return false;
                // isSquareAttacked для startRow, endCol будет проверено в isValidMove через isKingInCheck на tempBoard

                return { type: kingSide ? 'castling_kingside' : 'castling_queenside' };
            }
            return false;
        default:
            return false;
    }
}

function isValidMove(startRow, startCol, endRow, endCol) {
    const pieceCode = currentBoardState[startRow][startCol];
    if (!pieceCode) return false;
    const pieceColor = pieceCode[0];

    const moveDetails = _getPieceSpecificMoveLogic(startRow, startCol, endRow, endCol, pieceCode, currentBoardState);
    if (!moveDetails) return false;

    // Симулируем ход на временной доске
    const tempBoardState = JSON.parse(JSON.stringify(currentBoardState));
    const pieceToMove = tempBoardState[startRow][startCol];

    // Особая обработка для симуляции специальных ходов
    if (moveDetails.type === 'en_passant') {
        const capturedPawnRow = startRow;
        tempBoardState[capturedPawnRow][endCol] = ''; // Убираем взятую пешку
    } else if (moveDetails.type === 'castling_kingside') {
        tempBoardState[startRow][startCol + 1] = tempBoardState[startRow][7]; // Перемещаем ладью
        tempBoardState[startRow][7] = '';
    } else if (moveDetails.type === 'castling_queenside') {
        tempBoardState[startRow][startCol - 1] = tempBoardState[startRow][0]; // Перемещаем ладью
        tempBoardState[startRow][0] = '';
    }

    tempBoardState[endRow][endCol] = pieceToMove;
    tempBoardState[startRow][startCol] = '';

    // Проверяем, не оказался ли свой король под шахом
    if (isKingInCheck(pieceColor, tempBoardState)) {
        return false;
    }
    return moveDetails;
}

// --- Вспомогательные функции для логики ходов ---
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

function isKingInCheck(kingColor, boardState) {
    let kingRow, kingCol;
    const kingPieceCode = kingColor + 'K';
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (boardState[r][c] === kingPieceCode) {
                kingRow = r; kingCol = c; break;
            }
        }
        if (kingRow !== undefined) break;
    }
    if (kingRow === undefined) {
        console.error(`Король цвета ${kingColor} не найден на доске!`);
        return false; // Или true, если это критическая ошибка
    }
    const attackerColor = (kingColor === 'w') ? 'b' : 'w';
    return isSquareAttacked(kingRow, kingCol, attackerColor, boardState);
}

function getAllLegalMoves(playerColor, board) {
    const legalMoves = [];
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            const piece = board[r][c];
            if (piece && piece.startsWith(playerColor)) {
                for (let tr = 0; tr < boardSize; tr++) {
                    for (let tc = 0; tc < boardSize; tc++) {
                        // Важно: isValidMove уже использует currentBoardState.
                        // Для корректной работы с гипотетическими досками,
                        // isValidMove должен принимать boardState как параметр.
                        // Но для текущей задачи (проверка мата/пата на currentBoardState) это ок.
                        if (isValidMove(r, c, tr, tc)) {
                            legalMoves.push({ from: { r, c }, to: { tr, tc } });
                        }
                    }
                }
            }
        }
    }
    return legalMoves;
}

// Вставь ЭТОТ БЛОК в свой script.js, например, после функции getAllLegalMoves
// или перед initializeBoard. Главное, чтобы они были определены ДО того, как их вызовут.

function updateInfoPanel(messageText) {
    if (messageElement) messageElement.textContent = messageText;
    if (currentPlayerElement) currentPlayerElement.textContent = (currentPlayer === 'w' ? 'Белых' : 'Черных');
    console.log(`InfoPanel: ${messageText}, Ход: ${currentPlayerElement ? currentPlayerElement.textContent : (currentPlayer === 'w' ? 'Белых' : 'Черных')}`);
}

function highlightPossibleMoves(row, col, pieceCode) {
    // Это сложная функция. Пока просто выведем в консоль.
    // Тебе нужно будет здесь реализовать логику получения всех валидных ходов для фигуры
    // и добавления класса 'possible-move' к соответствующим клеткам на доске.
    console.log(`Нужно подсветить ходы для ${PIECES[pieceCode]} (${pieceCode}) с клетки ${row},${col}`);
    
    // Примерная логика (НУЖНО ДОРАБОТАТЬ!):
    // clearPossibleMovesHighlight(); // Сначала очищаем старые подсветки
    // const pieceColor = pieceCode[0];
    // for (let tr = 0; tr < boardSize; tr++) {
    //     for (let tc = 0; tc < boardSize; tc++) {
    //         if (isValidMove(row, col, tr, tc)) { // isValidMove должна быть готова к этому
    //             const square = boardElement.querySelector(`.square[data-row='${tr}'][data-col='${tc}']`);
    //             if (square) square.classList.add('possible-move');
    //         }
    //     }
    // }
    // Не забудь перерисовать доску, если selectedSquare подсвечивается отдельно от possible-move.
    // В твоем коде renderBoard() вызывается после onSquareClick, что должно обновить подсветку.
    // Убедись, что в renderBoard() есть логика добавления класса 'selected' и 'possible-move'.
    // Судя по CSS, класс 'possible-move' должен подсвечивать клетки, а 'selected' - выбранную фигуру.
    // В onSquareClick ты вызываешь highlightPossibleMoves, а потом renderBoard.
    // renderBoard должна уметь подсвечивать и selectedSquare, и клетки из possible-move.
    // Возможно, highlightPossibleMoves должна просто собирать массив возможных ходов,
    // а renderBoard уже на основе этого массива и selectedSquare расставлять классы.
}

function clearPossibleMovesHighlight() {
    const previouslySelected = boardElement.querySelector('.selected');
    if (previouslySelected) previouslySelected.classList.remove('selected');
    document.querySelectorAll('.possible-move').forEach(sq => sq.classList.remove('possible-move'));
    // Эта функция должна убирать класс 'possible-move' со всех клеток
    // и, возможно, 'selected' с ранее выбранной.
    // Твой renderBoard() сейчас сам заботится о 'selected', но 'possible-move' - нет.
}

function highlightKingInCheck(kingColor, isMate) {
    let kingRow, kingCol;
    const kingPieceCode = kingColor + 'K';
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (currentBoardState[r][c] === kingPieceCode) {
                kingRow = r; kingCol = c; break;
            }
        }
        if (kingRow !== undefined) break;
    }
    if (kingRow !== undefined && kingCol !== undefined) {
        const kingSquare = boardElement.querySelector(`.square[data-row='${kingRow}'][data-col='${kingCol}']`);
        if (kingSquare) {
            kingSquare.classList.add(isMate ? 'checkmate' : 'check');
            console.log(`Король ${kingColor} ${isMate ? 'ПОД МАТОМ' : 'ПОД ШАХОМ'} на ${kingRow},${kingCol}`);
        }
    } else {
        console.error(`Не удалось найти короля ${kingColor} для подсветки шаха/мата.`);
    }
}

function clearKingInCheckHighlight() {
    document.querySelectorAll('.check, .checkmate').forEach(sq => {
        sq.classList.remove('check');
        sq.classList.remove('checkmate');
    });
}
// --- КОНЕЦ БЛОКА ЗАГЛУШЕК ---

// --- Выполнение хода ---
function movePiece(startRow, startCol, endRow, endCol, moveDetails) {
    const piece = currentBoardState[startRow][startCol];
    const pieceColor = piece[0];
    const pieceType = piece.substring(1);

    // Сброс enPassantTargetSquare перед ходом (если он не был использован)
    // Он будет установлен заново, если это двухшаговый ход пешки
    enPassantTargetSquare = null;

    // Обновление флагов для рокировки
    if (pieceType === 'K') {
        if (pieceColor === 'w') whiteKingMoved = true; else blackKingMoved = true;
    } else if (pieceType === 'R') {
        if (pieceColor === 'w') {
            if (startRow === 7 && startCol === 0) whiteRookQueensideMoved = true;
            if (startRow === 7 && startCol === 7) whiteRookKingsideMoved = true;
        } else {
            if (startRow === 0 && startCol === 0) blackRookQueensideMoved = true;
            if (startRow === 0 && startCol === 7) blackRookKingsideMoved = true;
        }
    }

    // Обработка специальных ходов
    if (moveDetails.type === 'en_passant') {
        const capturedPawnRow = startRow;
        currentBoardState[capturedPawnRow][endCol] = ''; // Убираем взятую пешку
    } else if (moveDetails.type === 'castling_kingside') {
        currentBoardState[startRow][startCol + 1] = currentBoardState[startRow][7]; // Перемещаем ладью
        currentBoardState[startRow][7] = '';
    } else if (moveDetails.type === 'castling_queenside') {
        currentBoardState[startRow][startCol - 1] = currentBoardState[startRow][0]; // Перемещаем ладью
        currentBoardState[startRow][0] = '';
    }

    // Перемещение основной фигуры
    currentBoardState[endRow][endCol] = piece;
    currentBoardState[startRow][startCol] = '';

    // Превращение пешки
    if (pieceType === 'P') {
        const promotionRank = (pieceColor === 'w') ? 0 : 7;
        if (endRow === promotionRank) {
            const promotedPieceInput = prompt(`Пешка достигла последней горизонтали! В какую фигуру превратить? (Q, R, B, N)`, 'Q');
            const promotedPieceType = promotedPieceInput ? promotedPieceInput.toUpperCase() : 'Q';
            let newPieceCode = pieceColor + promotedPieceType;
            if (!PIECES[newPieceCode] || ['K', 'P'].includes(promotedPieceType)) {
                newPieceCode = pieceColor + 'Q';
                alert(`Некорректный выбор. Пешка превращена в Ферзя.`); // Используем alert для простоты
            }
            currentBoardState[endRow][endCol] = newPieceCode;
            // Сообщение обновится в infoPanel после хода
        }
    }

    // Установка цели для взятия на проходе, если это был двухшаговый ход пешки
    if (moveDetails.type === 'pawn_two_step') {
        enPassantTargetSquare = { row: (startRow + endRow) / 2, col: startCol };
    }
}

// --- Управление игрой ---
function switchPlayer() {
    currentPlayer = (currentPlayer === 'w') ? 'b' : 'w';
    updateInfoPanel(`Ход ${currentPlayer === 'w' ? 'Белых' : 'Черных'}.`); // Базовое сообщение
    checkGameStatus(); // Проверяем статус для нового текущего игрока
}

// Найди свою функцию checkGameStatus и ЗАМЕНИ её этой версией:
function checkGameStatus() {
    const legalMoves = getAllLegalMoves(currentPlayer, currentBoardState);
    const kingIsChecked = isKingInCheck(currentPlayer, currentBoardState);

    clearKingInCheckHighlight(); // Убираем старую подсветку

    if (legalMoves.length === 0) {
        if (kingIsChecked) {
            gameStatus = "checkmate";
            highlightKingInCheck(currentPlayer, true); // Подсветить мат
            updateInfoPanel(`МАТ! ${currentPlayer === 'w' ? 'Белые' : 'Черные'} проиграли. Нажмите 'Начать заново'.`);
        } else {
            gameStatus = "stalemate";
            // Нет специальной подсветки для пата в CSS, но можно добавить, если нужно
            updateInfoPanel(`ПАТ! Ничья. Нажмите 'Начать заново'.`);
        }
    } else if (kingIsChecked) {
        highlightKingInCheck(currentPlayer, false); // Подсветить шах
        updateInfoPanel(`ШАХ ${currentPlayer === 'w' ? 'Белым' : 'Черным'}! Ваш ход.`);
    }
    // Если не мат, не пат и не шах, то updateInfoPanel уже вызвана в switchPlayer

    renderBoard(); // Перерисовываем доску, чтобы отразить подсветку шаха/мата
}

// ВСТАВЬ ЭТОТ КОД В САМЫЙ КОНЕЦ ФАЙЛА script.js

// 1. Назначаем обработчик на кнопку "Начать заново"
if (resetButton) { // Проверяем, что кнопка найдена
    resetButton.addEventListener('click', initializeBoard);
} else {
    console.error("Кнопка сброса #resetButton не найдена!");
}

// 2. Инициализируем доску, когда весь HTML загружен и готов (DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM полностью загружен и разобран. Инициализация доски...");
    initializeBoard(); // Вот он, волшебный вызов! ✨
});

// Небольшое замечание по функции highlightPossibleMoves в onSquareClick:
// Сейчас ты вызываешь highlightPossibleMoves, а затем renderBoard().
// renderBoard() в твоей текущей версии не знает о 'possible-move'.
// Тебе нужно будет либо:
//  а) В highlightPossibleMoves прямо добавлять/удалять класс 'possible-move' к клеткам DOM.
//  б) Хранить список возможных ходов в переменной, а renderBoard() будет их отрисовывать.
// Вариант (а) проще для начала. Убедись, что clearPossibleMovesHighlight() также работает с DOM-элементами.
// В моих заглушках я сделала clearPossibleMovesHighlight и highlightKingInCheck работающими с DOM.

// А теперь твоя функция onSquareClick с учетом этого (возможно, понадобится доработка):
// В onSquareClick, когда ты выбираешь фигуру:
// selectedSquare = { row, col, piece: pieceCode };
// clearPossibleMovesHighlight(); // Очистить старые
// highlightPossibleMoves(row, col, pieceCode); // Показать новые (эта функция должна сама модифицировать DOM)
// updateInfoPanel(`Выбрана фигура ${PIECES[pieceCode]}. Куда походить?`);
// renderBoard(); // Перерисовать, чтобы показать 'selected' и, возможно, обновить другие состояния

// Или, если highlightPossibleMoves только возвращает массив ходов:
// let possibleMoves = []; // Глобальная или в области видимости renderBoard
// В onSquareClick:
// selectedSquare = { row, col, piece: pieceCode };
// possibleMoves = getPossibleMovesForPiece(row, col, pieceCode); // Новая функция
// renderBoard(); // renderBoard теперь должна отрисовывать и 'selected' и 'possible-move' из массива possibleMoves

// script.js

// ... (весь остальной код script.js) ...

function makeBotMove() {
    const botColor = 'b'; // Или тот цвет, которым играет бот

    if (currentPlayer !== botColor || gameStatus !== "ongoing") {
        return;
    }

    // --- РЕФАКТОРИНГ ДЛЯ AI ---
    // Для корректной работы AI, который может анализировать гипотетические доски,
    // функции isValidMove и getAllLegalMoves должны принимать boardState и другие нужные параметры.
    // Допустим, мы их модифицировали так:
    // isValidMove(startRow, startCol, endRow, endCol, pieceCode, boardState, enPassantTarget, castlingFlags)
    // getAllLegalMoves(playerColor, boardState, enPassantTarget, castlingFlags)

    // Пока, для простоты, предположим, что ChessAI.getRandomMove может использовать
    // глобальные функции isValidMove и getAllLegalMoves, которые, в свою очередь,
    // используют глобальный currentBoardState. Это не идеально, но для начала сойдет.

    // Передаем текущее состояние и нужные функции в AI
    // Если isValidMove и getAllLegalMoves НЕ были рефакторены для принятия boardState,
    // то ChessAI.getRandomMove должен будет как-то получить доступ к глобальным переменным,
    // что делает его менее "чистым" модулем.
    // Лучше передать функции как параметры:
    const moveData = ChessAI.getRandomMove(
        JSON.parse(JSON.stringify(currentBoardState)), // Передаем копию, чтобы AI не мог случайно изменить оригинал
        botColor,
        getAllLegalMoves, // Передаем саму функцию
        isValidMove       // Передаем саму функцию
        // Если isValidMove и getAllLegalMoves рефакторены, то также передаем:
        // enPassantTargetSquare,
        // { whiteKingMoved, blackKingMoved, ...etc }
    );

    if (moveData) {
        // Сообщение в консоль для отладки
        console.log(`AI (${PIECES[moveData.pieceCode]}) ходит: ${String.fromCharCode(97 + moveData.startCol)}${8 - moveData.startRow} -> ${String.fromCharCode(97 + moveData.endCol)}${8 - moveData.endRow}`);

        movePiece(moveData.startRow, moveData.startCol, moveData.endRow, moveData.endCol, moveData.moveDetails);
        // selectedSquare = null; // Это может быть не нужно, так как ход делает бот
        // clearPossibleMovesHighlight(); // Тоже, вероятно, не нужно после хода бота

        renderBoard(); // Перерисовать доску
        switchPlayer(); // Переключить игрока и проверить статус игры
    } else {
        // Это значит, что getAllLegalMoves вернул пустой массив,
        // и checkGameStatus, вызванный предыдущим switchPlayer, должен был уже определить мат/пат.
        console.log("AI: Нет доступных ходов.");
    }
}

// Вызов makeBotMove остается там же, где мы планировали:
// в onSquareClick после switchPlayer(), если ход перешел к боту.
// Например:
// function onSquareClick(row, col) {
//    // ... ваш код ...
//    if (selectedSquare) {
//        // ... логика хода игрока ...
//        if (moveDetails) {
//            // ...
//            if (gameStatus === "ongoing") {
//                switchPlayer(); // Переключает на бота
//                if (currentPlayer === 'b' && gameStatus === "ongoing") { // 'b' - цвет бота
//                    updateInfoPanel("Бот думает..."); // Сообщение для пользователя
//                    setTimeout(() => {
//                        makeBotMove();
//                    }, 500); // Задержка для "размышлений"
//                }
//            }
//            // ...
//        }
//        // ...
//    }
//    // ...
// }
