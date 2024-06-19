import { ProtobufMgr } from './protobufMgr.js';
import { Stream } from './stream.js';
import logger from './logger.js';

const protobufMgr = ProtobufMgr.instance;
await protobufMgr.initAllMsgData();

export async function parse(hexString, isRequest = true) {
  const hexBytes = Uint8Array.from(Buffer.from(hexString.replace(/[^0-9A-Fa-f]/g, ''), 'hex'));

  const stream = new Stream();
  stream.initByBuff(hexBytes, hexBytes.length);

  stream.readShort(); // 读取并跳过消息头部的短整型
  const n = stream.readInt(); // 读取消息长度
  const msgId = stream.readInt(); // 读取消息ID
  const playerId = stream.readLong(); // 读取玩家ID

  logger.debug(`msgId: ${msgId}`);
  logger.debug(`playerId: ${playerId.toString()}`);
  const s = await protobufMgr.getMsg(msgId, isRequest);
  if (!s) {
    logger.info(`Unknown message type for msgId: ${msgId}`);
  }

  const l = new Uint8Array(n - 18);
  l.set(hexBytes.subarray(18, n));

  let body = {};
  if (s) {
    logger.debug(`Retrieved message type: ${s.name}`);
    body = s.decode(l);
    logger.debug(`body: ${JSON.stringify(body, null, 2)}`);
  }

  return { msgId, playerId, body };
}

export async function create(playerId, protocol, msgBody) {
  logger.debug(`debug ${protocol} ${JSON.stringify(msgBody, null, 2)}`);
  const s = await protobufMgr.getMsg(protocol, true);

  const body = null;
  if (s) {
    body = s.encode(msgBody).finish();
  }
  
  const stream = new Stream();
  stream.init(protocol, +playerId, 18 + 256, true);
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

  const hexString = Buffer.from(stream.buff).toString('hex').toUpperCase();
  logger.debug(`Final stream buffer: ${hexString}`);

  return hexString.match(/.{1,2}/g).join('-');
}
