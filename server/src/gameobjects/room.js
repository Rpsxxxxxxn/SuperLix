const Config = require("../commons/config");
const Timer = require("../commons/utils/timer");
const Utility = require("../commons/utils/utility");
const FloodFill = require("../commons/utils/floodFill");

class Room {
    constructor(gamecore, type, teamCount) {
        this.gamecore = gamecore;
        this.gameType = type;
        this.teamCount = teamCount;
        this.players = [];
        this.teams = [];
        this.colors = [];
        this.colorPaintCount = [];
        this.floodFill = new FloodFill();
        this.timer = new Timer(Config.Server_Interval);
        this.gameStep = Config.GameStep_Waiting; // NoActive 0 -> CountDown 1 -> Game 2 -> Result 3
        this.countDown = Config.Room_Countdown;
        this.gameTimer = Config.Game_FinishTime;
        this.updateField = [];

        this.teamDivideCount = 0;
    }

    create() {
        // 本体
        this.field = new Array(Config.Game_FieldSize);
        for (let y = 0; y < Config.Game_FieldSize; y++) {
            this.field[y] = new Array(Config.Game_FieldSize);
        }

        // 送信用に比較するため
        this.oldfield = new Array(Config.Game_FieldSize);
        for (let y = 0; y < Config.Game_FieldSize; y++) {
            this.oldfield[y] = new Array(Config.Game_FieldSize);
        }

        // チームベースを代入
        for (let i = 0; i < this.teamCount; i++) {
            this.teams.push(i);
            this.colors.push(Utility.getRandomColor());
            this.colorPaintCount.push(0);
        }
    }

    initialize() {
        for (let y = 0; y < Config.Game_FieldSize; y++) {
            for (let x = 0; x < Config.Game_FieldSize; x++) {
                this.field[y][x] = Config.Field_None;
            }
        }
        this.gameStep = Config.GameStep_Waiting;
        this.countDown = Config.Room_Countdown;
        this.gameTimer = Config.Game_FinishTime;
        for (let i = 0; i < this.teamCount; i++) {
            this.colorPaintCount[i] = 0;
        }
    }

    gameloop(dt) {
        switch (this.gameStep) {
            case Config.GameStep_CountDown:
                this.startup(dt);
                break;
            case Config.GameStep_Active:
                this.activeGame(dt);
                break;
            case Config.GameStep_Result:
                this.result();
                this.kickPlayer();
                this.initialize();
                break;
        }
    }

    startup(dt) {
        // ゲーム前カウントダウン
        if (this.timer.getTiming(dt)) {
            this.countDown--;
            // カウントダウンを送る
            this.players.forEach((player) => {
                player.emitGameCountDownTime(this.countDown);
            })
            if (this.countDown <= 0) {
                this.gameStep = Config.GameStep_Active;
            }
        }
    }

    activeGame(dt) {
        // ゲーム中
        if (this.gameTimer > 0) {
            this.updateField.length = 0;
            // ゲーム時間の計測 (引いていく)
            if (this.timer.getTiming(dt)) {

                this.gameTimer--;
                this.players.forEach((player) => {
                    player.emitGameCountDownTime(this.gameTimer, this.teamCount, this.colorPaintCount);
                })
            }
            
            for (let color = 0; color < this.teamCount; color++) {
                this.colorPaintCount[color] = 0;
            }
            // チェックした場所を初期化
            for (let y = 0; y < Config.Game_FieldSize; y++) {
                for (let x = 0; x < Config.Game_FieldSize; x++) {
                    if (this.field[y][x] === Config.Field_Check) {
                        this.field[y][x] = Config.Field_None;
                    }
                    if (this.field[y][x] !== this.oldfield[y][x]) {
                        const params = {
                            x: x,
                            y: y,
                            color: this.field[y][x]
                        }
                        this.updateField.push(params);
                    }

                    // 色計算
                    for (let color = 0; color < this.teamCount; color++) {
                        if (this.field[y][x] === color) {
                            this.colorPaintCount[color]++;
                        }
                    }
                    // 前データに入れる
                    this.oldfield[y][x] = this.field[y][x];
                }
            }
        
            this.teams.forEach((color) => {
                // チェック処理
                this.floodFill.start(this.field, color);

                // チェックが行ってない範囲を塗る
                for (let y = 0; y < Config.Game_FieldSize; y++) {
                    for (let x = 0; x < Config.Game_FieldSize; x++) {
                        this.checkFieldPaint(x, y, color);
                    }
                }
            })
        
            // プレイヤーの更新
            this.players.forEach((player) => {
                player.update(dt, this.field);
                const mx = player.mapNewPosition.x;
                const my = player.mapNewPosition.y;
                player.fieldPaint(this.field, mx, my);
            });

            // 送信
            this.players.forEach((player) => {
                player.emitUpdateGame(this.players, this.updateField);
            })
        
        } else {
            this.gameStep = Config.GameStep_Result;
        }
    }

    result() {
        for (let color = 0; color < this.teamCount; color++) {
            this.colorPaintCount[color] = 0;
        }
        for (let y = 0; y < Config.Game_FieldSize; y++) {
            for (let x = 0; x < Config.Game_FieldSize; x++) {
                for (let color = 0; color < this.teamCount; color++) {
                    if (this.field[y][x] === color) {
                        this.colorPaintCount[color]++;
                    }
                }
            }
        }

        // プレイヤーへ送信
        this.players.forEach((player) => {
            player.emitGameResult(this.teamCount, this.colorPaintCount);
        })
    }

    emitJoinGame() {
        this.players.forEach((player) => {
            player.isAlive = true;
            player.emitJoinGame(this.players, this.field, this.colors);
        })
    }

    broadCastPacket(buffer) {
        this.players.forEach((player) => {
            player.send(buffer);
        })
    }

    joinPlayer(player) {
        player.setTeam(this.teamDivideCount % this.teamCount);
        player.setRoom(this);
        this.players.push(player);
        this.teamDivideCount++;
    }

    kickPlayer() {
        this.players.forEach((player) => {
            player.isWaitingRoom = false;
            player.emitGameResult();
            player.setRoom(null);
            if (!player.isConnection) {
                this.gamecore.eraseConnectedPlayer(player);
            }
        })
        this.players.length = 0;
    }

    checkFieldPaint(x, y, color) {
        if (this.floodFill.mapField[y][x] !== Config.Field_Check &&
            this.floodFill.mapField[y][x] !== color) {
            this.field[y][x] = color;
            
            this.players.forEach((player) => {
                if (player.team !== color) {
                    const mx = player.mapNewPosition.x;
                    const my = player.mapNewPosition.y;
                    if (x === mx && y === my && player.isAlive) {
                        player.setKiller();
                    }
                }
            });
        }
    }
}

module.exports = Room;