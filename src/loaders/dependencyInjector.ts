import { Container } from "typedi";
import logger from "./logger";
import Queue from './queue';
import { ProtobufMgr } from "../modules/protobufMgr";

export default async () => {
    try {
        Container.set("logger", logger);

        Container.set("messageQueue", new Queue<string>());

        const protobufMgr = ProtobufMgr.instance;
        await protobufMgr.initAllMsgData();
        Container.set("protobufMgr", protobufMgr);

        logger.info("✌️ Dependency injector loaded!");
    } catch (e) {
        logger.error("🔥 Error on dependency injector loader: %o", e);
        throw e;
    }
};
