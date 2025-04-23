import {getClient} from "./client";
import {STREAM_STORE} from "../config/redis";


export async function update(cid: string, key: string, state: any) {
    const client = await getClient();
    const rKey: string = `${STREAM_STORE}:${cid}:${key}`;
    if (state !== null) {
        client.set(rKey, JSON.stringify({key, ...state}));
    } else {
        client.del(rKey);
    }
}

export async function read() {
    const client = await getClient();
    const keys: string[] = await client.keys(`${STREAM_STORE}:*`);
    const merged: {} = {};

    const streamData = keys.length
        ? client.mGet(keys)
        : [];

    for (const data of streamData) {
        const cid = data.cid;
        const key = data.key;
        if (!merged.hasOwnProperty(cid)) {
            merged[cid] = {unclassified: []};
        }
        if (!key) {
            merged[cid].unclassified.push(data);
        } else {
            merged[cid][key] = data;
        }
    }
    return merged
}

