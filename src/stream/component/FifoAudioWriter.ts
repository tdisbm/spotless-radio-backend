import fs from "fs";
import {WriteStream} from "node:fs";

export type FifoWriterOptions = {
    fifo: string;
    sampleRate: number;
    sampleBytes: number;
    sampleDurationMs: number;
    channels: number;
    starveTimeoutMs: number;
    initialVolume?: number;
};

export class FifoAudioWriter {
    private options: FifoWriterOptions;
    private buffer: Buffer;
    private writer: WriteStream;

    private timeoutRunner: NodeJS.Timeout | null;
    private timeoutStarve: NodeJS.Timeout | null;
    private readonly chunkSize: number;
    private isRunning: boolean;
    private isIdle: boolean;
    private currentVolume: number;

    private starveFn: (() => void | Promise<void>) | null;

    constructor(options: FifoWriterOptions) {
        this.options = {...options};
        this.buffer = Buffer.alloc(0);
        this.writer = fs.createWriteStream(this.options.fifo);
        this.chunkSize =
            (this.options.sampleRate *
                this.options.channels *
                this.options.sampleBytes *
                this.options.sampleDurationMs) /
            1000;
        this.currentVolume = options.initialVolume !== undefined ? options.initialVolume : 1.0;
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
        if (this.timeoutStarve) {
            clearTimeout(this.timeoutStarve);
            this.timeoutStarve = null;
        }
    }

    resume() {
        this.isIdle = false;
    }

    flush() {
        this.buffer = Buffer.alloc(0);
    }

    destroy() {
        if (this.timeoutRunner) {
            clearInterval(this.timeoutRunner);
            this.timeoutRunner = null;
        }
        if (this.timeoutStarve) {
            clearTimeout(this.timeoutStarve);
            this.timeoutStarve = null;
        }
        this.isRunning = false;
        this.isIdle = true;
        this.writer.end();
    }

    async fadeIn(durationMs: number, targetVolume: number = 1.0) {
        const steps = Math.ceil(durationMs / this.options.sampleDurationMs);
        const volumeIncrement = (targetVolume - this.currentVolume) / steps;

        for (let i = 0; i < steps; i++) {
            this.currentVolume += volumeIncrement;
            this.currentVolume = Math.max(0, Math.min(1, this.currentVolume)); // Clamp volume
            await new Promise((resolve) => setTimeout(resolve, this.options.sampleDurationMs));
        }
        this.currentVolume = targetVolume; // Ensure the final volume is set
        console.log(`[${this.constructor.name}] Fade in complete to ${this.currentVolume}`);
    }

    async fadeOut(durationMs: number, targetVolume: number = 0.0) {
        const steps = Math.ceil(durationMs / this.options.sampleDurationMs);
        const volumeDecrement = (this.currentVolume - targetVolume) / steps;

        for (let i = 0; i < steps; i++) {
            this.currentVolume -= volumeDecrement;
            this.currentVolume = Math.max(0, Math.min(1, this.currentVolume)); // Clamp volume
            await new Promise((resolve) => setTimeout(resolve, this.options.sampleDurationMs));
        }
        this.currentVolume = targetVolume; // Ensure the final volume is set
        console.log(`[${this.constructor.name}] Fade out complete to ${this.currentVolume}`);
    }

    public setOnStarve(starveFn: () => void | Promise<void>) {
        this.starveFn = starveFn;
    }

    private applyVolume(chunk: Buffer): Buffer {
        if (this.currentVolume === 1.0) {
            return chunk;
        }

        const sampleSizeBytes = this.options.sampleBytes;
        const numChannels = this.options.channels;
        const numSamples = chunk.length / (sampleSizeBytes * numChannels);
        const outputBuffer = Buffer.alloc(chunk.length);

        for (let i = 0; i < numSamples; i++) {
            for (let j = 0; j < numChannels; j++) {
                const sampleStart = i * numChannels * sampleSizeBytes + j * sampleSizeBytes;

                if (sampleSizeBytes === 2) {
                    const sample = chunk.readInt16LE(sampleStart);
                    const adjustedSample = Math.round(sample * this.currentVolume);
                    outputBuffer.writeInt16LE(adjustedSample, sampleStart);
                } else if (sampleSizeBytes === 3) {
                    const byte1 = chunk[sampleStart];
                    const byte2 = chunk[sampleStart + 1];
                    const byte3 = chunk[sampleStart + 2];
                    let sample = (byte3 << 16) | (byte2 << 8) | byte1;
                    if (sample & 0x800000) {
                        sample |= 0xFF000000; // Sign extend
                    }
                    const adjustedSample = Math.round(sample * this.currentVolume);
                    const clampedSample = Math.max(-8388608, Math.min(8388607, adjustedSample));
                    outputBuffer[sampleStart] = clampedSample & 0xFF;
                    outputBuffer[sampleStart + 1] = (clampedSample >> 8) & 0xFF;
                    outputBuffer[sampleStart + 2] = (clampedSample >> 16) & 0xFF;
                } else if (sampleSizeBytes === 4) {
                    const sample = chunk.readInt32LE(sampleStart);
                    const adjustedSample = Math.round(sample * this.currentVolume);
                    outputBuffer.writeInt32LE(adjustedSample, sampleStart);
                }
            }
        }

        return outputBuffer;
    }

    private createInterval() {
        if (this.timeoutRunner) return;
        const emptyChunk: Buffer = Buffer.alloc(this.chunkSize, 0);
        this.isRunning = true;
        this.timeoutRunner = setInterval(() => {
            if (this.isRunning && !this.isIdle && this.buffer.length) {
                const chunkLen: number = Math.min(this.chunkSize, this.buffer.length);
                const originalChunk: Buffer = this.buffer.subarray(0, chunkLen);
                const adjustedChunk: Buffer = this.applyVolume(originalChunk);
                this.buffer = this.buffer.subarray(chunkLen);
                this.writer.write(adjustedChunk);
                this.logChunk(originalChunk.length, this.buffer.length);
            } else {
                this.writer.write(emptyChunk);
                this.refreshStarveTimeout();
            }
        }, this.options.sampleDurationMs);
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

    private logChunk(chunkLen: number, bufferLen: number) {
        const fifo: string = this.options.fifo;
        const name: string = this.constructor.name;
        console.log(`[${name}] Fed ${chunkLen} -> ${fifo}, Remaining ${bufferLen}, Volume ${this.currentVolume}`);
    }
}