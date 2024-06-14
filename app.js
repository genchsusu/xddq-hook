import { parse } from './modules/messages.js';
import net from 'net';
import logger from './modules/logger.js';

const server = net.createServer((socket) => {
    // console.log('Client connected');
    socket.on('data', async (data) => {
        const message = data.toString().trim();
    
        const separatorIndex = message.indexOf(':');
        if (separatorIndex !== -1) {
            const direction = message.substring(0, separatorIndex).trim();
            const content = message.substring(separatorIndex + 1).trim();
            
            let result = null;
            if (direction === 'Client') {
                result = await parse(content);
            } else {
                result = await parse(content, false);
                // logger.info(`data: ${data}`)
            }
            const filteredMsgIds = [ 20003, 3, 13, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 131 ];
            if (result && !filteredMsgIds.includes(result.msgId)) {
                logger.info(`[${direction}] ${result.msgId} \n${JSON.stringify(result.body, null, 2)}`);
            }
            
        }
    });

    socket.on('end', () => {
    // console.log('Client disconnected');
    });


    socket.on('error', (err) => {
        console.error('发生错误: ' + err.message);
    });
});


server.listen(1234, () => {
    console.log('服务器正在监听端口 1234');
});