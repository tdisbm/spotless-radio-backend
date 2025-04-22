import {v4 as uuidv4} from 'uuid';
import {getClient} from "./client";

interface StreamMessage {
    payload: any;
    responseStream: string;
    correlationId: string;
}

export async function streamRequest(
    stream: string,
    payload: any,
    timeoutMs: number = 5000
) {
    const client = await getClient();
    const correlationId = uuidv4();
    const responseStream = `response:${correlationId}`;

    const message: StreamMessage = {
        payload,
        responseStream,
        correlationId
    };

    await client.xAdd(stream, '*', { data: JSON.stringify(message) });

    try {
        await client.xGroupCreate(responseStream, 'responseGroup', '$', {
            MKSTREAM: true
        });
    } catch (err) {
        if (!err.message.includes('BUSYGROUP')) {
            throw err;
        }
    }

    return new Promise((resolve, reject) => {
        const readResponse = async () => {
            try {
                const response = await client.xReadGroup(
                    'responseGroup',
                    `consumer-${correlationId}`,
                    {
                        key: responseStream,
                        id: '>'
                    },
                    {
                        BLOCK: timeoutMs,
                        COUNT: 1
                    }
                );

                if (response) {
                    const { correlationId: receivedId, response: responseData } =
                        JSON.parse(response[0].messages[0].message.data);
                    if (receivedId === correlationId) {
                        resolve(responseData);
                        await client.xAck(responseStream, 'responseGroup', response[0].messages[0].id);
                        return;
                    }
                }
                setTimeout(readResponse, 100);
            } catch (err) {
                reject(err);
            }
        };

        readResponse().catch(err => {
            reject(err);
        });
    });
}

export async function streamResponder(
    stream: string,
    handler: (payload: any) => Promise<any>
) {
    const client = await getClient();

    try {
        await client.xGroupCreate(stream, 'requestGroup', '0', {
            MKSTREAM: true
        });
    } catch (err) {
        if (!err.message.includes('BUSYGROUP')) {
            throw err;
        }
    }

    while (true) {
        try {
            const response = await client.xReadGroup(
                'requestGroup',
                `worker-${process.pid}`,
                {
                    key: stream,
                    id: '>'
                },
                {
                    BLOCK: 0,
                    COUNT: 1
                }
            );

            if (!response) {
                await new Promise(resolve => setTimeout(resolve, 100));
                continue;
            }

            const message = response[0].messages[0];
            const messageData = message.message.data;
            const { payload, responseStream, correlationId }: StreamMessage =
                typeof messageData === 'string' ? JSON.parse(messageData) : messageData;

            try {
                const result = await handler(payload);
                await client.xAdd(responseStream, '*', {
                    data: JSON.stringify({
                        correlationId,
                        response: result
                    })
                });
                await client.xAck(stream, 'requestGroup', message.id);
            } catch (err) {
                console.error('Error processing message:', err);
            }
        } catch (err) {
            console.error('Stream read error:', err);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}