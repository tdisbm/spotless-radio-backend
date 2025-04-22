import {sequelize} from "./database";
import {createServer} from "node:http";
import {Server as ServerHTTP} from "http";
import {Server} from "socket.io";
import {streamManager} from "./stream/StreamManager";


const AppServer: ServerHTTP = createServer();
const AppSocket: Server = new Server(AppServer, {
    cors: {origin: '*'}
});


sequelize.authenticate().finally(async () => {
    const port: string = process.env.SIO_PORT || "3030";
    AppServer.listen(port, () => {
        console.log(`[SIO]: Running on port ${port}`);
    });

    AppSocket.on("connect", (socket) => {
        socket.on("stream:mixer:open", async (streamId: string) => {
            await streamManager.openMixer(streamId);
        });

        socket.on("stream:mixer:close", async (streamId: string) => {
            await streamManager.closeMixer(streamId);
        });

        socket.on("stream:player:open", async (streamId: string) => {
            await streamManager.openPlayer(streamId);
        });

        socket.on("stream:player:pause", async (streamId: string) => {
            await streamManager.pausePlayer(streamId);
        });

        socket.on("stream:player:resume", async (streamId: string) => {
            await streamManager.resumePlayer(streamId);
        });

        socket.on("stream:player:close", async (streamId: string) => {
            await streamManager.closePlayer(streamId);
        });

        socket.on("stream:mic:write", async (event: { streamId: string, buffer: Buffer }) => {
            await streamManager.writeMic(event.streamId, event.buffer);
        });
    });
});
