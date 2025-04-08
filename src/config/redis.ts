const redisHost: string = process.env.REDIS_HOST || "localhost";
const redisPort: number = +process.env.REDIS_PORT || 6379;

export const REDIS_URL = `redis://${redisHost}:${redisPort}`;
export const STREAMS_CHANNEL = "stream-channel";
export const STREAM_STORE = "stream";
