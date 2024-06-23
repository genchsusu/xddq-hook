import net from 'net';
import { Container } from "typedi";
import Queue from './queue';
import { Logger } from "winston";

class Server {
    private messageQueue: Queue<string>;
    private logger: Logger;
    private server: net.Server;

    constructor() {
        this.messageQueue = Container.get("messageQueue");
        this.logger = Container.get("logger");
        this.server = net.createServer(this.handleConnection.bind(this));
    }

    private handleConnection(socket: net.Socket): void {
        socket.on('data', this.handleData.bind(this));
        socket.on('end', this.handleEnd.bind(this));
        socket.on('error', this.handleError.bind(this));
    }

    private handleData(data: Buffer): void {
        const message = data.toString().trim();
        this.messageQueue.enqueue(message);
    }

    private handleEnd(): void {
        // Handle socket end
    }

    private handleError(err: Error): void {
        this.logger.error(`🔥 ${err.message}`);
    }

    public listen(port: number): void {
        this.server.listen(port, () => {
            this.logger.info(`✌️ Start the server, listening on port ${port}`);
            this.logger.info(`✌️ Server loaded!`);
        });
    }

    public getMessageQueue(): Queue<string> {
        return this.messageQueue;
    }
}

export { Server };
