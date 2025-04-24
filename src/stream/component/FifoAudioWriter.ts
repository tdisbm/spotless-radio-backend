import fs from "fs";
import { WriteStream } from "node:fs";

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
    private writer: WriteStream;
    private chunkSize: number;
    private currentVolume: number;
    private isRunning: boolean;
    private isIdle: boolean;
    private timeoutRunner: NodeJS.Timeout | null;
    private timeoutStarve: NodeJS.Timeout | null;
    private starveFn: (() => void | Promise<void>) | null = null;

    private queue: Buffer[] = [];
    private bufferedBytes: number = 0;
    private readonly emptyChunk: Buffer;
    private reuseVolumeBuffer: Buffer;

    constructor(options: FifoWriterOptions) {
        this.options = { ...options };
        this.writer = fs.createWriteStream(this.options.fifo);
        this.chunkSize = (options.sampleRate * options.channels * options.sampleBytes * options.sampleDurationMs) / 1000;
        this.currentVolume = options.initialVolume ?? 1.0;
        this.isRunning = true;
        this.isIdle = true;
        this.timeoutRunner = null;
        this.timeoutStarve = null;

        this.emptyChunk = Buffer.alloc(this.chunkSize, 0);
        this.reuseVolumeBuffer = Buffer.alloc(this.chunkSize);

        this.createInterval();
    }

    feed(chunk: Buffer) {
        if (!this.isRunning) return;
        this.queue.push(chunk);
        this.bufferedBytes += chunk.length;
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
        this.queue = [];
        this.bufferedBytes = 0;
    }

    destroy() {
        if (this.timeoutRunner) clearInterval(this.timeoutRunner);
        if (this.timeoutStarve) clearTimeout(this.timeoutStarve);
        this.writer.end();
        this.isRunning = false;
        this.isIdle = true;
    }

    async fadeIn(durationMs: number, targetVolume: number = 1.0) {
        const steps = Math.ceil(durationMs / this.options.sampleDurationMs);
        const volumeIncrement = (targetVolume - this.currentVolume) / steps;
        for (let i = 0; i < steps; i++) {
            this.currentVolume = Math.max(0, Math.min(1, this.currentVolume + volumeIncrement));
            await new Promise((resolve) => setTimeout(resolve, this.options.sampleDurationMs));
        }
        this.currentVolume = targetVolume;
    }

    async fadeOut(durationMs: number, targetVolume: number = 0.0) {
        const steps = Math.ceil(durationMs / this.options.sampleDurationMs);
        const volumeDecrement = (this.currentVolume - targetVolume) / steps;
        for (let i = 0; i < steps; i++) {
            this.currentVolume = Math.max(0, Math.min(1, this.currentVolume - volumeDecrement));
            await new Promise((resolve) => setTimeout(resolve, this.options.sampleDurationMs));
        }
        this.currentVolume = targetVolume;
    }

    public setOnStarve(starveFn: () => void | Promise<void>) {
        this.starveFn = starveFn;
    }

    private createInterval() {
        this.timeoutRunner = setInterval(() => {
            if (!this.isRunning) return;

            const chunk = this.isIdle || this.bufferedBytes === 0
                ? this.emptyChunk
                : this.drainChunk();

            const adjusted = this.applyVolume(chunk);
            this.writer.write(adjusted);
            this.refreshStarveTimeout();
        }, this.options.sampleDurationMs);
    }

    private drainChunk(): Buffer {
        let pulled: Buffer = Buffer.alloc(0);
        let pulledLen: number = 0;

        while (this.queue.length && pulledLen < this.chunkSize) {
            const next: Buffer = this.queue[0];
            const needed: number = this.chunkSize - pulledLen;

            if (next.length <= needed) {
                pulled = Buffer.concat([pulled, next]);
                pulledLen += next.length;
                this.queue.shift();
                this.bufferedBytes -= next.length;
            } else {
                pulled = Buffer.concat([pulled, next.subarray(0, needed)]);
                this.queue[0] = next.subarray(needed);
                this.bufferedBytes -= needed;
                pulledLen += needed;
            }
        }

        if (pulled.length < this.chunkSize) {
            return Buffer.concat([pulled, Buffer.alloc(this.chunkSize - pulled.length, 0)]);
        }

        return pulled;
    }

    private applyVolume(chunk: Buffer): Buffer {
        if (this.currentVolume === 1.0) return chunk;

        const bytes: number = this.options.sampleBytes;
        const channels: number = this.options.channels;
        const samples: number = chunk.length / (bytes * channels);
        const output: Buffer = this.reuseVolumeBuffer;
        for (let i = 0; i < samples; i++) {
            for (let j = 0; j < channels; j++) {
                const idx: number = i * channels * bytes + j * bytes;
                if (bytes === 2) {
                    const sample = chunk.readInt16LE(idx);
                    output.writeInt16LE(Math.round(sample * this.currentVolume), idx);
                } else if (bytes === 3) {
                    let sample: number = (chunk[idx + 2] << 16) | (chunk[idx + 1] << 8) | chunk[idx];
                    if (sample & 0x800000) sample |= 0xFF000000;
                    let adjusted: number = Math.round(sample * this.currentVolume);
                    adjusted = Math.max(-8388608, Math.min(8388607, adjusted));
                    output[idx] = adjusted & 0xFF;
                    output[idx + 1] = (adjusted >> 8) & 0xFF;
                    output[idx + 2] = (adjusted >> 16) & 0xFF;
                } else if (bytes === 4) {
                    const sample = chunk.readInt32LE(idx);
                    output.writeInt32LE(Math.round(sample * this.currentVolume), idx);
                }
            }
        }

        return Buffer.from(output);
    }

    private refreshStarveTimeout() {
        if (!this.timeoutStarve && this.starveFn && !this.isIdle) {
            this.timeoutStarve = setTimeout(async () => {
                this.timeoutStarve = null;
                if (this.bufferedBytes === 0 && this.starveFn) {
                    await this.starveFn();
                }
            }, this.options.starveTimeoutMs);
        }
    }
}
