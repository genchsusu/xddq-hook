import { Container } from 'typedi';
import { Logger } from "winston";
import { ProtobufMgr } from "./protobufMgr";
import { Stream } from "./stream";

interface ParsedMessage {
    msgId: any;
    playerId: bigint;
    body: object;
}

export async function parse(hexString: string, isRequest: boolean = true): Promise<ParsedMessage | null> {
    const protobufMgr = Container.get<ProtobufMgr>("protobufMgr");
    const logger = Container.get<Logger>("logger");
    const hexBytes = Uint8Array.from(Buffer.from(hexString.replace(/[^0-9A-Fa-f]/g, ""), "hex"));

    const stream = new Stream();
    stream.initByBuff(hexBytes, hexBytes.length);

    stream.readShort(); // 读取并跳过消息头部的短整型
    const n = stream.readInt(); // 读取消息长度
    if (n && n > 0) {
        const msgId = stream.readInt(); // 读取消息ID
        const playerId = stream.readLong(); // 读取玩家ID

        logger.debug(`msgId: ${msgId}`);
        logger.debug(`playerId: ${playerId}`);
        const s = await protobufMgr.getMsg(msgId, isRequest);
        if (!s) {
            logger.info(`Unknown message type for msgId: ${msgId}`);
        }

        const l = new Uint8Array(n - 18);
        l.set(hexBytes.subarray(18, n));

        let body = {};
        if (s != null) {
            logger.debug(`Retrieved message type: ${s.name}`);
            body = s.decode(l);
            logger.debug(`body: ${JSON.stringify(body, null, 2)}`);
        } else {
            logger.info(`Unknown message type for msgId: ${msgId}`);
            return null;
        }

        return { msgId, playerId, body };
    }
    return null;
}

export async function create(playerId: any, protocol: number, msgBody: object): Promise<string> {
    const protobufMgr = Container.get<ProtobufMgr>("protobufMgr");
    const logger = Container.get<Logger>("logger");
    logger.debug(`debug ${protocol} ${JSON.stringify(msgBody, null, 2)}`);
    const s = await protobufMgr.getMsg(protocol, true);

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
    if (stream.buff) {
        t.set(stream.buff.subarray(0, stream.offset));
    }
    stream.buff = t;
    stream.streamsize = stream.offset;

    const hexString = Buffer.from(stream.buff).toString("hex").toUpperCase();
    logger.debug(`Final stream buffer: ${hexString}`);

    return hexString.match(/.{1,2}/g)!.join("-");
}
