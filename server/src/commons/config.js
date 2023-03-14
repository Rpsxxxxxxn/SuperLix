const Config = {
    // サーバ接続ポート
    Server_Port: 5000,
    // サーバ稼働FPS
    Server_FPS: 40,
    // サーバ内の1秒　(変更しないで)
    Server_Interval: 1000,
    
    // 最大プレイヤー数
    Game_MaxPlayers: 6,
    Game_FieldSize: 60,
    Game_FieldChipSize: 32,
    Game_FinishTime: 90,

    GameStep_Waiting: 0,
    GameStep_CountDown: 1,
    GameStep_Active: 2,
    GameStep_Result: 3,

    Game_BotPlayer: 10,

    Room_Max: 2,
    Room_MaxTeam: 3,
    Room_Countdown: 1,

    Mode_Team: 0,
    Mode_FFA: 1,

    Player_MaxNameLength: 10,
    Player_RespawnTime: 3,
    Player_Speed: 9.0,

    Field_None: 100,
    Field_Check: 101,
}

module.exports = Config;