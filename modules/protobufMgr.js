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
        
        // 读取 CityMsgInfo
        const cityMsgInfoPath = path.join(basePath, 'CityMsgInfo');
        const cityMsgInfoRes = await fs.readFile(cityMsgInfoPath, 'utf-8');
        const msgInfo = JSON.parse(cityMsgInfoRes);
        this.msgInfoDict = msgInfo;

        // 读取 cmdList.json
        const cmdListPath = path.join(basePath, 'cmdList.json');
        const cmdListRes = await fs.readFile(cmdListPath, 'utf-8');
        this.cmdList = JSON.parse(cmdListRes);

        // 读取 resvCmdList.json
        const resvCmdListPath = path.join(basePath, 'resvCmdList.json');
        const resvCmdListRes = await fs.readFile(resvCmdListPath, 'utf-8');
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
        
        for (const protoName of protoFiles) {
            await this.loadParseAllCmdMsg(protoName);
        }
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

    getMsg(t, e) {
        const n = e ? this.cmdList[t] : this.resvCmdList[t];
        if (n) {
            const method = e ? n.cmMethod : n.smMethod;
            const msgClass = this.messages[`com.yq.msg.${method}`];
            return msgClass;
        }
        return null;
    }
}

export { ProtobufMgr };
