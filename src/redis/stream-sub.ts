import {STREAMS_CHANNEL} from "../config/redis";
import {getClient} from "./client";


export async function bindStreamEvents(onStart: (streamIds: string[]) => void, onStop: (streamIds: string[]) => void) {
    const pub = await getClient();
    const sub = pub.duplicate();
    await sub.connect();
    await sub.subscribe(STREAMS_CHANNEL, (serialized: string) => {
        const event: {action: string, streamIds: string[]} = JSON.parse(serialized);
        if (event.action === "start") {
            onStart(event.streamIds);
        } else if (event.action === "stop") {
            onStop(event.streamIds);
        }
    });
}
