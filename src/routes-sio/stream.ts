import {streamManager} from "../stream/StreamManager";
import {update} from "../redis/stream-store";


export function registerStreamHandler(io, socket) {
    if (!socket.userIsAdmin) {
        console.log('Not an admin, stream handlers unmapped')
        return
    }

    socket.on("stream:mixer:open", async (streamId: string) => {
        const {bundle, isCreated} = await streamManager.openMixer(streamId);
        await update(streamId, 'mixer', {isOpen: true})
        io.emit("stream:mixer:info", {streamId, state: {isOpen: true}});
        if (isCreated) {
            await bundle.player.fadeIn(0, 1);
            await bundle.mic.fadeIn(0, 0.01);
            bundle.player.notifier.subscribe((state) => {
                update(bundle.player.config.cid, bundle.player.config.name, state);
                io.emit("stream:player:info", {streamId, state});
            });
            bundle.mic.notifier.subscribe((state) => {
                if (state) {
                    update(bundle.mic.config.cid, bundle.mic.config.name, state);
                    bundle.player.fadeOut(1500, 0.2);
                    bundle.mic.fadeIn(200, 2.5);
                } else {
                    bundle.player.fadeIn(1500, 1);
                    bundle.mic.fadeOut(500, 0.01);
                }
                for (const [id, socket] of io.sockets.sockets) {
                    if (socket.userIsAdmin) {
                        socket.emit("stream:mic:info", {streamId, state});
                    }
                }
            })
        }
    });

    socket.on("stream:mixer:close", async (streamId: string) => {
        await streamManager.closeMixer(streamId);
        await update(streamId, 'mixer', null);
        io.emit("stream:mixer:info", {streamId, state: {isOpen: false}});
    });

    socket.on("stream:player:open", async (streamId: string, trackId: string) => {
        await streamManager.openPlayer(streamId, trackId);
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
}
