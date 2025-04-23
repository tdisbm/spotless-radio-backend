import fs from "fs";
import path from "node:path";
import {Source} from "./Source";
import {createFifo} from "../../../utils/FileSystemUtils";
import {FifoAudioWriter} from "../FifoAudioWriter";
import {SourceConfig} from "../types";
import {BehaviorSubject} from "rxjs";


export abstract class FifoSource implements Source {
    public fifo: string;
    public notifier: BehaviorSubject<any>;
    protected audio
    protected buffer: FifoAudioWriter;

    protected constructor(public config: SourceConfig) {
        this.fifo = path.join(`/tmp/stream/${this.config.cid}`, `${this.config.name}.pcm`);
        createFifo(path.join(this.fifo));
        this.notifier = new BehaviorSubject<any>(null);
        this.buffer = new FifoAudioWriter({
            fifo: this.fifo,
            sampleRate: this.config.sampleRate,
            sampleBytes: this.config.sampleBytes,
            sampleDurationMs: this.config.sampleDurationMs,
            channels: this.config.channels,
            starveTimeoutMs: this.config.starveTimeoutMs
        });
    }

    destroy() {
        this.buffer.destroy();
        fs.unlinkSync(this.fifo);
    }

    public async fadeIn(duration: number, volume: number) {
        await this.buffer.fadeIn(duration, volume);
    }

    public async fadeOut(duration: number, volume: number) {
        await this.buffer.fadeOut(duration, volume);
    }

    abstract write(buffer: any): void

    abstract open(): void

    abstract close(): void

    abstract args(): string[]
}