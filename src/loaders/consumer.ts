import { Container } from "typedi";
import Queue from './queue';
import { Logger } from "winston";
import { parse } from '../modules/messages';

export default async () => {
    const messageQueue = Container.get<Queue<string>>('messageQueue');
    const logger = Container.get<Logger>("logger");

    while (true) {
        const messages = messageQueue.dequeueBatch(10);
        if (messages.length > 0) {
            await Promise.all(messages.map(async (message: string) => {
                const separatorIndex = message.indexOf(':');
                if (separatorIndex !== -1) {
                    const direction = message.substring(0, separatorIndex).trim();
                    const content = message.substring(separatorIndex + 1).trim();
                    
                    try {
                        let result;
                        if (direction === 'Client') {
                            result = await parse(content);
                        } else {
                            result = await parse(content, false);
                        }

                        const filteredMsgIds = [20003, 3, 13, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 131, 132];
                        if (result !== null && result !== undefined && !filteredMsgIds.includes(result.msgId)) {
                            logger.info(`[${direction}] ${result.msgId} \n${JSON.stringify(result.body, null, 2)}`);
                        }
                    } catch (err) {
                        console.error('Error parsing message:', err);
                    }
                }
            }));
        } else {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
};
