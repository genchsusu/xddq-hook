import dependencyInjectorLoader from "./dependencyInjector";
import logger from "./logger";
import { Server } from "./server";
import Consumer from "./consumer";

export default async () => {
    await dependencyInjectorLoader();

    await new Server().listen(1234);

    await Consumer();
};
