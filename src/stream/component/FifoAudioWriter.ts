import fs from "fs";
import {WriteStream} from "node:fs";


export type FifoWriterOptions = {
    fifo: string,
    sampleRate: number,
    sampleBytes: number,
    sampleDurationMs: number,
    channels: number,
    starveTimeoutMs: number
}

export class FifoAudioWriter {
    private options: FifoWriterOptions;
    private buffer: Buffer;
    private writer: WriteStream;

    private timeoutRunner: NodeJS.Timeout;
    private timeoutStarve: NodeJS.Timeout;
    private readonly chunkSize: number;
    private isRunning: boolean;
    private isIdle: boolean;

    private starveFn: () => {} | Promise<void>


    constructor(options: FifoWriterOptions) {
        this.options = {...options}
        this.buffer = Buffer.alloc(0);
        this.writer = fs.createWriteStream(this.options.fifo);
        this.chunkSize = (
            this.options.sampleRate *
            this.options.channels *
            this.options.sampleBytes *
            this.options.sampleDurationMs
        ) / 1000;
        this.createInterval();
        this.isIdle = true;
    }


    feed(chunk: Buffer) {
        if (this.isRunning) {
            this.buffer = Buffer.concat([this.buffer, chunk]);
        } else {
            console.log(`[${this.constructor.name}] Closed`);
        }
    }

    pause() {
        this.isIdle = true;
        clearTimeout(this.timeoutStarve);
        this.timeoutStarve = null;
    }

    resume() {
        this.isIdle = false;
    }

    flush() {
        this.buffer = Buffer.alloc(0);
    }

    destroy() {
        clearInterval(this.timeoutRunner);
        clearTimeout(this.timeoutStarve);
        this.timeoutRunner = null;
        this.timeoutStarve = null;
        this.isRunning = false;
        this.isIdle = true;
        this.writer.end();
    }

    private createInterval() {
        if (this.timeoutRunner) return;
        const emptyChunk: Buffer = Buffer.alloc(this.chunkSize, 0)
        this.timeoutRunner = setInterval(() => {
            if (this.isRunning && !this.isIdle && this.buffer.length) {
                const chunkLen: number = Math.min(this.chunkSize, this.buffer.length);
                const chunk: Buffer<ArrayBuffer> = this.buffer.subarray(0, chunkLen);
                this.buffer = this.buffer.subarray(chunkLen);
                this.writer.write(chunk);
                this.logChunk(chunk);
            } else {
                this.writer.write(emptyChunk);
                this.refreshStarveTimeout();
            }
        }, this.options.sampleDurationMs);
        this.isRunning = true;
    }

    public setOnStarve(starveFn: () => {}) {
        this.starveFn = starveFn;
    }

    private refreshStarveTimeout() {
        if (this.isIdle === false && !this.timeoutStarve && this.starveFn) {
            this.timeoutStarve = setTimeout(async () => {
                this.timeoutStarve = null;
                if (!this.buffer.length && this.starveFn) {
                    await this.starveFn();
                }
            }, this.options.starveTimeoutMs);
        }
    }

    private logChunk(chunk: Buffer) {
        const chunkLen: number = chunk.length
        const bufferLen: number = this.buffer.length
        const fifo: string = this.options.fifo;
        const name: string = this.constructor.name;
        console.log(`[${name}] Fed ${chunkLen} -> ${fifo}, Remaining ${bufferLen}`);
    }
}