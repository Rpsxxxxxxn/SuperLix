/** Constant */
import { Config, MapType } from "./commons/constant";
import { Keyboard, Mouse, Reader, Writer } from "./commons/utility";

/** Component */
import { Camera } from "./components/camera";
import { Player } from "./components/player";

export class GameCore {
    /** コンストラクタ */
    constructor() {
        this.ws = null;
        this.canvas = null;
        this.ctx = null;
        this.camera = null;
        this.myId = -1;
        this.isActive = false;
        this.canvasSize = { width: 0, height: 0 };
        this.players = {};
        this.drawPlayer = [];
        this.drawTail = [];
        this.teamColor = [];

        this.fieldSize = Config.FieldSize;
        this.drawFieldSize = Config.DrawFieldSize;

        this.mapfield = new Array(this.fieldSize);
        this.gameTime = 0;

        this.drawingPaintCount = false;
        this.colorResult = [];
        this.colorResultTotal = 0;

        this.isChatInput = false;

        this.router = {
            0: this.receiveJoinGame.bind(this),
            1: this.receiveUpdateGame.bind(this),
            2: this.receiveMyId.bind(this),
            4: this.receiveMessage.bind(this),
            6: this.receiveWaitingInfo.bind(this),
            7: this.receiveGameCountDownTime.bind(this),
            8: this.receiveGameResult.bind(this),
            100: this.receiveServerInfo.bind(this)
        }
    }

    /** 初期生成処理 */
    create() {
        console.log(`[Client] Version: ${Config.ClientVersion}`);

        this.ws = new WebSocket(Config.ConnectAddress);
        this.ws.binaryType = "arraybuffer";
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onerror = this.onError.bind(this);

        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.camera = new Camera();
        this.keyboard = new Keyboard();
        this.mouse = new Mouse();

        for (let y = 0; y < this.fieldSize; y++) {
            this.mapfield[y] = new Array(this.fieldSize);
        }
        this.initialize();

        // サーバ側へ送る処理
        setInterval(() => {
            if (this.isActive) {
                this.emitAngle();
            }
        }, Config.EmitMouseSpeed);

        const self = this;
        // 参加ボタン
        $('#join').click(function() {
            $("#waitingModal").show();
            $("#overlays").hide();
            const name = $("#name").val();
            self.emitPlayGame(name);
        });

        // 参加後の戻るボタン
        $('#back').click(function() {
            $("#waitingModal").hide();
            $("#overlays").show();
            const name = $("#name").val();
            self.emitPlayGame(name);
        });

        // チャットボックス
        $('#inputBox').keypress(function(e) {
            if(e.which == 13) {
                self.emitChat($('#inputBox').val());
                $('#inputBox').val('');
            }
        })
    }

    /** 初期化処理 */
    initialize() {
        for (let y = 0; y < this.fieldSize; y++) {
            for (let x = 0; x < this.fieldSize; x++) {
                this.mapfield[y][x] = MapType.None;
            }
        }
    }

    /** メインループ */
    mainloop() {
        // 更新処理 ------------------------------------------------------------------------------------
        this.camera.update();
        
        this.canvasSize.width = window.innerWidth;
        this.canvasSize.height = window.innerHeight;
        this.canvas.width = this.canvasSize.width;
        this.canvas.height = this.canvasSize.height;
        
        if (this.isActive && this.players[this.myId]) {
            this.camera.position.x = this.players[this.myId].position.x;
            this.camera.position.y = this.players[this.myId].position.y;
        }
        
        if (this.mouse.getPressed(0)) {
            this.emitSpeedUp();
        }
        
        if (this.keyboard.getKeyPressed(13)) {
            if (!this.isChatInput) {
                $("#inputBox").focus();
                this.isChatInput = true;
            } else {
                $("#inputBox").blur();
                this.isChatInput = false;
            }
        }
        this.keyboard.update();

        // 描画処理 -------------------------------------------------------------------------------------
        this.ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
        this.ctx.save();

        const zoomRange = this.mouse.getZoom() *  (Math.max(this.canvasSize.height / 1080, this.canvasSize.width / 1920));

        // カメラ処理
        this.ctx.translate(this.canvasSize.width / 2, this.canvasSize.height / 2);
        this.ctx.scale(zoomRange, zoomRange);
        this.ctx.translate(-this.camera.position.x, -this.camera.position.y);

        // マップチップ描画 (動作軽減の為カット)
        for (let y = this.camera.mapPosition.y - this.drawFieldSize; y < this.camera.mapPosition.y + this.drawFieldSize; y++) {
            for (let x = this.camera.mapPosition.x - this.drawFieldSize; x < this.camera.mapPosition.x + this.drawFieldSize; x++) {
                if (y < 0 || x < 0 || y >= this.fieldSize || x >= this.fieldSize) {
                    continue;
                }
                const chipData = this.mapfield[y][x];
                switch (chipData) {
                    case MapType.None:
                        this.ctx.fillStyle = '#333';
                        break;
                    case MapType.Check:
                        this.ctx.fillStyle = 'green';
                        break;
                    default:
                        this.ctx.fillStyle = this.teamColor[chipData];
                    break;
                }
                this.ctx.fillRect((x * Config.ChipSize), (y * Config.ChipSize), Config.ChipSize, Config.ChipSize);

                this.ctx.strokeStyle = "#999";
                this.ctx.strokeRect((x * Config.ChipSize), (y * Config.ChipSize), Config.ChipSize, Config.ChipSize);
            }
        }

        // プレイヤー描画
        this.drawPlayer.forEach((player) => {
            const x = this.players[this.myId].position.x;
            const y = this.players[this.myId].position.y;
            if (player.position.x < x + (Config.ChipSize * this.drawFieldSize) &&
                player.position.y < y + (Config.ChipSize * this.drawFieldSize) &&
                player.position.x > x - (Config.ChipSize * this.drawFieldSize) &&
                player.position.y > y - (Config.ChipSize * this.drawFieldSize)) {
                    player.draw(this.ctx, this.teamColor);
                }
        });
        
        this.ctx.restore();

        // LaysUp
        const minute = ~~(this.gameTime / 60);
        const second = ~~(this.gameTime % 60);
        this.ctx.font = "30px 'arial'";
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(`${("0" + minute).slice(-2)}:${("0" + second).slice(-2)}`, this.canvasSize.width / 2, 30);

        if (this.drawingPaintCount) {
            this.ctx.font = "15px 'arial'";
            this.ctx.textAlign = "left";
            for (let i = 0; i < this.colorResult.length; i++) {
                this.ctx.strokeStyle = 'black';
                this.ctx.fillStyle = this.teamColor[i];
                this.ctx.strokeText(`色塗った数: ${this.colorResult[i]}`, 0, 15 * (i+1));
                this.ctx.fillText(`色塗った数: ${this.colorResult[i]}`, 0, 15 * (i+1));
            }

            for (let i = 0, oldPercent = 0; i < this.colorResult.length; ++i) {
                const percent = oldPercent + (this.colorResult[i] / this.colorResultTotal) * Math.PI * 2;
                this.ctx.fillStyle = this.teamColor[i];
                this.ctx.beginPath();
                this.ctx.moveTo(this.canvasSize.width - 70, 70);
                this.ctx.arc(this.canvasSize.width - 70, 70, 60, oldPercent, percent, false);
                this.ctx.fill();
                oldPercent = percent;
            }
        }
        // Callback
        requestAnimationFrame(this.mainloop.bind(this));
    }

    /**
     * 送信処理
     * @param {*} packet 
     * @returns 
     */
    send(packet) {
        if (!this.ws) {
            return;
        }
        if (this.ws.readyState != 1) {
            return;
        }
        if (packet.build) {
            this.ws.send(packet.build());
        } else {
            this.ws.send(packet.buffer);
        }
    }

    /**
     * ソケットの解放
     * @param {*} ws 
     */
    onOpen(ws) {
        console.log("[Server] Connect");
    }

    /**
     * サーバからのメッセージの受信
     * @param {*} message 
     */
    onMessage(message) {
        const reader = new Reader(new DataView(message.data), 0, true);
        const type = reader.getUint8();
        this.router[type](reader);
    }
    
    /**
     * サーバが閉じる
     * @param {*} ws 
     */
    onClose(ws) {
        console.log("[Server] Close");
    }

    /**
     * サーバエラー
     * @param {*} ws 
     */
    onError(ws) {
        console.log("[Server] Error");
    }

    /**
     * サーバ情報の取得
     * @param {*} reader 
     */
    receiveServerInfo(reader) {
        const serverVersion = reader.getString();
        console.log(serverVersion);
        this.fieldSize = reader.getUint16();
    }

    /**
     * ゲームへの参加
     * @param {*} reader 
     */
    receiveJoinGame(reader) {
        $("#waitingModal").hide();
        this.drawFieldSize = Config.DrawFieldSize;
        this.isActive = true;
        // Player
        const players = {};
        const playerCount = reader.getUint8();
        for (let i = 0; i < playerCount; i++) {
            const id = reader.getUint32();
            const team = reader.getUint8();
            const name = reader.getString();
            const x = reader.getFloat();
            const y = reader.getFloat();
            const newPlayer = new Player(id, team, name, x, y);
            players[id] = newPlayer;
            this.drawPlayer.push(newPlayer)
        }
        this.players = players;

        // Field
        const fieldSize = reader.getUint8();
        for (let y = 0; y < fieldSize; y++) {
            for (let x = 0; x < fieldSize; x++) {
                this.mapfield[y][x] = reader.getUint8();
            }
        }

        // TeamColor
        this.teamColor.length = 0;
        const colorCount = reader.getUint8();
        for (let i = 0; i < colorCount; i++) {
            const color = reader.getString();
            this.teamColor.push(color);
        }
    }

    /**
     * ゲーム内更新処理
     * @param {*} reader 
     */
    receiveUpdateGame(reader) {
        // プレイヤーの位置を受信
        const playerCount = reader.getUint8();
        for (let i = 0; i < playerCount; i++) {
            const id = reader.getUint32();
            const x = reader.getFloat();
            const y = reader.getFloat();
            this.players[id].updateParams(x, y);
        }

        // 変更された部分のみを受信
        const updateFieldCount = reader.getUint16();
        for (let i = 0; i < updateFieldCount; i++) {
            const x = reader.getUint8();
            const y = reader.getUint8();
            const color = reader.getUint8();
            this.mapfield[y][x] = color;
        }
    }

    /**
     * 自己ID取得
     * @param {*} reader 
     */
    receiveMyId(reader) {
        this.myId = reader.getUint32();
    }

    /**
     * 待機情報の取得
     * @param {*} reader 
     */
    receiveWaitingInfo(reader) {
        const waitingCount = reader.getUint8();
        $("#waitingCount").text(`待機中の人数: ${waitingCount}`);
    }

    receiveMessage(reader) {
        const from = reader.getString();
        const message = reader.getString();
        const element = $(`<div>`).text(`${from}: ${message}`);
        const close = $('<div/>');
        $("#chatroom").append(element);
        $("#chatroom").append(close);
    }

    /**
     * ゲーム内カウントダウンの取得
     * @param {*} reader 
     */
    receiveGameCountDownTime(reader) {
        this.gameTime = reader.getUint16();
        this.drawingPaintCount = true;
        this.colorResult.length = 0;
        const colorCount = reader.getUint8();
        for (let i = 0; i < colorCount; i++) {
            const paint = reader.getUint16();
            this.colorResult.push(paint);
        }
        
        this.colorResultTotal = 0;
        for (let i = 0; i < this.colorResult.length; i++) {
            this.colorResultTotal += this.colorResult[i];
        }
    }

    /**
     * ゲームリザルトの取得
     * @param {*} reader 
     */
    receiveGameResult(reader) {
        $("#overlays").show();
        this.isActive = false;
        this.drawPlayer.length = 0;
        this.camera.position.x = (this.fieldSize * Config.ChipHalfSize);
        this.camera.position.y = (this.fieldSize * Config.ChipHalfSize);
        this.drawFieldSize = this.fieldSize;
    }

    /**
     * サーバへ参加依頼
     * @param {*} name 
     */
    emitPlayGame(name) {
        const writer = new Writer(true);
        writer.setUint8(1);
        writer.setString(name);
        this.send(writer);
    }

    emitSpeedUp() {
        const writer = new Writer(true);
        writer.setUint8(10);
        this.send(writer);
    }

    /**
     * サーバへ角度送信
     */
    emitAngle() {
        const x = this.mouse.getPosition().x - (this.canvasSize.width / 2);
        const y = this.mouse.getPosition().y - (this.canvasSize.height / 2);
        const angle = Math.atan2(y, x);
        const writer = new Writer(true);
        writer.setUint8(2);
        writer.setFloat32(angle);
        this.send(writer);
    }

    /**
     * サーバへチャット送信
     * @param {*} message 
     */
    emitChat(message) {
        const writer = new Writer(true);
        writer.setUint8(3);
        writer.setString(message);
        this.send(writer);
    }
}