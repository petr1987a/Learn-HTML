function evaluateBoard(board, getAllLegalMovesFunc) {
    // Материальная стоимость
    const pieceValues = {
        'wK': 0,   'wQ': 9,  'wR': 5,  'wB': 3,  'wN': 3,  'wP': 1,
        'bK': 0,   'bQ': -9, 'bR': -5, 'bB': -3, 'bN': -3, 'bP': -1
    };
    let total = 0;
    let wDevelopment = 0, bDevelopment = 0;
    let wCastled = false, bCastled = false;
    let wPawn7 = 0, bPawn2 = 0;
    let wKingFile = -1, bKingFile = -1;
    let wKingRow = -1, bKingRow = -1;
    let wIsolatedPawns = 0, bIsolatedPawns = 0;
    let wDoubledPawns = 0, bDoubledPawns = 0;
    // Пешечные столбцы для поиска изолированных/двойных
    const wPawnFiles = Array(8).fill(0);
    const bPawnFiles = Array(8).fill(0);

    // Центр: e4,d4,e5,d5 = [3][3],[3][4],[4][3],[4][4]
    const centerSquares = [
        [3, 3], [3, 4], [4, 3], [4, 4]
    ];

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (!piece) continue;
            total += pieceValues[piece] || 0;

            // Контроль центра
            for (const [cr, cc] of centerSquares)
                if (r === cr && c === cc)
                    total += (piece[0] === 'w') ? 0.2 : -0.2;

            // Развитие лёгких фигур
            if (piece === 'wN' || piece === 'wB') {
                if (r < 7) wDevelopment += 0.1; // выведена не на 1-ю горизонталь
            }
            if (piece === 'bN' || piece === 'bB') {
                if (r > 0) bDevelopment -= 0.1;
            }

            // Пешки для анализа двойных/изолированных
            if (piece === 'wP') {
                wPawnFiles[c]++;
                // Пешка на 7-й горизонтали (до превращения)
                if (r === 1) wPawn7 += 0.2;
            }
            if (piece === 'bP') {
                bPawnFiles[c]++;
                // Пешка на 2-й горизонтали (до превращения)
                if (r === 6) bPawn2 -= 0.2;
            }

            // Положение короля
            if (piece === 'wK') {
                wKingFile = c;
                wKingRow = r;
                // Рокировка (король на g1 или c1)
                if ((r === 7 && (c === 6 || c === 2))) wCastled = true;
            }
            if (piece === 'bK') {
                bKingFile = c;
                bKingRow = r;
                if ((r === 0 && (c === 6 || c === 2))) bCastled = true;
            }
        }
    }

    // Двойные и изолированные пешки
    for (let f = 0; f < 8; f++) {
        if (wPawnFiles[f] > 1) wDoubledPawns += wPawnFiles[f] - 1;
        if (bPawnFiles[f] > 1) bDoubledPawns -= (bPawnFiles[f] - 1);
        // Изолированные
        if (wPawnFiles[f] > 0 && wPawnFiles[f-1] === 0 && wPawnFiles[f+1] === 0) wIsolatedPawns++;
        if (bPawnFiles[f] > 0 && bPawnFiles[f-1] === 0 && bPawnFiles[f+1] === 0) bIsolatedPawns--;
    }

    // Штраф за открытого короля (нет пешек перед королём)
    let wKingOpen = 0, bKingOpen = 0;
    if (wKingRow === 7 && wKingFile !== -1) {
        for (let dc = -1; dc <= 1; dc++) {
            const c = wKingFile + dc;
            if (c >= 0 && c < 8 && board[6][c] !== 'wP') wKingOpen -= 0.15;
        }
    }
    if (bKingRow === 0 && bKingFile !== -1) {
        for (let dc = -1; dc <= 1; dc++) {
            const c = bKingFile + dc;
            if (c >= 0 && c < 8 && board[1][c] !== 'bP') bKingOpen += 0.15;
        }
    }

    // Суммируем всё
    total += wDevelopment + bDevelopment;
    total += wCastled ? 0.2 : 0;
    total += bCastled ? -0.2 : 0;
    total += wPawn7 + bPawn2;
    total -= wDoubledPawns * 0.15;
    total -= bDoubledPawns * 0.15;
    total -= wIsolatedPawns * 0.1;
    total -= bIsolatedPawns * 0.1;
    total += wKingOpen + bKingOpen;

    // Мат/пат
    const botColor = 'b';
    const humanColor = 'w';
    const botMoves = getAllLegalMovesFunc(botColor, board);
    const humanMoves = getAllLegalMovesFunc(humanColor, board);

    if (botMoves.length === 0) {
        if (isKingInCheck(botColor, board)) return -10000; // Мат боту
        else return 0; // Пат
    }
    if (humanMoves.length === 0) {
        if (isKingInCheck(humanColor, board)) return 10000; // Мат человеку
        else return 0; // Пат
    }
    return total;
}
