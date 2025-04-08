import { createClient } from 'redis';
import {REDIS_URL} from "../config/redis";


let clientInstance = null;

export async function getClient() {
    if (clientInstance && clientInstance.isOpen) {
        return clientInstance;
    }

    const client = createClient({ url: REDIS_URL });

    client.on('connect', () => {
        console.log('🟢 Redis client connecting...');
    });

    client.on('ready', () => {
        console.log('✅ Redis client is ready!');
    });

    client.on('reconnecting', (delay) => {
        console.log(`♻️  Redis reconnecting in ${delay}ms...`);
    });

    client.on('error', (err) => {
        console.error('❌ Redis error:', err);
    });

    client.on('end', () => {
        console.warn('🛑 Redis connection closed.');
    });

    try {
        await client.connect();
        clientInstance = client;
        return clientInstance;
    } catch (err) {
        console.error('🔥 Failed to connect to Redis:', err);
        setTimeout(() => {
            console.log('⏱ Retrying Redis connection...');
            getClient();
        }, 2000);
    }
}
