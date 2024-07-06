import fs from "fs/promises";
import protobuf from "protobufjs";
import path from "path";

const resolvePath = (...segments: string[]) => path.resolve(__dirname, ...segments);

interface MsgInfo {
    [key: string]: any;
}

interface CmdList {
    [key: string]: any;
}

interface Messages {
    [key: string]: protobuf.Type;
}

class ProtobufMgr {
    private static _instance: ProtobufMgr;
    private cmdList: CmdList;
    private resvCmdList: CmdList;
    private messages: Messages;
    private msgInfoDict: MsgInfo;
    private initialized: boolean;
    private basePath: string;
    private protoPath: string;

    private constructor() {
        this.cmdList = {};
        this.resvCmdList = {};
        this.messages = {};
        this.msgInfoDict = {};
        this.initialized = false;
        this.basePath = resolvePath("../models/json");
        this.protoPath = resolvePath("../models/protobuf");
    }

    static get instance(): ProtobufMgr {
        if (!this._instance) {
            this._instance = new ProtobufMgr();
        }
        return this._instance;
    }

    async initAllMsgData(): Promise<void> {
        if (this.initialized) {
            return; // Exit if already initialized
        }
        this.initialized = true; // Set the flag to true

        // 读取Json文件
        const [cityMsgInfoRes, cmdListRes, resvCmdListRes] = await Promise.all([
            fs.readFile(path.join(this.basePath, "CityMsgInfo"), "utf-8"),
            fs.readFile(path.join(this.basePath, "cmdList.json"), "utf-8"),
            fs.readFile(path.join(this.basePath, "resvCmdList.json"), "utf-8"),
        ]);
        const msgInfo = JSON.parse(cityMsgInfoRes);
        this.msgInfoDict = msgInfo;
        this.cmdList = JSON.parse(cmdListRes);
        this.resvCmdList = JSON.parse(resvCmdListRes);

        // 初始化 msgInfoDict
        for (const key in msgInfo) {
            const cmds = msgInfo[key];
            cmds.forEach((cmd: any) => {
                const protocolKey = cmd.key;
                this.msgInfoDict[key][protocolKey] = this.cmdList[protocolKey];
            });
        }

        // 依次读取多个 proto 文件并加载到 messages 中
        const protoFiles = await fs.readdir(this.protoPath);

        await Promise.all(protoFiles.map((protoName) => this.loadParseAllCmdMsg(protoName)));
    }

    async loadParseAllCmdMsg(protoName: string): Promise<void> {
        const root = await protobuf.load(path.join(this.protoPath, protoName));
        const msgInfo = this.msgInfoDict[protoName];

        for (const key in msgInfo) {
            if (msgInfo.hasOwnProperty(key)) {
                const msg = msgInfo[key];
                if (!msg) {
                    continue;
                }

                const cmMethod = msg.cmMethod ? `com.yq.msg.CityMsg.${msg.cmMethod}` : undefined;
                const smMethod = msg.smMethod ? `com.yq.msg.CityMsg.${msg.smMethod}` : undefined;
                if (cmMethod) {
                    this.messages[cmMethod] = root.lookupType(cmMethod);
                }
                if (smMethod) {
                    this.messages[smMethod] = root.lookupType(smMethod);
                    this.resvCmdList[msg.smMsgId] = {
                        smMethod: msg.smMethod,
                        fSmMethod: msg.fSmMethod,
                    };
                }
                if (msg.byteDecode) {
                    const byteDecode = `com.yq.msg.${msg.byteDecode}`;
                    this.messages[byteDecode] = root.lookupType(byteDecode);
                }
            }
        }
    }

    getMsg(t: any, e: boolean): protobuf.Type | null {
        const n = e ? this.cmdList[t] : this.resvCmdList[t];
        if (n) {
            const method = e ? n.cmMethod : n.smMethod;
            if (e && (method === undefined || method === -1)) {
                return null;
            }
            const msgClass = this.messages[`com.yq.msg.${method}`];
            return msgClass || null;
        }
        return null;
    }
}

export { ProtobufMgr };