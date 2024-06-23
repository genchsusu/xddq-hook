import Long from "long";
import { Container } from 'typedi';
import { Logger } from "winston";
import { ProtobufMgr } from "./protobufMgr";

class Stream {
    buff: Uint8Array | null;
    msgId: number;
    msgLength: number;
    playerId: number;
    offset: number;
    streamsize: number;
    littleEndian: boolean;
    pbMsg: any;
    protobufMgr: ProtobufMgr;
    logger: Logger;

    constructor() {
        this.buff = null;
        this.msgId = 0;
        this.msgLength = 0;
        this.playerId = 0;
        this.offset = 0;
        this.streamsize = 0;
        this.littleEndian = false; // IsRequest
        this.pbMsg = null;
        this.protobufMgr = Container.get("protobufMgr");
        this.logger = Container.get<Logger>("logger");
    }

    init(msgId: number, playerId: number, size: number, littleEndian: boolean = false): void {
        this.msgId = msgId;
        this.playerId = playerId;
        this.buff = new Uint8Array(size);
        this.offset = 0;
        this.streamsize = size;
        this.littleEndian = littleEndian;
        this.pbMsg = this.protobufMgr.getMsg(this.msgId, littleEndian);
    }

    stringToBytes(t: string): number[] {
        const e: number[] = [];
        for (let i = 0; i < t.length; i++) {
            const n = t.substr(i, 1);
            e.push(parseInt(String(n)));
        }
        return e;
    }

    initByStr(t: string): void {
        const e = this.stringToBytes(t);
        this.initByBuff(new Uint8Array(e), e.length);
    }

    initByBuff(t: Uint8Array, e: number): void {
        if (t) {
            this.buff = t;
        }
        this.offset = 0;
        this.streamsize = e;
    }

    writeShort(t: number, e?: number): void {
        this.resize(this.offset + 2);
        if (e === undefined) e = this.offset;
        if (this.littleEndian) {
            this.buff![e + 1] = (t & 65280) >>> 8;
            this.buff![e] = t & 255;
        } else {
            this.buff![e] = (t & 65280) >>> 8;
            this.buff![e + 1] = t & 255;
        }
        if (e === this.offset) this.offset += 2;
    }

    writeInt(t: number, e?: number): void {
        this.resize(this.offset + 4);
        if (e === undefined) e = this.offset;
        if (this.littleEndian) {
            this.buff![e + 3] = (t >>> 24) & 255;
            this.buff![e + 2] = (t >>> 16) & 255;
            this.buff![e + 1] = (t >>> 8) & 255;
            this.buff![e] = t & 255;
        } else {
            this.buff![e] = (t >>> 24) & 255;
            this.buff![e + 1] = (t >>> 16) & 255;
            this.buff![e + 2] = (t >>> 8) & 255;
            this.buff![e + 3] = t & 255;
        }
        if (e === this.offset) this.offset += 4;
    }

    writeLong(t: Long | number | string, e?: number): void {
        if (!t) t = Long.fromNumber(0);
        this.resize(this.offset + 8);
        if (e === undefined) e = this.offset;
        if (typeof t === "number") {
            t = Long.fromNumber(t);
        } else if (typeof t === "string") {
            t = Long.fromString(t);
        }
        const o = t.low;
        const r = t.high;
        if (this.littleEndian) {
            this.buff![e + 3] = (o >>> 24) & 255;
            this.buff![e + 2] = (o >>> 16) & 255;
            this.buff![e + 1] = (o >>> 8) & 255;
            this.buff![e] = o & 255;
            e += 4;
            this.buff![e + 3] = (r >>> 24) & 255;
            this.buff![e + 2] = (r >>> 16) & 255;
            this.buff![e + 1] = (r >>> 8) & 255;
            this.buff![e] = r & 255;
        } else {
            this.buff![e] = (r >>> 24) & 255;
            this.buff![e + 1] = (r >>> 16) & 255;
            this.buff![e + 2] = (r >>> 8) & 255;
            this.buff![e + 3] = r & 255;
            e += 4;
            this.buff![e] = (o >>> 24) & 255;
            this.buff![e + 1] = (o >>> 16) & 255;
            this.buff![e + 2] = (o >>> 8) & 255;
            this.buff![e + 3] = o & 255;
        }
        if (e === this.offset) this.offset += 8;
    }

    writeBytes(bytes: Uint8Array, e?: number): void {
        if (e === undefined) e = this.offset;
        this.resize(this.offset + bytes.length);
        for (let i = 0; i < bytes.length; i++) {
            this.buff![e + i] = bytes[i];
        }
        this.offset += bytes.length;
    }

    writePbBuff(t: any, e?: number): void {
        if (e === undefined) e = this.offset;
        this.resize(this.offset + t.limit);
        for (let i = 0; i < t.limit; i++) {
            this.buff![e + i] = t.view[i];
        }
        this.offset += t.limit;
    }

    readShort(t?: number): number | null {
        if (t === undefined) t = this.offset;
        let i = 0;
        if (this.littleEndian) {
            i = this.buff![t];
            i |= this.buff![t + 1] << 8;
        } else {
            i = this.buff![t] << 8;
            i |= this.buff![t + 1];
        }
        if ((i & 32768) === 32768) i = -(65535 - i + 1);
        if (t === this.offset) this.offset += 2;
        return i;
    }

    readInt(t?: number): number | null {
        if (t === undefined) t = this.offset;
        let i = 0;
        if (this.offset + 4 > this.streamsize) return null;
        if (this.littleEndian) {
            i = this.buff![t + 2] << 16;
            i |= this.buff![t + 1] << 8;
            i |= this.buff![t];
            i += (this.buff![t + 3] << 24) >>> 0;
        } else {
            i = this.buff![t + 1] << 16;
            i |= this.buff![t + 2] << 8;
            i |= this.buff![t + 3];
            i += (this.buff![t] << 24) >>> 0;
        }
        i |= 0;
        if (t === this.offset) this.offset += 4;
        return i;
    }

    readLong(t?: number): any {
        if (t === undefined) t = this.offset;
        if (this.offset + 8 > this.streamsize) return null;
        let o = 0;
        let r = 0;
        if (this.littleEndian) {
            o = this.buff![t + 2] << 16;
            o |= this.buff![t + 1] << 8;
            o |= this.buff![t];
            o += (this.buff![t + 3] << 24) >>> 0;
            t += 4;
            r = this.buff![t + 2] << 16;
            r |= this.buff![t + 1] << 8;
            r |= this.buff![t];
            r += (this.buff![t + 3] << 24) >>> 0;
        } else {
            r = this.buff![t + 1] << 16;
            r |= this.buff![t + 2] << 8;
            r |= this.buff![t + 3];
            r += (this.buff![t] << 24) >>> 0;
            t += 4;
            o = this.buff![t + 1] << 16;
            o |= this.buff![t + 2] << 8;
            o |= this.buff![t + 3];
            o += (this.buff![t] << 24) >>> 0;
        }
        const eLong = new Long(o, r, false).toSigned();
        if (t === this.offset) this.offset += 8;
        return eLong;
    }

    readPbBuff(): Uint8Array | null {
        const t = this.readInt();
        return this.readBuff(t!);
    }

    readBuff(t: number): Uint8Array | null {
        if (t == null) return null;
        if (this.offset + t > this.streamsize) return null;
        const e = new Uint8Array(t);
        e.set(this.buff!.slice(this.offset, this.offset + t));
        this.offset += t;
        return e;
    }

    set(t: string, e: any): void {
        if (this.pbMsg) {
            this.pbMsg.set(t, e);
        } else {
            this.logger.debug("stream pbMsg is null");
        }
    }

    resize(t: number): void {
        if (this.streamsize < t) {
            const e = new Uint8Array(2 * t);
            e.set(this.buff!);
            this.buff = e;
            this.streamsize = 2 * t;
        }
    }

    parseSendData(): void {
        if (this.pbMsg) {
            this.writePbBuff(this.pbMsg.encode());
        }
        this.writeInt(this.offset, 2);
        const t = new Uint8Array(this.offset);
        t.set(this.buff!.subarray(0, this.offset));
        this.buff = t;
        this.streamsize = this.offset;
    }
}

export { Stream };
