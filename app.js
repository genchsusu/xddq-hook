import { parse } from './modules/messages.js';
import net from 'net';
import logger from './modules/logger.js';
import { Queue } from './modules/queue.js';

const messageQueue = new Queue();

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        const message = data.toString().trim();
        messageQueue.enqueue(message);
    });

    socket.on('end', () => {});

    socket.on('error', (err) => {
        console.error('发生错误: ' + err.message);
    });
});

server.listen(1234, () => {
    console.log('服务器正在监听端口 1234');
});

const processMessages = async () => {
    while (true) {
        const messages = messageQueue.dequeueBatch(10);
        if (messages.length > 0) {
            await Promise.all(messages.map(async (message) => {
                const separatorIndex = message.indexOf(':');
                if (separatorIndex !== -1) {
                    const direction = message.substring(0, separatorIndex).trim();
                    const content = message.substring(separatorIndex + 1).trim();
                    
                    try {
                        let result = null;
                        if (direction === 'Client') {
                            result = await parse(content);
                        } else {
                            result = await parse(content, false);
                        }

                        const filteredMsgIds = [20003, 3, 13, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 131];
                        if (result && !filteredMsgIds.includes(result.msgId)) {
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

processMessages();