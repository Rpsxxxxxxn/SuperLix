export const Config = {
    ClientVersion: '1.0.2',
    ConnectAddress: 'ws://localhost:5000',
    //ConnectAddress: 'ws://192.168.0.105:5000',
    //ConnectAddress: 'ws://118.27.105.43:5000',
    // 基本は広さ変えない
    FieldSize: 100,
    ChipSize: 32,
    ChipHalfSize: 16,
    DrawFieldSize: 15,
    EmitMouseSpeed: 1000/30,
};

export const MapType = {
    None: 100,
    Check: 101,
}