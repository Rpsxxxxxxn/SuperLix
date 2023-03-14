const WebSocket = require('ws');
const Config = require("./commons/config");
const Reader = require('./commons/binary/reader');
const Player = require('./gameobjects/player');
const Room = require('./gameobjects/room');
const BotPlayer = require('./gameobjects/bot-player');
const CustomLoop = require('./commons/utils/customLoop');

class GameCore {
    constructor() {
        this.ws = null;
        this.database = null;
        this.counter = 0;
        this.connectedPlayer = [];
        this.waitingPlayer = [];
        this.rooms = [];
    }

    onCreate() {
        this.createWebsocket();
        this.createDatabase();
        this.createUtility();

        setInterval(() => {
            // 待機中のプレイヤーをルームに参加させる
            this.waitingPlayerToJoinRoom();
        }, Config.Server_Interval * 3);
    }

    onLoop(dt) {
        // ゲームループ
        this.rooms.forEach((room) => {
            if (room.gameStep !== Config.GameStep_Waiting) {
                room.gameloop(dt);
            }
        })
    }

    createWebsocket() {
        const wsOptions = {
            port: Config.Server_Port,
            perMessageDeflate: false,
            maxPayload: 4096
        };
        this.ws = new WebSocket.Server(wsOptions);
        this.ws.on("connection", this.onConnection.bind(this));
        this.ws.on("error", this.onError.bind(this));
        console.log(`[StartServer] Port: ${Config.Server_Port}`);
    }

    createDatabase() {
        // this.database = new Database();
        // this.database.onConnect();
        // console.log(this.database.query("SELECT * FROM user"));
        // this.database.onClose();
    }

    createUtility() {
        this.customLoop = new CustomLoop(this.onLoop.bind(this));
        this.customLoop.onCreate();
    }

    onConnection(ws) {
        ws.player = new Player(this, ws, this.getPlayerId());
        ws.player.isConnection = true;
        ws.player.onCreate();
        ws.player.emitPlayerId();
        ws.player.emitServerInfo();
        ws.player.send(ws.player.emitMessage('[SERVER]', 'ようこそSuperLixへ'));

        ws.on("message", (msg) => {
            this.onMessage(msg, ws);
        });
        ws.on("close", (event) => {
            this.onClose(event, ws);
        })

        console.log(`[Player] Id: ${ws.player.id} Connection`);
        this.connectedPlayer.push(ws.player);
    }

    onError(ws) {
        console.log(`[Player] Error`);
    }

    onMessage(msg, ws) {
        if (msg.length > 2048) {
            return;
        }
        ws.player.handler(new Reader(Buffer.from(msg)));
    }

    onClose(event, ws) {
        console.log(`[Player] Id: ${ws.player.id} Disconnection`);
        ws.player.isConnection = false;
        if (ws.player.isWaitingRoom) {
            this.waitingPlayer.splice(this.waitingPlayer.indexOf(ws.player), 1);
        }
    }

    getPlayerId() {
        if (this.counter > 2147483647) {
            this.counter = 1;
        }
        return this.counter += 1;
    }

    joinWaitingPlayer(player) {
        this.waitingPlayer.push(player);
    }

    eraseConnectedPlayer(player) {
        this.connectedPlayer.splice(this.connectedPlayer.indexOf(player), 1);
    }

    waitingPlayerToJoinRoom() {
        if (this.waitingPlayer.length === 0) {
            return;
        }

        if (this.waitingPlayer.length < Config.Game_MaxPlayers) {
            this.waitingPlayer.forEach((player) => {
                player.emitWaitingInfo(this.waitingPlayer.length);
            });
            
            for (let i = 0; i < Config.Game_BotPlayer; i++) {
                const bot = new BotPlayer(this, this.getPlayerId());
                bot.name = `[BOT]${bot.id}`;
                this.waitingPlayer.push(bot);
            }
            return;
        }

        // 初期ルームが無ければ作る
        if (this.rooms.length === 0) {
            this.createRoom();
            return;
        } else {
            // 既存のルームを探す
            for (let i = 0; i < this.rooms.length; i++) {
                const room = this.rooms[i];
                if (room.gameStep !== Config.GameStep_Waiting) {
                    continue;
                }
                for (let p = 0; p < Config.Game_MaxPlayers; p++) {
                    const player = this.waitingPlayer[p];
                    player.initialize();
                    room.joinPlayer(player);
                }
                room.gameStep = Config.GameStep_CountDown;
                room.emitJoinGame();
                this.waitingPlayer = this.waitingPlayer.slice(Config.Game_MaxPlayers, this.waitingPlayer.length);
                return;
            }
        }

        if (this.rooms.length >= Config.Room_Max) {
            return;
        }
        
        // 既存ルームも無ければ作る
        this.createRoom();
    }

    createRoom() {
        const room = new Room(this, Config.Mode_Team, Config.Room_MaxTeam);
        room.create();
        room.initialize();
        this.rooms.push(room);
        
        // 待機中のプレイヤーを参加させる
        for (let i = 0; i < Config.Game_MaxPlayers; i++) {
            const player = this.waitingPlayer[i];
            player.initialize();
            room.joinPlayer(player);
        }
        
        // ゲーム進行度をカウントダウンへ
        room.gameStep = Config.GameStep_CountDown;
        // プレイヤーに
        room.emitJoinGame();
        
        // 待機中の人数を更新する
        this.waitingPlayer = this.waitingPlayer.slice(Config.Game_MaxPlayers, this.waitingPlayer.length);
    }
}

module.exports = GameCore;