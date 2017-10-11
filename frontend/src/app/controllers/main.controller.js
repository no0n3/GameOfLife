'use strict';

(function () {
    angular
        .module('app')
        .controller('MainController', MainController);

    MainController.$inject = ['$scope', '$interval', 'restService', 'AUTHOR'];

    function BoardCells(data) {
        if (!(this instanceof BoardCells)) {
            return new BoardCells();
        }
        data = data || {};
        var mapSize = data.mapSize || BoardCells.DEFAULT_MAP_SIZE;
        var cells = [];

        this.getSelected = function() {
            var selected = [];
            for (var i = 0; i < mapSize; i++) {
                for (var j = 0; j < mapSize; j++) {
                    if (cells[i][j]) {
                        selected.push({ x: j, y: i });
                    }
                }
            }

            return selected;
        };
        this.setSelected = function(selected) {
            for (var i in selected) {
                cells[selected[i].y][selected[i].x] = 1;
            }
        };
        this.clearMap = function() {
            for (var i = 0; i < mapSize; i++) {
                cells[i] = [];
                for (var j = 0; j < mapSize; j++) {
                    cells[i][j] = 0;
                }
            }
        };
        this.markAsAlive = function(x, y, alive) {
            if (0 <= x && x < mapSize && 0 <= y && y < mapSize) {
                cells[y][x] = Boolean(alive) ? 1 : 0;
            }
        };
        this.getCellAt = function(x, y) {
            if (0 <= x && x < mapSize && 0 <= y && y < mapSize) {
                return cells[y][x];
            }

            return 0;
        };
        this.getMapSize = function() {
            return mapSize;
        };
    }
    BoardCells.DEFAULT_MAP_SIZE = 50;

    var scopeRef = null;
    var $intervalRef = null;
    var restServiceRef = null;
    var GAME_STATES = {
        ANY: 0,
        PLAYING: 1,
        PAUSED: 2,
        INIT: 4,
        OVER: 8
    };
    var MAX_ZOOMS = 4;
    var ZOOM_FACTOR = .7;

    var gameStateManager = (function() {
        var gameState = null;
        var stateTransitionCallbacks = [];

        function isValidState(state) {
            return state === GAME_STATES.INIT ||
                state === GAME_STATES.PAUSED ||
                state === GAME_STATES.PLAYING ||
                state === GAME_STATES.OVER;
        }

        function checkGameState(state) {
            return gameState === (state & gameState);
        }

        return {
            setGameState: function(newState) {
                if (!isValidState(newState)) {
                    return;
                }
                for (var i = 0; i < stateTransitionCallbacks.length; ) {
                    var curHandler = stateTransitionCallbacks[i];
                    if ((GAME_STATES.ANY === curHandler.from || checkGameState(curHandler.from)) &&
                        curHandler.to === newState
                    ) {
                        curHandler.callback();
                    }
                    if (curHandler.once) {
                        stateTransitionCallbacks.splice(i, 1);
                    } else {
                        i++;
                    }
                }

                gameState = scopeRef.state = newState;
            },
            registerTransitionHandler: function(callback, from, to, once) {
                if ('function' === typeof callback &&
                    GAME_STATES.ANY === from &&
                    isValidState(to)
                ) {
                    stateTransitionCallbacks.push({
                        callback: callback,
                        from: from,
                        to: to,
                        once: Boolean(once)
                    });
                }
            },
            isValidState: isValidState,
            checkGameState: checkGameState
        };
    })();
    gameStateManager.registerTransitionHandler(function() {
        // reset game transition
        translations = [];
        translatePos = {
            x: null,
            y: null
        };
        scale = 1;
        zooms = 0;

        initMap();
    }, GAME_STATES.ANY, GAME_STATES.INIT);

    var boardCells = new BoardCells();

    var deadColor = '#878484';
    var aliveColor = '#adcc88';

    var canvasSize = null;
    var renderCycleTime = 1000 / 60;

    var canvas = null;
    var ctx = null;

    var squareSpacing = 1;
    var squareSize = 10;

    var zoomMark = false;
    var zooms = 0;

    var gameLoop = null;
    var gofChangeTime = 1000;

    var mouseDown = false;

    var scale = 1;
    var translates = [];
    var translatePos = {
        x: null,
        y: null
    };
    function setSquareAndSpacingSize() {
        var mapSize = boardCells.getMapSize();
        var w = canvasSize - squareSpacing * mapSize;
        squareSize = Math.floor(w / mapSize);
        squareSpacing += w / mapSize - Math.floor(w / mapSize);
    }

    function MainController($scope, $interval, restService, AUTHOR) {
        var c = null;
        $scope.pinch = function(e) {
            if (1.5 <= e.scale) {
                if (e.center) {
                    c = e.center;
                }
                if (4 === e.eventType && MAX_ZOOMS > zooms) {
                    zoomInHandler(e, c);
                }
            }
        };

        scopeRef = $scope;
        $intervalRef = $interval;
        restServiceRef = restService;
        $scope.loading = true;
        $scope.author = AUTHOR;
        $scope.generation = 1;
        $scope.state = GAME_STATES.INIT;
        $scope.GAME_STATES = GAME_STATES;

        restService.getStatus()
            .then(function (data) {
                if (data.data.isInit) {
                    gameStateManager.setGameState(GAME_STATES.PLAYING);
                } else {
                    gameStateManager.setGameState(GAME_STATES.INIT);
                }
                $scope.loading = false;

                init();
            });

        $scope.zoomIn = function (e) {
            if (MAX_ZOOMS <= zooms) {
                return;
            }

            zoomMark = true;
            canvas.style.cursor = 'zoom-in';
        };
        $scope.zoomOut = function () {
            if (0 >= zooms) {
                return;
            }

            var lastTranslate = translates.pop();
            if (0 < translates.length) {
                translatePos = translates[translates.length - 1];
            } else {
                translatePos = {
                    x: null,
                    y: null
                };
            }
            zooms--;
            scale -= ZOOM_FACTOR;
        };
        $scope.toggleState = function () {
            if (gameStateManager.checkGameState(GAME_STATES.PLAYING)) {
                pauseGame();
            } else if (gameStateManager.checkGameState(GAME_STATES.PAUSED)) {
                continueGame();
            }
        };
        $scope.restartGame = function () {
            resetGame();
        };
        $scope.startGame = function () {
            var selected = boardCells.getSelected();
            if (0 === selected.length) {
                alert('Cannot start the game with empty board.')
                return;
            }

            restService.reset(selected)
                .then(function (data) {
                    if (!data.data.success) {
                        return;
                    }

                    continueGame();
                });
        };
    }

    function draw() {
        clearScreen();
        ctx.save();
        ctx.translate(translatePos.x, translatePos.y);
        ctx.scale(scale, scale);
        var mapSize = boardCells.getMapSize();

        for (var y = 0; y < mapSize; y++) {
            for (var x = 0; x < mapSize; x++) {
                fillRect(y, x, boardCells.getCellAt(x, y));
            }
        }
        ctx.restore();
    }

    function fillRect(row, col, alive) {
        col * squareSpacing + col * squareSize
        ctx.fillStyle = alive ? aliveColor : deadColor;

        ctx.fillRect(
            row * squareSpacing + row * squareSize,
            col * squareSpacing + col * squareSize,
            squareSize, squareSize
        );
    }

    function clearScreen() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function getCellPositionByCoordinates(tx, ty) {
        var mapSize = boardCells.getMapSize();
        for (var y = 0; y < mapSize; y++) {
            for (var x = 0; x < mapSize; x++) {
                var wx = x * squareSpacing + x * squareSize;
                var hy = y * squareSpacing + y * squareSize;
                var wxBox = wx + squareSize;
                var hyBox = hy + squareSize;

                if (wx <= tx && hy < ty && tx < wxBox && ty < hyBox) {
                    return { x: y, y: x };
                }
            }
        }

        return null;
    }

    function init() {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        canvasSize = canvas.width;

        canvas.addEventListener('click', function (e) {
            if (zoomMark) {
                zoomInHandler(e);
            }
        });

        canvas.addEventListener('touchstart', handleStart);
        canvas.addEventListener('mousedown', handleStart);
        function handleStart(e) {
            if (gameStateManager.checkGameState(GAME_STATES.INIT)) {
                mouseDown = true;

                var cords = getXYOfEvent(e);
                var x = cords.x, y = cords.y;

                var selectedCell = getCellPositionByCoordinates(x, y);
                if (selectedCell) {
                    boardCells.markAsAlive(selectedCell.x, selectedCell.y, true);
                }
            }
        }

        canvas.addEventListener('mouseup', function (e) {
            mouseDown = false;
        });

        canvas.addEventListener('touchmove', handleMove);
        canvas.addEventListener('mousemove', handleMove);

        function handleMove(e) {
            if (mouseDown && gameStateManager.checkGameState(GAME_STATES.INIT)) {
                var cords = getXYOfEvent(e);
                var x = cords.x, y = cords.y;

                var selectedCell = getCellPositionByCoordinates(x, y);
                if (selectedCell) {
                    boardCells.markAsAlive(selectedCell.x, selectedCell.y, true);
                }
            }
        }

        initGame();
        initGameRenderCycle();
    }

    function zoomInHandler(e, cords) {
        if (gameStateManager.checkGameState(GAME_STATES.PLAYING | GAME_STATES.PAUSED)) {
            canvas.style.cursor = '';
            zoomMark = false;
            if (!cords || !cords.x || !cords.y) {
                cords = getXYOfEvent(e);
            }
            var oldScale = scale;
            zooms++
            scale += ZOOM_FACTOR;
            var x = cords.x, y = cords.y;

            scaleChange = scale - oldScale;
            offsetX = -(x * scaleChange);
            offsetY = -(y * scaleChange);

            var newTranslate = {
                x: translatePos.x + offsetX,
                y: translatePos.y + offsetY
            };
            translates.push(newTranslate);
            translatePos = newTranslate;
        }
    }

    function getXYOfEvent(e) {
        var px = e.pageX;
        var py = e.pageY;
        if (px || py) {
            x = px;
            y = py;
        } else {
            x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        x -= canvas.offsetLeft;
        y -= canvas.offsetTop;

        return { x: x, y: y };
    }

    function initGame() {
        setSquareAndSpacingSize();
        initMap();
    }

    function initMap() {
        boardCells.clearMap();
    }

    function initGameRenderCycle() {
        if (!$intervalRef) {
            return;
        }
        $intervalRef.cancel(gameLoop);

        var lt = new Date().getTime();
        gameLoop = $intervalRef(function() {
            if (gameStateManager.checkGameState(GAME_STATES.PLAYING)) {
                var ct = new Date().getTime();
                if ((ct - lt) >= gofChangeTime) {
                    lt = ct;

                    restServiceRef.getNextGeneration()
                        .then(function (data) {
                            if (false === data.isInit) {
                                resetGame();
                            }
                            if (gameStateManager.checkGameState(GAME_STATES.PAUSED)) {
                                gameStateManager.registerTransitionHandler(
                                    (function(data) {
                                        return function() {
                                            setBoardCellsState(data)
                                        };
                                    })(data.data),
                                    GAME_STATES.PAUSED,
                                    GAME_STATES.PLAYING,
                                    true
                                );
                                return;
                            }

                            setBoardCellsState(data.data)
                        });
                }
            }

            draw();
        }, renderCycleTime);
    }

    function setBoardCellsState(data) {
        initMap();
        for (var i in data.alive) {
            boardCells.markAsAlive(
                data.alive[i].x,
                data.alive[i].y,
                true
            );
        }

        scopeRef.generation = data.generation;
        if (data.gameOver) {
            gameOver();
        }
    }

    function gameOver() {
        gameStateManager.setGameState(GAME_STATES.OVER);
    }

    function pauseGame() {
        gameStateManager.setGameState(GAME_STATES.PAUSED);
    }

    function continueGame() {
        gameStateManager.setGameState(GAME_STATES.PLAYING);
    }

    function resetGame() {
        gameStateManager.setGameState(GAME_STATES.INIT);
    }

})();
