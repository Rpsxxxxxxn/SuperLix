const Config = require("../commons/config");
const Timer = require("../commons/utils/timer");
const Utility = require("../commons/utils/utility");
const Writer = require("../commons/binary/writer");

class Player {
    /**
     * コンストラクタ
     * @param {*} gamecore 
     * @param {*} ws 
     * @param {*} id 
     */
    constructor(gamecore, ws, id) {
        this.gamecore = gamecore;
        this.room = null;
        this.ws = ws;
        this.id = id;
        this.team = -1;
        this.name = '';
        this.position = { x: (Config.Game_FieldSize * Config.Game_FieldChipSize) / 2, y: (Config.Game_FieldSize * Config.Game_FieldChipSize) / 2 };
        this.mapNewPosition = { x: 0, y: 0 }
        this.mapOldPosition = { x: 0, y: 0 }
        this.isConnection = false;
        this.isAlive = false;
        this.isWaitingRoom = false;
        this.paintPoint = 0;

        this.angle = 0;
        this.speed = Config.Player_Speed;
        this.timer = new Timer(Config.Server_Interval);
        // 
        this.respawnTime = Config.Player_RespawnTime;
        this.lastKilled = null;
        this.lastKill = null;
        this.killCount = 0;

        this.router = {
            1: this.receivePlayGame.bind(this),
            2: this.receiveAngle.bind(this),
            3: this.receiveChat.bind(this),
            10: this.receiveSpeedUp.bind(this)
        }
    }

    onCreate() {
    }

    /**
     * 初期化処理
     */
    initialize() {
        this.position = { 
            x: (Config.Game_FieldSize * Config.Game_FieldChipSize) / 2,
            y: (Config.Game_FieldSize * Config.Game_FieldChipSize) / 2
        };
        this.mapNewPosition.x = ~~(this.position.x / Config.Game_FieldChipSize);
        this.mapNewPosition.y = ~~(this.position.y / Config.Game_FieldChipSize);
        this.mapOldPosition.x = this.mapNewPosition.x;
        this.mapOldPosition.y = this.mapNewPosition.y;
        this.paintPoint = 0;
        this.isWaitingRoom = false;
        this.isAlive = false;
        this.lastKilled = null;
        this.lastKill = null;
    }

    /**
     * 更新処理
     */
    update(dt, field) {
        if (this.isAlive) {
            this.position.x += Math.cos(this.angle) * this.speed;
            this.position.y += Math.sin(this.angle) * this.speed;
            this.position.x = Math.max(Math.min(this.position.x, (Config.Game_FieldSize * Config.Game_FieldChipSize) - 1), 0);
            this.position.y = Math.max(Math.min(this.position.y, (Config.Game_FieldSize * Config.Game_FieldChipSize) - 1), 0);

            this.mapNewPosition.x = ~~(this.position.x / Config.Game_FieldChipSize);
            this.mapNewPosition.y = ~~(this.position.y / Config.Game_FieldChipSize);
        } else {
            //if (this.lastKilled) {
            //    this.emitCamera(this.lastKilled.position.x, this.lastKilled.position.y);
            if (this.timer.getTiming(dt)) {
                if (this.respawnTime === 0) {
                    this.respawnTime = Config.Player_RespawnTime;
                    this.isAlive = true;
                    
                    for (let y = 0; y < Config.Game_FieldSize; y++) {
                        for (let x = 0; x < Config.Game_FieldSize; x++) {
                            if (field[y][x] === this.team) {
                                this.position.x = x * Config.Game_FieldChipSize;
                                this.position.y = y * Config.Game_FieldChipSize;
                                this.mapNewPosition.x = ~~(this.position.x / Config.Game_FieldChipSize);
                                this.mapNewPosition.y = ~~(this.position.y / Config.Game_FieldChipSize);
                                return;
                            }
                        }
                    }
                }
                this.respawnTime--;
            }
            //}
        }
    }

    /**
     * 色塗り処理
     * @param {*} field 
     * @param {*} x 
     * @param {*} y 
     */
    fieldPaint(field, x, y) {
        if (field[y][x] !== this.team) {
            field[y][x] = this.team;
            this.paintPoint++;
        }
        
        // 斜めに塗ると、バグなので補正
        const diffX = ~~(this.mapNewPosition.x - this.mapOldPosition.x );
        const diffY = ~~(this.mapNewPosition.y - this.mapOldPosition.y );
        if (Math.abs(diffX) > 0 && Math.abs(diffY) > 0) {
            const fixX = this.mapOldPosition.x + diffX;
            const fixY = this.mapOldPosition.y + diffY;
            field[this.mapOldPosition.y][fixX] = this.team;
            field[fixY][this.mapOldPosition.x] = this.team;
            this.paintPoint += 2;
        }
        this.mapOldPosition.x = this.mapNewPosition.x;
        this.mapOldPosition.y = this.mapNewPosition.y;
    }

    // Receiver ----------------------------------------------------------------------------------
    handler(reader) {
        const type = reader.getUint8();
        this.router[type](reader);
    }

    receivePlayGame(reader) {
        if (!this.isWaitingRoom) {
            const value = reader.getString();
            this.name = Utility.stringSlice(value, 10);

            this.isWaitingRoom = true;
            this.gamecore.joinWaitingPlayer(this);
        }
    }

    receiveSpeedUp(reader) {
        // this.speed = 4.5;
    }

    receiveAngle(reader) {
        this.angle = reader.getFloat();
    }

    receiveChat(reader) {
        const message = reader.getString();
        if (this.room !== null) {
            this.room.broadCastPacket(this.emitMessage(this.name, message));
        }
    }

    // Emitter ---------------------------------------------------------------------------------------
    emitJoinGame(players, field, teamColor) {
        const writer = new Writer();
        writer.setUint8(0);
        // Player
        writer.setUint8(players.length);
        players.forEach(player => {
            writer.setUint32(player.id);
            writer.setUint8(player.team);
            writer.setString(player.name);
            writer.setFloat(player.position.x);
            writer.setFloat(player.position.y);
        })

        // Field
        writer.setUint8(Config.Game_FieldSize);
        for (let y = 0; y < Config.Game_FieldSize; y++) {
            for (let x = 0; x < Config.Game_FieldSize; x++) {
                writer.setUint8(field[y][x]);
            }
        }

        // color
        writer.setUint8(teamColor.length);
        teamColor.forEach((color) => {
            writer.setString(color);
        })

        this.send(writer.toBuffer());
    }

    emitUpdateGame(updatePlayers, updateField) {
        const writer = new Writer();
        writer.setUint8(1);
        // プレイヤーの位置を送信
        writer.setUint8(updatePlayers.length);
        updatePlayers.forEach(player => {
            writer.setUint32(player.id);
            writer.setFloat(player.position.x);
            writer.setFloat(player.position.y);
        })

        // 変更された部分のみを送信
        writer.setUint16(updateField.length);
        updateField.forEach((params) => {
            writer.setUint8(params.x);
            writer.setUint8(params.y);
            writer.setUint8(params.color);
        });
        this.send(writer.toBuffer());
    }

    emitPlayerId() {
        const writer = new Writer();
        writer.setUint8(2);
        writer.setUint32(this.id);
        this.send(writer.toBuffer());
    }

    emitCamera(x, y) {
        const writer = new Writer();
        writer.setUint8(3);
        writer.setUint32(x);
        writer.setUint32(y);
        this.send(writer.toBuffer());
    }

    emitMessage(name, message) {
        const writer = new Writer();
        writer.setUint8(4);
        writer.setString(name);
        writer.setString(message);
        return writer.toBuffer();
    }

    emitGameInfo(timer) {
        const writer = new Writer();
        writer.setUint8(5);
        writer.setUint16(timer);
        this.send(writer.toBuffer());
    }

    emitWaitingInfo(waitingCount) {
        const writer = new Writer();
        writer.setUint8(6);
        writer.setUint8(waitingCount);
        this.send(writer.toBuffer());
    }

    emitGameCountDownTime(time, teamCount, colorPercent) {
        const writer = new Writer();
        writer.setUint8(7);
        writer.setUint16(time);
        writer.setUint8(teamCount);
        for (let i = 0; i < teamCount; i++) {
            writer.setUint16(colorPercent[i]);
        }
        this.send(writer.toBuffer());
    }

    emitGameResult(teamCount, colorPercent) {
        const writer = new Writer();
        writer.setUint8(8);
        writer.setUint8(teamCount);
        for (let i = 0; i < teamCount; i++) {
            writer.setUint16(colorPercent[i]);
        }
        this.send(writer.toBuffer());
    }

    emitServerInfo() {
        const writer = new Writer();
        writer.setUint8(100);
        writer.setString("[Server] Version: 1.0.1");
        writer.setUint16(Config.Game_FieldSize);
        this.send(writer.toBuffer());
    }

    send(packet) {
        if (this.ws === null) {
            return;
        }

        if (this.ws.player.isConnection) {
            this.ws.send(packet, { binary: true });
        }
    }

    setKiller(enemy) {
        if (this.isAlive) {
            this.lastKilled = enemy;
            // enemy.lastKill = this;
            // enemy.killCount++;
            this.isAlive = false;
        }
    }

    setRoom(room) {
        this.room = room;
    }

    setTeam(value) {
        this.team = value;
    }
}

module.exports = Player;