import {streamManager} from "./stream/StreamManager";
import {sequelize} from "./database";
import {bindStreamEvents} from "./redis/stream-sub";

sequelize.sync({force: false}).finally(async () => {
    await bindStreamEvents((streamIds) => {
        for (const streamId of streamIds) {
            streamManager.startStream(streamId).then(() => {
                console.log(`[+] Started: ${streamId}`) // push progress
            });
        }
    }, (streamIds) => {
        for (const streamId of streamIds) {
            streamManager.stopStream(streamId).then(() => {
                console.log(`[-] Stopping: ${streamId}`) // push progress
            });
        }
    });
});
