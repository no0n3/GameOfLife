let board = require('../board');

module.exports = {
    reset(req, res) {
        let boardCells = board.getByToken(req.query.token);
        let selectedCells = req.body;
        let data = {};
        if (!(selectedCells instanceof Array) || 0 === selectedCells.length) {
            data.success = false;
        } else {
            boardCells.reset(selectedCells);
            data.success = true;
            data.alive = boardCells.getAlive();
            data.generation = boardCells.getGeneration();
        }

        res.send(JSON.stringify(data));
    },
    nextGeneration(req, res) {
        let boardCells = board.getByToken(req.query.token);
        var data = {};
        if (!boardCells.isInit()) {
            data.init = false;
        } else {
            let nextGen = boardCells.nextGeneration();

            data.init = true;
            data.gameOver = 0 === nextGen.length;
            data.alive = nextGen;
            data.generation = boardCells.getGeneration();
        }

        res.send(JSON.stringify(data));
    },
    checkStatus(req, res) {
        let boardCells = board.getByToken(req.query.token);

        res.send(JSON.stringify({
            isInit: boardCells.isInit()
        }));
    }
};
