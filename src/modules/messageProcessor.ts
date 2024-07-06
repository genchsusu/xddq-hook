import { Container } from 'typedi';
import { Logger } from "winston";
import { ProtobufMgr } from "./protobufMgr";
import { Stream } from "./stream";

export class MessageProcessor {
    private logger: Logger;
    private protobufMgr: ProtobufMgr;

    constructor() {
        this.logger = Container.get<Logger>("logger");
        this.protobufMgr = Container.get<ProtobufMgr>("protobufMgr");
    }

    async parse(hexString: string, isRequest: boolean = true) {
        const hexBytes = Uint8Array.from(Buffer.from(hexString.replace(/[^0-9A-Fa-f]/g, ""), "hex"));

        const stream = new Stream();
        stream.initByBuff(hexBytes, hexBytes.length);

        stream.readShort(); // 读取并跳过消息头部的短整型
        const n = stream.readInt(); // 读取消息长度
        if (n && n > 0) {
            const msgId = stream.readInt(); // 读取消息ID
            const playerId = stream.readLong(); // 读取玩家ID

            this.logger.debug(`msgId: ${msgId}`);
            this.logger.debug(`playerId: ${playerId}`);
            const s = await this.protobufMgr.getMsg(msgId, isRequest);

            const l = new Uint8Array(n - 18);
            l.set(hexBytes.subarray(18, n));

            let body;
            if (s != null) {
                this.logger.debug(`Retrieved message type: ${s.name}`);
                body = s.decode(l);
                this.logger.debug(`body: ${JSON.stringify(body, null, 2)}`);
                return { msgId, playerId, body };
            } else {
                this.logger.info(`Unknown msgId: ${msgId}, hexString: ${hexString}`);
            }
        }
        return null;
    }

    async create(playerId: any, protocol: number, msgBody: any): Promise<string> {
        this.logger.debug(`debug ${protocol} ${JSON.stringify(msgBody, null, 2)}`);
        const s = await this.protobufMgr.getMsg(protocol, true);

        let body: Uint8Array | null = null;
        if (s) {
            body = s.encode(msgBody).finish();
        }

        const stream = new Stream();
        stream.init(protocol, Number(playerId), 18 + 256, true);
        stream.writeShort(29099);
        stream.writeInt(50);
        stream.writeInt(protocol);
        stream.writeLong(playerId);

        if (body) {
            stream.writeBytes(body, 18);
        }
        stream.writeInt(stream.offset, 2);

        const t = new Uint8Array(stream.offset);
        t.set(stream.buff.subarray(0, stream.offset));
        stream.buff = t;
        stream.streamsize = stream.offset;

        const hexString = Buffer.from(stream.buff).toString("hex").toUpperCase();
        this.logger.debug(`Final stream buffer: ${hexString}`);

        return hexString.match(/.{1,2}/g)!.join("-");
    }
}
