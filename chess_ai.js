const ChessAI = {
    // ВРЕМЕННАЯ ОТЛАДОЧНАЯ ВЕРСИЯ getRandomMove
    getRandomMove: function(boardStateFromGame, playerColor, getAllLegalMovesFunc, isValidMoveFunc) {
        // boardStateFromGame - это копия currentBoardState на момент вызова.
        // getAllLegalMovesFunc и isValidMoveFunc - это функции из script.js,
        // которые теперь корректно принимают и используют состояние доски.

        // В этой простой версии AI, мы будем генерировать ходы на основе boardStateFromGame.
        console.log("[AI-DEBUG] getRandomMove called for player:", playerColor);
        debugMessage(`[AI] getRandomMove: player ${playerColor}, board (first row): ${JSON.stringify(boardStateFromGame[0])}`);


        // getAllLegalMovesFunc будет использовать переданный boardStateFromGame
        const legalMoves = getAllLegalMovesFunc(playerColor, boardStateFromGame);
        console.log("[AI-DEBUG] Legal moves found by getAllLegalMovesFunc:", legalMoves);
        debugMessage(`[AI] Legal moves from getAllLegalMovesFunc: ${JSON.stringify(legalMoves)}`);


        if (!legalMoves || legalMoves.length === 0) {
            console.error("[AI-DEBUG] No legal moves returned by getAllLegalMovesFunc.");
            debugMessage("[AI-ERROR] No legal moves returned by getAllLegalMovesFunc for AI.");
            return null;
        }

        const randomMoveData = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        console.log("[AI-DEBUG] Selected random move data:", randomMoveData);
        debugMessage(`[AI] Selected random move data: ${JSON.stringify(randomMoveData)}`);

        // randomMoveData уже должен содержать все необходимые данные, включая pieceCode и details (moveDetails)
        // из getAllLegalMoves. Дополнительная проверка через isValidMoveFunc здесь уже не так критична,
        // если getAllLegalMoves отработала правильно.
        // Но для "чистоты" и если бы мы хотели передать другую доску, это могло бы быть нужно.
        // Пока что, мы доверяем, что randomMoveData.details - это корректные moveDetails.

        // pieceCode должен быть частью randomMoveData, если getAllLegalMoves его добавила.
        // const pieceCode = boardStateFromGame[randomMoveData.from.r][randomMoveData.from.c]; // Можно взять так, если не из randomMoveData

        // ВАЖНО: randomMoveData теперь должен содержать pieceCode и details
        if (!randomMoveData.pieceCode || !randomMoveData.details) {
            console.error("[AI-DEBUG] Error - randomMoveData is incomplete (missing pieceCode or details).", randomMoveData);
            debugMessage("[AI-ERROR] randomMoveData from getAllLegalMoves is incomplete.");
            return null;
        }
        
        return {
            startRow: randomMoveData.from.r,
            startCol: randomMoveData.from.c,
            endRow: randomMoveData.to.tr,
            endCol: randomMoveData.to.tc,
            pieceCode: randomMoveData.pieceCode, // Берем из данных легального хода
            moveDetails: randomMoveData.details  // Берем из данных легального хода
        };
    }
};
