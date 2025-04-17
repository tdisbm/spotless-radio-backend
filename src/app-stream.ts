import {streamManager} from "./stream/StreamManager";
import {sequelize} from "./database";
import {streamResponder} from "./redis/stream";
import {STREAMS_CHANNEL} from "./config/redis";
import {Stream} from "./database/models/Stream";


sequelize.authenticate().finally(async () => {
    const enabledStreams = await Stream.findAll({where: {enabled: true}});
    for (const stream of enabledStreams) {
        await streamManager.streamStart(stream.id);
    }
    // noinspection ES6MissingAwait
    streamResponder(STREAMS_CHANNEL, async (payload) => {
        const executorStatus = {};
        if (payload.action === "start") {
            for (const streamId of payload.streamIds) {
                executorStatus[streamId] = await streamManager.streamStart(streamId);
            }
        }
        if (payload.action === "stop") {
            for (const streamId of payload.streamIds) {
                executorStatus[streamId] = await streamManager.streamStop(streamId);
            }
        }
        return executorStatus;
    });
});
