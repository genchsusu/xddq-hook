import fs from 'fs/promises';
import protobuf from 'protobufjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resolvePath = (...segments) => path.resolve(__dirname, ...segments);

class ProtobufMgr {
    constructor() {
        this.cmdList = [];
        this.resvCmdList = [];
        this.messages = {};
        this.msgInfoDict = {};
        this.initialized = false;
    }

    static get instance() {
        if (!this._instance) {
            this._instance = new ProtobufMgr();
        }
        return this._instance;
    }

    async initAllMsgData() {
        if (this.initialized) {
            return; // Exit if already initialized
        }
        this.initialized = true; // Set the flag to true
        
        const basePath = resolvePath('../models/json');

        // 读取Json文件
        const [cityMsgInfoRes, cmdListRes, resvCmdListRes] = await Promise.all([
            fs.readFile(path.join(basePath, 'CityMsgInfo'), 'utf-8'),
            fs.readFile(path.join(basePath, 'cmdList.json'), 'utf-8'),
            fs.readFile(path.join(basePath, 'resvCmdList.json'), 'utf-8')
        ]);
        const msgInfo = JSON.parse(cityMsgInfoRes);
        this.msgInfoDict = msgInfo;
        this.cmdList = JSON.parse(cmdListRes);
        this.resvCmdList = JSON.parse(resvCmdListRes);

        // 初始化 msgInfoDict
        for (const key in msgInfo) {
            const cmds = msgInfo[key];
            cmds.forEach(cmd => {
                const protocolKey = cmd.key;
                this.msgInfoDict[key][protocolKey] = this.cmdList[protocolKey];
            });
        }

        // 依次读取多个 proto 文件并加载到 messages 中
        const protoFiles = [
            "Common",
            "MountainSea",
            "WatchPlayer",
            "Login",
            "PlayerData",
            "PlayerSystem",
            "SdkReward",
            "Attribute",
            "Bag",
            "Battle",
            "Stage",
            "Invade",
            "Task",
            "Mail",
            "RedPoint",
            "UnionBounty",
            "Mall",
            "Recharge",
            "ActivityBase",
            "Cloud",
            "CloudRefine",
            "WildBoss",
            "Pet",
            "WorldMessage",
            "Tower",
            "Rank",
            "Talent",
            "Spirit",
            "PrivilegeCard",
            "BallGVG",
            "Homeland",
            "PlayerChara",
            "Palace",
            "RankBattle",
            "FundsActivity",
            "Union",
            "Destiny",
            "LuckyDrawActivity",
            "ADTimeActivity",
            "UnionAreaWar",
            "SpiritTrialActivity",
            "OptionalGiftActivity",
            "WelfareGiftActivity",
            "WeekCardActivity",
            "GoodFortuneActivity",
            "InviteFriends",
            "MessageSubscribe",
            "AdReward",
            "CutPrice",
            "HeroRank",
            "PetDreamLandActivityProto",
            "Magic",
            "WildZoneActivityProto",
            "UnionBattle",
            "EquipmentAdvance",
            "SecretTower",
            "UnionBoss",
            "MagicTreasure",
            "MallShield",
            "SeekTreasure",
            "WestTravel",
            "AskWay",
            "ForbiddenTrials",
            "StarTrial",
            "GatherEnergy",
            "GodIsland",
            "UnionFight",
            "PigEscape",
            "GoodsShield",
            "SystemShield",
            "MiniGames",
            "HolidayPresent",
            "ADGiftActivity",
            "Mark",
            "WorldRule",
            "PackagesBase",
            "SignInFundActivity",
            "ActivitysShield",
            "UnionBlessing",
            "FirstRechargeActivity",
            "NewYearRedBag",
            "FestivalCelebrations",
            "PetKernel",
            "GodDemonBattle",
        ]
        
        await Promise.all(protoFiles.map(protoName => this.loadParseAllCmdMsg(protoName)));
    }

    async loadParseAllCmdMsg(protoName) {
        const root = await protobuf.load(resolvePath(`../models/protobuf/${protoName}`));
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
                        fSmMethod: msg.fSmMethod
                    };
                }
                if (msg.byteDecode) {
                    const byteDecode = `com.yq.msg.${msg.byteDecode}`;
                    this.messages[byteDecode] = root.lookupType(byteDecode);
                }
            }
        }
    }

    getMsg(t, e, i = false) {
        const n = e ? this.cmdList[t] : this.resvCmdList[t];
        if (n) {
            const method = e ? n.cmMethod : n.smMethod;
            if (e && (method === undefined || method === -1)) {
                return null;
            }
            const msgClass = this.messages[`com.yq.msg.${method}`];
            return i ? msgClass : new msgClass();
        }
        return null;
    }
}

export { ProtobufMgr };
