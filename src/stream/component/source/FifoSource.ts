import path from "node:path";
import {Source} from "./Source";
import {createDirRecursive} from "../../../utils/FileSystemUtils";
import fs from "fs";
import {spawnSync} from "node:child_process";
import {FifoAudioWriter} from "../FifoAudioWriter";
import {SourceConfig} from "../types";


export abstract class FifoSource implements Source {
    public name: string;
    public fifo: string;
    protected audio
    protected buffer: FifoAudioWriter;

    protected constructor(public config: SourceConfig) {
        this.fifo = path.join(`/tmp/stream/${this.config.cid}`, `${this.config.name}.pcm`);
        this.createFifo(path.join(this.fifo));
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

    private createFifo(fifoPath: string) {
        createDirRecursive(path.dirname(fifoPath));
        if (!fs.existsSync(fifoPath)) {
            spawnSync('mkfifo', [fifoPath]);
        }
    }

    abstract write(buffer: any): void
    abstract open(): void
    abstract close(): void
    abstract args(): string[]
}