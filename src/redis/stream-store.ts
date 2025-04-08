import {ActiveStreamInfo} from "../stream/ActiveStreamInfo";
import {getClient} from "./client";
import {STREAM_STORE} from "../config/redis";


export async function storeStreamInfo(streamInfo: ActiveStreamInfo) {
    const client = await getClient();
    client.set(`${STREAM_STORE}:${streamInfo.streamId}`, JSON.stringify(streamInfo))
}


export async function getStreamInfo(streamId: string) {
    const client = await getClient();
    return JSON.parse(await client.get(`${STREAM_STORE}:${streamId}`))
}


export async function getALlStreamInfo() {
    const client = await getClient();
    const streamKeys = await client.keys(`${STREAM_STORE}:*`);
    return (await client.mGet(streamKeys)).map(d => JSON.parse(d));
}

export async function discardStreamInfo(streamId: string) {
    const client = await getClient();
    client.del(`${STREAM_STORE}:${streamId}`);
}