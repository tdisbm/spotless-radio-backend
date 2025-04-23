import {sequelize} from "./database";
import {createServer} from "node:http";
import {Server as ServerHTTP} from "http";
import {Server} from "socket.io";
import {SIOUserMiddleware} from "./routes-sio/middleware/SIOUserMiddleware";
import {registerStreamHandler} from "./routes-sio/stream";


const AppServer: ServerHTTP = createServer();
const AppSocket: Server = new Server(AppServer, {
    cors: {origin: '*'}
});


AppSocket.use(SIOUserMiddleware);
AppSocket.on('error', (error) => {
    console.error('[SIO err]:', error);
});


sequelize.authenticate().finally(async () => {
    const port: string = process.env.SIO_PORT || "3030";
    AppServer.listen(port, () => console.log(`[SIO]: Running on port ${port}`));
    AppSocket.on("connect", async (socket) => {
        console.log(`[SIO] Connected ${socket.id}`);

        registerStreamHandler(AppSocket, socket);

        socket.on("disconnect", () => {
            console.log(`[SIO] Client disconnected ${socket.id}`);
        });
    });
});
