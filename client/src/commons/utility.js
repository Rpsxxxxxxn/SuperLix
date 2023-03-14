export class Reader {
    constructor(view, offset, littleEndian) {
        this.view = view;
        this.offset = offset || 0;
        this.endian = littleEndian;
    }

    getInt8() {
        return this.view.getInt8(this.offset++, this.endian);
    }

    getInt16() {
        let result = this.view.getInt16(this.offset, this.endian);
        this.skipBytes(2);
        return result;
    }

    getInt24() {
        let result = this.view.getInt16(this.offset, this.endian);
        this.skipBytes(3);
        return result;
    }

    getInt32() {
        let result = this.view.getInt32(this.offset, this.endian);
        this.skipBytes(4);
        return result;
    }

    getUint8() {
        return this.view.getUint8(this.offset++, this.endian);
    }

    getUint16() {
        let result = this.view.getUint16(this.offset, this.endian);
        this.skipBytes(2);
        return result;
    }

    getUint24() {
        let result = this.view.getUint16(this.offset, this.endian);
        this.skipBytes(3);
        return result;
    }

    getUint32() {
        let result = this.view.getUint32(this.offset, this.endian);
        this.skipBytes(4);
        return result;
    }

    getFloat() {
        let result = this.view.getFloat32(this.offset, this.endian);
        this.skipBytes(4);
        return result;
    }

    getDouble() {
        let result = this.view.getFloat64(this.offset, this.endian);
        this.skipBytes(8);
        return result;
    }

    getString() {
        let string = "";
        let count = 0;
        const length = this.getUint16();
        while (count < length) {
            string += String.fromCharCode(this.getUint16());
            count += 1;
        }
        return string;
    }

    skipBytes(length) {
        this.offset += length;
    }
}

export class Writer {
    constructor(littleEndian) {
        this.buffer = new DataView(new ArrayBuffer(8));
        this.endian = littleEndian;
        this.reset();
    }

    reset() {
        this.view = [];
        this.offset = 0;
    }

    setUint8(a) {
        if (a >= 0 && a < 256) this.view.push(a);
    }

    setInt8(a) {
        if (a >= -128 && a < 128) this.view.push(a);
    }

    setUint16(a) {
        this.buffer.setUint16(0, a, this.endian);
        this.skipBytes(2);
    }

    setInt16(a) {
        this.buffer.setInt16(0, a, this.endian);
        this.skipBytes(2);
    }

    setUint32(a) {
        this.buffer.setUint32(0, a, this.endian);
        this.skipBytes(4);
    }

    setInt32(a) {
        this.buffer.setInt32(0, a, this.endian);
        this.skipBytes(4);
    }

    setFloat32(a) {
        this.buffer.setFloat32(0, a, this.endian);
        this.skipBytes(4);
    }

    setFloat64(a) {
        this.buffer.setFloat64(0, a, this.endian);
        this.skipBytes(8);
    }

    skipBytes(a) {
        for (let i = 0; i < a; i++) {
            this.view.push(this.buffer.getUint8(i));
        }
    }

    setString(s) {
        this.setUint16(s.length);
        for (let i = 0; i < s.length; i++) {
            this.setUint16(s.charCodeAt(i));
        }
    }

    build() {
        return new Uint8Array(this.view);
    }
}

export class Vector2 {
    constructor(x, y) {
        this.x = 0 | x;
        this.y = 0 | y;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
    }

    add(value) {
        this.x += value.x;
        this.y += value.y;
    }

    subtract(value) {
        this.x -= value.x;
        this.y -= value.y;
    }

    multiply(value) {
        this.x *= value.x;
        this.y *= value.y;
    }

    divide(value) {
        this.x /= value.x;
        this.y /= value.y;
    }

    squareMagnitude() {
        return this.x * this.x + this.y * this.y;
    }

    magnitude() {
        return Math.sqrt(this.squareMagnitude());
    }

    normalize() {
        let magnitude = this.magnitude();
        this.x /= magnitude;
        this.y /= magnitude;
    }

    normalized(x, y) {
        let result = new Vector2(x, y);
        result.normalize();
        return result;
    }

    distance(value) {
        let tx = value.x - this.x;
        let ty = value.y - this.y;
        return Math.sqrt(tx * tx + ty * ty);
    }

    equals(value) {
        return (this.x == value.x && this.y == value.y);
    }


    dot(value) {
        return this.x * value.x + this.y * value.y;
    }

    clamp(min, max) {
        this.x = Math.max(Math.min(this.x, max), min);
        this.y = Math.max(Math.min(this.y, max), min);
    }

    clear() {
        this.x = this.y = 0;
    }

    static lerp(a, b, t) {
        return new Vector2(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t)
    }
    
    static clone(value) {
        return new Vector2(value.x, value.y);
    }

    static subtract(a, b) {
        let result = Vector2.clone(a).subtract(b);
        return result;
    }

    static Zero() {
        return new Vector2(0, 0);
    }

    static One() {
        return new Vector2(1, 1);
    }

    static Up() {
        return new Vector2(0, 1);
    }
    
    static Down() {
        return new Vector2(0, -1);
    }
    
    static Left() {
        return new Vector2(-1, 0);
    }
    
    static Right() {
        return new Vector2(1, 0);
    }
}

export class Keyboard {
    constructor() {
        this.newkey = new Array(256);
        this.oldkey = new Array(256);
        document.addEventListener("keydown", this.onKeyDown.bind(this));
        document.addEventListener("keyup", this.onKeyUp.bind(this));
    }

    update() {
        for (let i = 0; i < 256; i++) {
            this.oldkey[i] = this.newkey[i];
        }
    }

    /**
     * キーの押し込み
     * @param {*} event 
     */
    onKeyDown(event) {
        for (let i = 0; i < 256; i++) {
            if (event.keyCode == i) {
                this.newkey[i] = true;
            }
        }
    }

    /**
     * キーの押上
     * @param {*} event 
     */
    onKeyUp(event) {
        for (let i = 0; i < 256; i++) {
            if (event.keyCode == i) {
                this.newkey[i] = false;
            }
        }
    }

    /**
     * キーの取得
     * @param {*} keyCode 
     */
    getKeyDown(keyCode) {
        return this.newkey[keyCode];
    }

    /**
     * キーの取得
     * @param {*} keyCode 
     */
    getKeyUp(keyCode) {
        return !this.newkey[keyCode] && this.oldkey[keyCode];
    }

    /**
     * キーの取得
     * @param {*} keyCode 
     */
    getKeyPressed(keyCode) {
        return this.newkey[keyCode] && !this.oldkey[keyCode];
    }
}

export class Mouse {
    constructor() {
        this.position = Vector2.Zero();
        this.zoom = 0.5;
        this.button = [];
        this.oldButton = [];
        document.addEventListener("mousemove", this.onMouseMove.bind(this));
        document.addEventListener("mousedown", this.onMouseDown.bind(this));
        document.addEventListener("mouseup", this.onMouseUp.bind(this));
        document.addEventListener("mousewheel", this.onMouseWheel.bind(this));
    }

    update() {
        for (let i = 0; i < 3; i++) {
            this.oldButton[i] = this.button[i];
        }
    }

    /**
     * マウスの移動
     * @param {*} event 
     */
    onMouseMove(event) {
        this.position.set(event.clientX, event.clientY);
    }

    /**
     * マウスクリック押込
     * @param {*} event 
     */
    onMouseDown(event) {
        for (let i = 0; i < 3; i++) {
            if (event.button === i) {
                this.button[i] = true;
            }
        }
    }

    /**
     * マウスクリック押上
     * @param {*} event 
     */
    onMouseUp(event) {
        for (let i = 0; i < 3; i++) {
            if (event.button === i) {
                this.button[i] = false;
            }
        }
    }

    onMouseWheel(event) {
        this.zoom *= Math.pow(.9, event.wheelDelta / -120 || event.detail || 0);
        this.zoom = Math.min(Math.max(this.zoom, 0.5), 4);
    }

    getZoom() {
        return this.zoom;
    }

    getPressed(code) {
        return this.button[code] && !this.oldButton[code];
    }

    /**
     * マウスの位置取得
     */
    getPosition() {
        return this.position;
    }

    getLeftClick() {
        return true;
    }

    getRightClick() {
        return true;
    }
}

// 'createTouch' in document
export class Touch {
    constructor() {
        document.addEventListener('touchstart', this.onTouchStart.bind(this), false);
        document.addEventListener('touchmove', this.onTouchMove.bind(this), false);
        document.addEventListener('touchend', this.onTouchEnd.bind(this), false);
    }

    onTouchStart() {

    }
    
    onTouchMove() {

    }
    
    onTouchEnd() {

    }
}