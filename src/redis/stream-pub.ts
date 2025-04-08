import {RedisClientType} from "redis";
import {STREAMS_CHANNEL} from "../config/redis";
import {getClient} from "./client";


export async function startStreams(streamIds: string[]) {
    const client: RedisClientType = await getClient();
    await client.publish(STREAMS_CHANNEL, JSON.stringify({action: "start", streamIds}));
}


export async function stopStreams(streamIds: string[]) {
    const client: RedisClientType = await getClient();
    await client.publish(STREAMS_CHANNEL, JSON.stringify({action: "stop", streamIds}));
}